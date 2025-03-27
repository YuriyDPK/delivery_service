// RouteDetailsScreen.tsx
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  RefreshControl,
  Dimensions,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import {OrderItem} from './componentsRouteDetailsScreen/OrderItem';
import {QRButton} from './componentsRouteDetailsScreen/QRButton';
// import Geolocation from 'react-native-geolocation-service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {API_BASE_URL} from '../../config';

import MdiLocationPath from '../../assets/images/mdi_location-path.svg';
import MdiLocationPathActive from '../../assets/images/mdi_location-path_active.svg';
import LocationWhiteIcon from '../../assets/images/location-white.svg';

const {width} = Dimensions.get('window');
const baseWidth = 375; // базовая ширина для вычислений
const scale = width / baseWidth;

function scaledSize(size: number) {
  return Math.round(size * scale);
}

export default function RouteDetailsScreen({route, navigation}) {
  const {route: routeDetails} = route.params;
  const routeId = routeDetails.id.trim().replace(/\+$/, '');
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAddresses, setSelectedAddresses] = useState([]);
  const [refreshing, setRefreshing] = useState(false); // Состояние для pull-to-refresh
  const [isLoading, setIsLoading] = useState(false);
  const [isIconActive, setIsIconActive] = useState(false); // Состояние иконки

  // const handleIconPress = () => {
  //   setIsIconActive((prev) => !prev); // Переключаем состояние иконки
  // };

  // Функция для загрузки заказов
  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Ошибка', 'Не удалось получить ID пользователя');
        setIsLoading(false);
        return;
      }
      // console.log(routeId); --- delete

      const response = await axios.get(`${API_BASE_URL}/rest/orders/getList/`, {
        params: {
          USER_ID: userId,
          ROUTE_ID: routeId,
          API_KEY:
            '0TQVewPoqFubLhUinC1Mkm6boQC5RJ8M5wvknLe-LXhuBbqLt5PYngZSiERK81E3',
        },
      });

      if (
        response.data &&
        response.data.RESULT &&
        response.data.RESULT.length > 0
      ) {
        setOrders(response.data.RESULT);
        setFilteredOrders(response.data.RESULT); // Фильтр совпадает с полным списком
      } else {
        Alert.alert('Ошибка', 'Не удалось загрузить заказы, данных нет.');
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Ошибка при подключении к серверу.');
    } finally {
      setIsLoading(false);
    }
  };

  // Автоматическое обновление каждые 10 минут
  useEffect(() => {
    const intervalId = setInterval(loadOrders, 10 * 60 * 1000); // 10 минут
    return () => clearInterval(intervalId);
  }, []);

  // Изначальная загрузка данных
  useEffect(() => {
    loadOrders();
  }, [routeDetails.id]);

  // Обновление при потягивании вниз
  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  // Форматирование времени
  const formatUnixTime = unixTime => {
    if (!unixTime) return '';
    const date = new Date(unixTime * 1000);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Фильтрация заказов по строке поиска
  const handleSearch = query => {
    setSearchQuery(query);
    const lowerCaseQuery = query.toLowerCase();
    const filtered = orders.filter(order =>
      order.number_act.toLowerCase().includes(lowerCaseQuery),
    );
    setFilteredOrders(filtered);
  };

  // Выбор адресов
  const handleAddressSelect = address => {
    setSelectedAddresses(prev =>
      prev.includes(address)
        ? prev.filter(item => item !== address)
        : [...prev, address],
    );
  };

  // Добавление или снятие всех маршрутов
  const handleSelectAllRoutes = () => {
    setIsIconActive(prev => !prev); // Переключаем состояние иконки
    if (selectedAddresses.length === orders.length) {
      setSelectedAddresses([]); // Отменить выбор всех
    } else {
      const allAddresses = orders.map(order => order.address);
      setSelectedAddresses(allAddresses); // Выбрать все
    }
  };

  // Построение маршрута
  const handleBuildRoute = async () => {
    const requestLocationPermission = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Доступ к геолокации',
              message: 'Приложению требуется доступ к вашей геолокации',
              buttonPositive: 'OK',
              buttonNegative: 'Отмена',
              buttonNeutral: 'Спросить позже',
            },
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (err) {
          Alert.alert('Ошибка при запросе разрешения', err.message);
          return false;
        }
      }
      return true; // iOS запросит автоматически
    };

    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert('Разрешение на доступ к местоположению не получено');
      return;
    }
    const addressesWithCurrentLocation = [...selectedAddresses];
    const url = generateYandexMapsUrl(addressesWithCurrentLocation);
    navigation.navigate('MapScreen', {mapUrl: url});
    // Geolocation.getCurrentPosition(
    //   position => {
    //     const currentLocation = `${position.coords.latitude},${position.coords.longitude}`;
    //     const addressesWithCurrentLocation = [
    //       currentLocation,
    //       ...selectedAddresses,
    //     ];
    //     const url = generateYandexMapsUrl(addressesWithCurrentLocation);
    //     navigation.navigate('MapScreen', {mapUrl: url});
    //   },
    //   error => {
    //     if (error.code === 2) {
    //       Alert.alert(
    //         'Геолокация отключена',
    //         'Пожалуйста, включите службы геолокации в настройках устройства.',
    //       );
    //     } else {
    //       Alert.alert('Не удалось получить местоположение', error.message);
    //     }
    //   },
    //   {enableHighAccuracy: true, timeout: 30000, maximumAge: 10000},
    // );
  };

  const generateYandexMapsUrl = addresses => {
    const baseUrl = 'https://yandex.ru/maps/?rtext=';
    const addressesString = addresses
      .map(address => encodeURIComponent(address))
      .join('~');
    return `${baseUrl}${addressesString}&rtt=auto`;
  };

  const handleQRCodeScan = () => {
    navigation.navigate('QRCodeScanner');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Список адресов маршрута № {routeDetails.number_route}
      </Text>

      {/* Поле поиска и кнопка выбора всех маршрутов в одной строке */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Введите номер акта..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
        <TouchableOpacity
          style={[
            styles.selectAllButtonIcon,
            {
              backgroundColor:
                selectedAddresses.length === orders.length
                  ? '#E8552C'
                  : '#141317',
            },
          ]}
          onPress={handleSelectAllRoutes}>
          {isIconActive ? (
            <MdiLocationPathActive
              width={scaledSize(20)}
              height={scaledSize(20)}
              fill="white"
            />
          ) : (
            <MdiLocationPath
              width={scaledSize(20)}
              height={scaledSize(20)}
              fill="white"
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Список заказов */}
      <FlatList
        data={filteredOrders}
        renderItem={({item}) => (
          <OrderItem
            item={{
              ...item,
              formattedTimeStart: formatUnixTime(item.timeStart),
              formattedTimeEnd: formatUnixTime(item.timeEnd),
            }}
            handleAddressSelect={handleAddressSelect}
            isSelected={selectedAddresses.includes(item.address)}
            navigation={navigation}
          />
        )}
        keyExtractor={(item, index) =>
          `${item.id?.trim() || 'default'}-${index}`
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      <View style={styles.containerButtons}>
        <TouchableOpacity style={styles.mapButton} onPress={handleBuildRoute}>
          <LocationWhiteIcon
            name="location-outline"
            size={scaledSize(20)}
            color="white"
          />
          <Text style={styles.mapButtonText}>Маршрут</Text>
        </TouchableOpacity>
        <QRButton onPress={handleQRCodeScan} text="QR" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: scaledSize(20),
  },
  containerButtons: {
    flexDirection: 'row',
    gap: scaledSize(15),
    justifyContent: 'space-around',
    marginTop: scaledSize(5),
  },
  title: {
    fontSize: scaledSize(16),
    fontWeight: 'bold',
    marginBottom: scaledSize(10),
    textAlign: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaledSize(10),
  },
  searchInput: {
    flex: 1,
    height: scaledSize(40),
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: scaledSize(5),
    paddingHorizontal: scaledSize(10),
    fontSize: scaledSize(14),
  },
  selectAllButtonIcon: {
    padding: scaledSize(10),
    borderRadius: scaledSize(5),
    marginLeft: scaledSize(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapButton: {
    backgroundColor: '#141317',
    padding: scaledSize(15),
    borderRadius: scaledSize(10),
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'center',
    gap: scaledSize(5),
  },
  mapButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: scaledSize(14),
  },
});
