import React, {useState, useEffect, useCallback} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {
  BackHandler,
  View,
  Text,
  SectionList,
  StyleSheet,
  Pressable,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {API_BASE_URL, API_KEY} from '../../config';

import ClockIcon from '../../assets/images/clock.svg';
import CheckIcon from '../../assets/images/check.svg';
import ChevronForwardIcon from '../../assets/images/chevron_forward.svg';

// Типы для навигации
type RootStackParamList = {
  Login: undefined;
  MainTabs: {screen: string};
  Registration: undefined;
  RouteDetails: {
    route: {
      id: string;
      number_route: string;
      date: string;
      quantity_orders: number;
      status: string;
    };
  };
};

type RoutesScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'MainTabs'
>;

interface RoutesScreenProps {
  navigation: RoutesScreenNavigationProp;
}

// Получаем размеры экрана
const {width, height} = Dimensions.get('window');
const baseWidth = 375;
const scale = width / baseWidth;

function scaledSize(size: number) {
  return Math.round(size * scale);
}

export default function RoutesScreen({navigation}: RoutesScreenProps) {
  const [routes, setRoutes] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [userName, setUserName] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getFutureDate = (daysAhead: number) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    return futureDate.toISOString().split('T')[0];
  };

  function parseRouteDate(dateStr: string) {
    const [datePart, timePart] = dateStr.split(' ');
    const [day, month, year] = datePart.split('.');
    const [hours, minutes, seconds] = (timePart || '0:00:00').split(':');
    return new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1,
      parseInt(day, 10),
      parseInt(hours, 10),
      parseInt(minutes, 10),
      parseInt(seconds, 10),
    );
  }

  const groupRoutesByDate = (routesData: any[]) => {
    const grouped = routesData.reduce((acc, route) => {
      const dateObj = parseRouteDate(route.date);
      const dateString = dateObj.toLocaleDateString();
      if (!acc[dateString]) {
        acc[dateString] = [];
      }
      acc[dateString].push(route);
      return acc;
    }, {});

    const sortedSections = Object.entries(grouped)
      .sort(
        ([dateA], [dateB]) =>
          new Date(dateB).getTime() - new Date(dateA).getTime(),
      )
      .map(([date, routes]) => ({
        title: date,
        data: routes,
      }));

    return sortedSections;
  };

  const fetchUserInfo = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Ошибка', 'Не удалось получить ID пользователя');
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/rest/user/getUserInfo/`,
        {
          params: {USER_ID: userId, API_KEY},
        },
      );

      if (response.data.RESULT) {
        setUserName(response.data.RESULT.firstName);
      } else {
        Alert.alert('Ошибка', 'Не удалось получить данные пользователя');
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Ошибка при подключении к серверу');
      console.error(error);
    }
  };

  const loadRoutes = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        console.error('User ID not found in AsyncStorage');
        return;
      }

      const today = getTodayDate();
      const futureDate = getFutureDate(7);

      const response = await axios.get(`${API_BASE_URL}/rest/routes/getList/`, {
        params: {
          USER_ID: userId,
          API_KEY,
          DATE_START: today,
          DATE_END: futureDate,
        },
      });
      console.log(123);

      if (response.data.RESULT) {
        console.log(response.data.RESULT);

        const updatedRoutes = response.data.RESULT.map((route: any) => ({
          ...route,
          points: route.points || 0,
        }));
        setRoutes(updatedRoutes);
        const newSections = groupRoutesByDate(updatedRoutes);
        setSections(newSections);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRoutes();
    setRefreshing(false);
  };

  useEffect(() => {
    const intervalId = setInterval(loadRoutes, 10 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    fetchUserInfo();
    loadRoutes();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true; // Блокируем кнопку "назад"
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      return () => subscription.remove(); // Используем метод remove для отписки
    }, []),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Здравствуйте, {userName}!</Text>
      <Text style={styles.subTitle}>Доступные маршруты:</Text>
      {sections.length === 0 ? (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Text style={{fontSize: scaledSize(18), color: 'gray'}}>
            Маршрутов на сегодня нет
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderSectionHeader={({section: {title}}) => (
            <Text style={styles.sectionHeader}>{title}</Text>
          )}
          renderItem={({item}) => (
            <Pressable
              onPress={() =>
                navigation.navigate('RouteDetails', {
                  route: {...item, id: item.id},
                })
              }
              style={({pressed}) => [
                styles.routeContainer,
                {backgroundColor: pressed ? '#e6e6e6' : '#f9f9f9'},
              ]}>
              <View style={styles.routeHeader}>
                <Text style={styles.routeNumber}>
                  Маршрут № {item.number_route}
                </Text>
                <ChevronForwardIcon
                  name="chevron-forward"
                  size={scaledSize(20)}
                  color="#000"
                />
              </View>
              <Text style={styles.routePoints}>
                Точек на маршруте {item.quantity_orders}
              </Text>
              <View style={styles.routeStatusContainer}>
                {item.status === 'Закрыт' ? (
                  <CheckIcon
                    width={scaledSize(20)}
                    height={scaledSize(20)}
                    fill="green"
                  />
                ) : item.status === 'В пути' ? (
                  <ClockIcon
                    width={scaledSize(20)}
                    height={scaledSize(20)}
                    fill="gray"
                  />
                ) : (
                  <ClockIcon
                    width={scaledSize(20)}
                    height={scaledSize(20)}
                    fill="red"
                  />
                )}

                <Text
                  style={[
                    styles.routeStatus,
                    item.status === 'Закрыт' && {color: 'green'},
                    item.status === 'В пути' && {color: 'gray'},
                    !item.status && {color: 'red'},
                  ]}>
                  {item.status || 'Неизвестный статус'}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: scaledSize(20),
    paddingTop: scaledSize(40),
  },
  title: {
    fontSize: scaledSize(22),
    fontWeight: 'normal',
    marginBottom: scaledSize(10),
  },
  subTitle: {
    fontSize: scaledSize(20),
    fontWeight: 'bold',
    marginBottom: scaledSize(10),
  },
  sectionHeader: {
    color: 'gray',
    fontSize: scaledSize(16),
    fontWeight: 'bold',
    marginBottom: scaledSize(5),
    marginTop: scaledSize(10),
    backgroundColor: '#fff',
  },
  routeContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: scaledSize(10),
    padding: scaledSize(15),
    marginBottom: scaledSize(10),
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaledSize(5),
  },
  routeNumber: {
    fontSize: scaledSize(16),
    fontWeight: 'bold',
  },
  routePoints: {
    fontSize: scaledSize(14),
    color: '#666',
  },
  routeStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaledSize(5),
  },
  routeStatus: {
    fontSize: scaledSize(14),
    marginLeft: scaledSize(5),
    fontWeight: '600',
    color: '#666',
  },
});
