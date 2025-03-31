// ArchiveScreen.tsx
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  RefreshControl,
  Alert,
  BackHandler,
  Dimensions,
  ScrollView,
} from 'react-native';
import {Calendar, LocaleConfig} from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {API_BASE_URL, API_KEY} from '../../config';
import {useFocusEffect} from '@react-navigation/native';
import {LoginScreenProps} from '../interfaces/interfaces';
import NetInfo from '@react-native-community/netinfo';

import ClockIcon from '../../assets/images/clock.svg';
import CheckIcon from '../../assets/images/check.svg';
import ChevronForwardIcon from '../../assets/images/chevron_forward.svg';
import CalendarIcon from '../../assets/images/calendar.svg';

// Настройка локализации (русский язык)
LocaleConfig.locales['ru'] = {
  monthNames: [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь',
  ],
  monthNamesShort: [
    'Янв',
    'Фев',
    'Мар',
    'Апр',
    'Май',
    'Июн',
    'Июл',
    'Авг',
    'Сен',
    'Окт',
    'Ноя',
    'Дек',
  ],
  dayNames: [
    'Воскресенье',
    'Понедельник',
    'Вторник',
    'Среда',
    'Четверг',
    'Пятница',
    'Суббота',
  ],
  dayNamesShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
  today: 'Сегодня',
};
LocaleConfig.defaultLocale = 'ru';

// Получаем размеры экрана
const {width} = Dimensions.get('window');
const baseWidth = 375; // базовая ширина для вычислений
const scale = width / baseWidth;

function scaledSize(size: number): number {
  return Math.round(size * scale);
}

export default function ArchiveScreen({navigation}: LoginScreenProps) {
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [colorBackgroundBorder, setColorBackgroundBorder] = useState('#ccc');
  const [colorBackgroundBorder2, setColorBackgroundBorder2] = useState('#ccc');
  const [filteredRoutes, setFilteredRoutes] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [routes, setRoutes] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (!state.isConnected) {
        Alert.alert(
          'Оффлайн режим',
          'Интернет отключён. Перенаправляем на сегодняшние маршруты.',
        );
        navigation.navigate('Routes');
      }
    });

    return () => unsubscribe();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => true; // Блокируем возврат
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
      return () => subscription.remove();
    }, []),
  );

  useEffect(() => {
    const filtered = routes.filter(route =>
      route.number_route.toLowerCase().includes(searchText.toLowerCase()),
    );
    setFilteredRoutes(filtered);
  }, [searchText, routes]);

  const onDayPress = (day: any) => {
    const selectedDate = new Date(day.dateString);
    const today = new Date();

    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate >= today) {
      Alert.alert(
        'Некорректная дата',
        'Вы не можете выбрать сегодняшнюю или более позднюю дату.',
      );
      return;
    }

    if (!startDate && !endDate) {
      setStartDate(day.dateString);
    } else if (startDate && !endDate) {
      const start = new Date(startDate);
      if (selectedDate < start) {
        setEndDate(startDate);
        setStartDate(day.dateString);
      } else {
        setEndDate(day.dateString);
      }
    } else if (startDate && endDate) {
      setStartDate(day.dateString);
      setEndDate(null);
    }
  };

  const getMarkedDates = () => {
    const markedDates: Record<string, any> = {};
    if (startDate) {
      markedDates[startDate] = {startingDay: true, color: 'orange'};
      if (endDate) {
        markedDates[endDate] = {endingDay: true, color: 'orange'};
        let currentDate = new Date(startDate);
        const end = new Date(endDate);
        while (currentDate < end) {
          const dateString = currentDate.toISOString().split('T')[0];
          if (dateString !== startDate && dateString !== endDate) {
            markedDates[dateString] = {color: 'orange'};
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    }
    return markedDates;
  };

  const loadRoutes = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        console.error('User ID not found in AsyncStorage');
        return;
      }

      const url = `${API_BASE_URL}/rest/routes/getList/`;
      const params: any = {
        USER_ID: userId,
        API_KEY: API_KEY,
      };

      if (startDate) {
        params.DATE_START = startDate;
        params.DATE_END = endDate || startDate;
      }

      const response = await axios.get(url, {params});

      if (response.data.RESULT) {
        const updatedRoutes = response.data.RESULT.map((route: any) => ({
          ...route,
          points: route.points || 0,
        }));

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const filteredPastRoutes = updatedRoutes.filter((route: any) => {
          const routeDate = parseRouteDate(route.date);
          return routeDate < today;
        });

        setRoutes(filteredPastRoutes);
        setFilteredRoutes(filteredPastRoutes);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  useEffect(() => {
    loadRoutes();
    const intervalId = setInterval(loadRoutes, 10 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [startDate, endDate]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRoutes();
    setRefreshing(false);
  };

  function parseRouteDate(dateStr: string): Date {
    const [datePart, timePart] = dateStr.split(' ');
    const [day, month, year] = datePart.split('.');
    const [hours, minutes, seconds] = (timePart || '0:00:00').split(':');

    const d = parseInt(day, 10);
    const m = parseInt(month, 10) - 1;
    const y = parseInt(year, 10);
    const h = parseInt(hours, 10);
    const min = parseInt(minutes, 10);
    const s = parseInt(seconds, 10);

    return new Date(y, m, d, h, min, s);
  }

  const groupRoutesByDate = (routes: any[]): Record<string, any[]> => {
    return routes.reduce((acc: Record<string, any[]>, route: any) => {
      const dateObj = parseRouteDate(route.date);
      const dateString = dateObj.toLocaleDateString();
      if (!acc[dateString]) {
        acc[dateString] = [];
      }
      acc[dateString].push(route);
      return acc;
    }, {});
  };

  const routesByDate = groupRoutesByDate(filteredRoutes);
  const sections = (Object.entries(routesByDate) as [string, any[]][])
    .sort(([dateA, routesA], [dateB, routesB]) => {
      const dA = parseRouteDate(routesA[0].date);
      const dB = parseRouteDate(routesB[0].date);
      return dB.getTime() - dA.getTime();
    })
    .map(([date, routes]) => ({
      title: date,
      data: routes,
    }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Архив</Text>
      <View>
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск по номеру маршрута"
          value={searchText}
          onChangeText={text => setSearchText(text)}
        />
      </View>

      <View style={styles.dateContainer}>
        <Pressable
          style={({pressed}) => [
            styles.dateInput,
            {borderColor: pressed ? '#919191' : colorBackgroundBorder},
          ]}
          onPress={() => setShowCalendar(true)}>
          <Text style={styles.dateInputText}>
            {startDate
              ? new Date(startDate).toLocaleDateString()
              : 'Начальная дата'}
          </Text>
        </Pressable>
        <Text style={styles.dateSeparator}>-</Text>
        <Pressable
          style={({pressed}) => [
            styles.dateInput,
            {borderColor: pressed ? '#919191' : colorBackgroundBorder2},
          ]}
          onPress={() => setShowCalendar(true)}>
          <Text style={styles.dateInputText}>
            {endDate ? new Date(endDate).toLocaleDateString() : 'Конечная дата'}
          </Text>
        </Pressable>

        <Pressable onPress={() => setShowCalendar(true)}>
          {({pressed}) => (
            <CalendarIcon
              name="calendar-outline"
              size={scaledSize(24)}
              color={pressed ? 'black' : '#555'}
            />
          )}
        </Pressable>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item: any) => item.id}
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
                /> // Используем ClockIcon как запасной вариант
              )}
              <Text
                style={[
                  styles.routeStatus,
                  item.status === 'Закрыт' && {color: 'green'},
                  item.status === 'В пути' && {color: 'gray'},
                  item.status !== 'Закрыт' &&
                    item.status !== 'В пути' && {color: 'red'},
                ]}>
                {item.status}
              </Text>
            </View>
          </Pressable>
        )}
      />

      {showCalendar && (
        <Modal transparent={true} animationType="slide">
          <View style={styles.modalContainer}>
            {/* Внешний горизонтальный ScrollView */}
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={true}
              contentContainerStyle={styles.outerScrollContainer}>
              {/* Внутренний вертикальный ScrollView */}
              <ScrollView
                contentContainerStyle={styles.modalScrollContainer}
                showsVerticalScrollIndicator={true}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Выберите период</Text>
                  <Text style={styles.modalInstruction}>
                    Выберите период, за который хотите увидеть список маршрутов
                  </Text>
                  <Calendar
                    markingType={'period'}
                    markedDates={getMarkedDates()}
                    onDayPress={onDayPress}
                    maxDate={new Date().toISOString().split('T')[0]}
                    // Кастомный заголовок
                    renderHeader={date => {
                      const month = date.toString('MMMM'); // Получаем название месяца
                      const year = date.getFullYear(); // Получаем год
                      return (
                        <Text style={{fontSize: 18, fontWeight: 'bold'}}>
                          {month} {year}
                        </Text>
                      );
                    }}
                  />
                  <View style={styles.buttonsContainer}>
                    <Pressable
                      style={({pressed}) => [
                        styles.resetButton,
                        {backgroundColor: pressed ? '#333' : '#e74c3c'},
                      ]}
                      onPress={() => {
                        setStartDate(null);
                        setEndDate(null);
                      }}>
                      <Text style={styles.buttonText}>Сбросить</Text>
                    </Pressable>

                    <Pressable
                      style={({pressed}) => [
                        styles.doneButton,
                        {backgroundColor: pressed ? '#333' : '#141317'},
                      ]}
                      onPress={() => setShowCalendar(false)}>
                      <Text style={styles.buttonText}>Готово</Text>
                    </Pressable>
                  </View>
                </View>
              </ScrollView>
            </ScrollView>
          </View>
        </Modal>
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
  searchInput: {
    height: scaledSize(40),
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: scaledSize(10),
    paddingHorizontal: scaledSize(10),
    marginBottom: scaledSize(15),
    fontSize: scaledSize(16),
  },
  title: {
    fontSize: scaledSize(24),
    fontWeight: 'bold',
    marginBottom: scaledSize(10),
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaledSize(20),
  },
  dateInputText: {
    fontSize: scaledSize(14),
    color: '#333',
    textAlign: 'center',
  },
  dateInput: {
    flex: 1,
    height: scaledSize(40),
    borderWidth: 1,
    borderRadius: scaledSize(10),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaledSize(10),
  },
  dateSeparator: {
    marginHorizontal: scaledSize(5),
    fontSize: scaledSize(16),
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
    marginTop: scaledSize(5),
  },
  routeStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaledSize(5),
  },
  routeStatus: {
    fontSize: scaledSize(14),
    color: 'gray',
    marginLeft: scaledSize(5),
    fontWeight: '600',
  },
  sectionHeader: {
    color: 'gray',
    fontSize: scaledSize(16),
    fontWeight: 'bold',
    marginBottom: scaledSize(5),
    marginTop: scaledSize(10),
    backgroundColor: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerScrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  modalScrollContainer: {
    alignItems: 'center',
    flexGrow: 1,
  },
  modalContent: {
    width: width - scaledSize(40),
    backgroundColor: '#fff',
    padding: scaledSize(20),
    borderRadius: scaledSize(10),
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: scaledSize(18),
    fontWeight: 'bold',
    marginBottom: scaledSize(10),
  },
  modalInstruction: {
    fontSize: scaledSize(14),
    color: '#666',
    marginBottom: scaledSize(20),
    textAlign: 'center',
  },
  buttonsContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginTop: scaledSize(10),
    width: '100%',
  },
  resetButton: {
    backgroundColor: '#e74c3c',
    padding: scaledSize(15),
    borderRadius: scaledSize(10),
    alignItems: 'center',
    width: '100%',
  },
  doneButton: {
    backgroundColor: '#141317',
    padding: scaledSize(15),
    borderRadius: scaledSize(10),
    alignItems: 'center',
    marginTop: scaledSize(10),
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: scaledSize(14),
  },
});
