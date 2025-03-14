import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  FlatList,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import axios from 'axios';
import {API_BASE_URL, API_KEY} from '../../config';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';
import {Linking} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {LoginScreenProps} from '../interfaces/interfaces';

import CopyIcon from '../../assets/images/copy.svg';
import PhoneIcon from '../../assets/images/phone.svg';
import ScanIcon from '../../assets/images/scan.svg';
import CheckmarkIcon from '../../assets/images/checkmark.svg';

// Определите тип для orderDetails
interface OrderDetails {
  id: string;
  clientFio: string;
  address: string;
  phone: string[];
  items: Product[];
}

// Определите тип для продуктов
interface Product {
  id: string;
  name: string;
  size: string;
  volume: string;
  quantity: string;
  summ: string;
  comment?: string;
  data_matrix?: string;
  showDetails?: boolean;
}

const {width} = Dimensions.get('window');
const baseWidth = 375; // базовая ширина для вычислений
const scale = width / baseWidth;

function scaledSize(size: number) {
  return Math.round(size * scale);
}

export default function OrderDetailsScreen({
  route,
  navigation,
}: LoginScreenProps) {
  const {orderId, qrCode} = route.params;
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Проверка интернет-соединения
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  // Функция загрузки данных заказа
  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');

      if (!userId) {
        setLoading(false);
        setError('Не удалось получить ID пользователя');
        return;
      }
      console.log('userId: ' + userId);
      console.log('qrCode: ' + qrCode);
      console.log('ORDER_ID: ' + orderId);
      const response = await axios.get(`${API_BASE_URL}/rest/orders/getInfo/`, {
        params: {
          USER_ID: userId,
          ORDER_ID: orderId,
          QR: qrCode,
          API_KEY,
        },
      });

      if (response.data.RESULT) {
        setOrderDetails(response.data.RESULT);
        setProducts(
          response.data.RESULT.items.map((item: Product) => ({
            ...item,
            showDetails: false, // Добавляем поле showDetails с типом
          })),
        );
      } else {
        setError('Не удалось получить данные заказа');
      }
    } catch (err) {
      setError('Ошибка при загрузке данных заказа');
      console.error('Ошибка при получении данных заказа:', err);
    } finally {
      setLoading(false);
    }
  };

  // Автоматическое обновление каждые 10 минут
  useEffect(() => {
    fetchOrderDetails();
    const intervalId = setInterval(fetchOrderDetails, 10 * 60 * 1000); // 10 минут
    return () => clearInterval(intervalId);
  }, [orderId, qrCode]);

  // Обновление при потягивании вниз
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrderDetails();
    setRefreshing(false);
  };

  const toggleProductDetails = (productId: string) => {
    setProducts((prevProducts: Product[]) =>
      prevProducts.map(product =>
        product.id === productId
          ? {...product, showDetails: !product.showDetails}
          : product,
      ),
    );
  };

  const handleProductScan = (product: Product) => {
    navigation.navigate('DataMatrixCodeScanner', {
      orderId,
      productId: product.id,
      qr: qrCode,
    });
  };

  const copyToClipboard = (phone: string) => {
    Clipboard.setString(phone);
    Alert.alert('Скопировано', `Номер ${phone} скопирован в буфер обмена`);
  };

  const makeCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const renderHeader = () => (
    <View>
      <Text style={styles.title}>Заказ № {orderDetails?.id || 'N/A'}</Text>
      <Text style={styles.label}>ФИО</Text>
      <Text style={styles.text}>{orderDetails?.clientFio || 'Не указано'}</Text>
      <Text style={styles.label}>Адрес</Text>
      <Text style={styles.text}>{orderDetails?.address || 'Не указано'}</Text>

      <Text style={styles.label}>Телефон</Text>
      {orderDetails?.phone?.map((phone: string, index: number) => (
        <View style={styles.phoneRow} key={index}>
          <Text style={styles.phoneText}>{phone}</Text>
          <View style={styles.iconContainer}>
            <TouchableOpacity onPress={() => copyToClipboard(phone)}>
              <CopyIcon
                name="copy-outline"
                size={scaledSize(24)}
                color="gray"
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => makeCall(phone)}>
              <PhoneIcon
                name="call-outline"
                size={scaledSize(24)}
                color="gray"
              />
            </TouchableOpacity>
          </View>
        </View>
      )) || <Text style={styles.text}>Телефон не указан</Text>}

      <Text style={styles.title}>Список товаров</Text>
    </View>
  );

  const renderProduct = ({item: product}: {item: Product}) => (
    <TouchableOpacity
      key={product.id}
      style={styles.productContainer}
      onPress={() => toggleProductDetails(product.id)}>
      <View style={styles.productHeader}>
        <Text style={styles.text} numberOfLines={1}>
          {product.name}
        </Text>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => handleProductScan(product)}>
          <View
            style={[
              styles.qrIconContainer,
              product.data_matrix
                ? styles.scannedBackground
                : styles.defaultBackground,
            ]}>
            <ScanIcon
              name="qr-code-outline"
              size={scaledSize(28)}
              color={product.data_matrix ? 'white' : '#000'}
            />
            {product.data_matrix && (
              <CheckmarkIcon
                name="checkmark-circle"
                size={scaledSize(22)}
                color="white"
                style={styles.checkmarkOverlay}
              />
            )}
          </View>
        </TouchableOpacity>
      </View>
      {product.showDetails && (
        <View style={styles.productDetails}>
          <Text style={styles.label}>Размер товара: {product.size}</Text>
          <Text style={styles.label}>Объем: {product.volume}</Text>
          <Text style={styles.label}>Количество: {product.quantity}</Text>
          <Text style={styles.label}>Сумма: {product.summ}</Text>
          <Text style={styles.label}>
            Комментарий: {product.comment || 'нет'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text>Произошла ошибка при загрузке данных: {error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ListHeaderComponent={renderHeader}
        data={products}
        keyExtractor={item => item.id.toString()}
        renderItem={renderProduct}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: scaledSize(20),
  },
  title: {
    fontSize: scaledSize(24),
    fontWeight: 'bold',
    marginBottom: scaledSize(5),
  },
  label: {
    fontSize: scaledSize(16),
    fontWeight: 'bold',
    marginTop: scaledSize(10),
  },
  text: {
    flex: 1,
    fontSize: scaledSize(14),
    color: '#666',
    marginRight: scaledSize(10),
    overflow: 'hidden',
  },
  phoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaledSize(10),
  },
  phoneText: {
    fontSize: scaledSize(16),
    color: '#666',
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: scaledSize(60),
  },
  productContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: scaledSize(10),
    padding: scaledSize(15),
    marginBottom: scaledSize(10),
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scanButton: {
    padding: scaledSize(10),
    flexShrink: 0,
  },
  qrIconContainer: {
    width: scaledSize(40),
    height: scaledSize(40),
    borderRadius: scaledSize(10),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  defaultBackground: {
    backgroundColor: '#f0f0f0', // Светло-серый фон
  },
  scannedBackground: {
    backgroundColor: '#4CAF50', // Зеленый фон
  },
  checkmarkOverlay: {
    position: 'absolute',
    bottom: scaledSize(-2),
    right: scaledSize(-2),
  },
  productDetails: {
    marginTop: scaledSize(10),
  },
});
