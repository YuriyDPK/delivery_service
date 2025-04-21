import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  NativeModules,
  requireNativeComponent,
  NativeEventEmitter,
  Alert,
} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import ScanIcon from '../../assets/images/scan.svg';

type MapScreenProps = {
  route: RouteProp<{params: {mapUrl?: string}}, 'params'>;
  navigation: any;
};

interface YandexMapViewProps {
  style: object;
  showUserLocation?: boolean;
  followUserLocation?: boolean;
}

const YandexMapView =
  requireNativeComponent<YandexMapViewProps>('YandexMapView');
const {YandexNavigationModule} = NativeModules;
const navigationEventEmitter = new NativeEventEmitter(YandexNavigationModule);

const MapScreen: React.FC<MapScreenProps> = ({route, navigation}) => {
  const {mapUrl} = route.params || {};
  const [isNavigating, setIsNavigating] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{
    distance?: number;
    time?: number;
  }>({});
  const [currentPosition, setCurrentPosition] = useState<{
    latitude: number;
    longitude: number;
    speed: number;
  } | null>(null);
  const [speedLimit, setSpeedLimit] = useState<number | null>(null);
  const [isSpeeding, setIsSpeeding] = useState(false);

  useEffect(() => {
    // Подписка на получение маршрутов
    const routesSubscription = navigationEventEmitter.addListener(
      'onRoutesReceived',
      data => {
        console.log(`Получено ${data.count} маршрутов`);

        if (data.count > 0) {
          customAlert(
            'Маршрут построен',
            `Найдено ${data.count} вариантов маршрута`,
            [
              {
                text: 'Начать навигацию',
                onPress: () => startNavigation(0),
              },
              {
                text: 'Отмена',
                style: 'cancel',
              },
            ],
          );
        }
      },
    );

    // Подписка на детали маршрута
    const routeDetailsSubscription = navigationEventEmitter.addListener(
      'onRouteDetails',
      data => {
        console.log('Детали маршрута:', data);
        setRouteInfo({
          distance: data.distance,
          time: data.time,
        });
      },
    );

    // Подписка на обновление позиции
    const positionSubscription = navigationEventEmitter.addListener(
      'onPositionUpdated',
      data => {
        setCurrentPosition({
          latitude: data.latitude,
          longitude: data.longitude,
          speed: data.speed,
        });
      },
    );

    // Подписка на достижение пункта назначения
    const destinationSubscription = navigationEventEmitter.addListener(
      'onDestinationReached',
      data => {
        setIsNavigating(false);
        customAlert('Навигация', 'Вы достигли пункта назначения!');
      },
    );

    // Подписка на ограничения скорости
    const speedLimitSubscription = navigationEventEmitter.addListener(
      'onSpeedLimitUpdated',
      data => {
        setSpeedLimit(data.speedLimit);
      },
    );

    // Подписка на превышение скорости
    const speedingSubscription = navigationEventEmitter.addListener(
      'onSpeedingActivated',
      data => {
        setIsSpeeding(true);
      },
    );

    const speedingDeactivatedSubscription = navigationEventEmitter.addListener(
      'onSpeedingDeactivated',
      () => {
        setIsSpeeding(false);
      },
    );

    // Подписка на ошибки маршрутизации
    const errorSubscription = navigationEventEmitter.addListener(
      'onRoutesError',
      data => {
        console.error('Ошибка построения маршрута:', data.error);
        customAlert('Ошибка', `Не удалось построить маршрут: ${data.error}`);
      },
    );

    // Навигация запущена
    const navigationStartedSubscription = navigationEventEmitter.addListener(
      'onNavigationStarted',
      () => {
        setIsNavigating(true);
      },
    );

    // Навигация остановлена
    const navigationStoppedSubscription = navigationEventEmitter.addListener(
      'onNavigationStopped',
      () => {
        setIsNavigating(false);
      },
    );

    // Очистка подписок при размонтировании
    return () => {
      routesSubscription.remove();
      routeDetailsSubscription.remove();
      positionSubscription.remove();
      destinationSubscription.remove();
      speedLimitSubscription.remove();
      speedingSubscription.remove();
      speedingDeactivatedSubscription.remove();
      errorSubscription.remove();
      navigationStartedSubscription.remove();
      navigationStoppedSubscription.remove();

      // Если навигация активна, останавливаем её при размонтировании
      if (isNavigating) {
        stopNavigation();
      }
    };
  }, [isNavigating]);

  // Функция построения маршрута
  const buildRoute = async () => {
    try {
      // Примерные координаты (замените на реальные)
      const startPoint = {latitude: 55.751244, longitude: 37.618423}; // Начальная точка
      const endPoint = {latitude: 55.763976, longitude: 37.606527}; // Конечная точка

      await YandexNavigationModule.buildRoute(startPoint, endPoint);
    } catch (error) {
      console.error('Ошибка при построении маршрута:', error);
      customAlert('Ошибка', 'Не удалось построить маршрут');
    }
  };

  // Функция начала навигации
  const startNavigation = async (routeIndex: number) => {
    try {
      await YandexNavigationModule.startNavigation(routeIndex);
    } catch (error) {
      console.error('Ошибка при запуске навигации:', error);
      customAlert('Ошибка', 'Не удалось запустить навигацию');
    }
  };

  // Функция остановки навигации
  const stopNavigation = async () => {
    try {
      await YandexNavigationModule.stopNavigation();
    } catch (error) {
      console.error('Ошибка при остановке навигации:', error);
    }
  };

  const handleQRCodeScan = () => {
    navigation.navigate('QRCodeScanner');
  };

  // Форматируем время и расстояние для отображения
  const formatRouteInfo = () => {
    if (!routeInfo.distance && !routeInfo.time) return '';

    const distance = routeInfo.distance
      ? `${(routeInfo.distance / 1000).toFixed(1)} км`
      : '';

    const time = routeInfo.time ? `${Math.floor(routeInfo.time / 60)} мин` : '';

    return `${distance} ${time}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.qrButtonContainer}>
        <TouchableOpacity style={styles.qrButton} onPress={handleQRCodeScan}>
          <ScanIcon name="qr-code-outline" size={20} color="white" />
          <Text style={styles.qrButtonText}>QR</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mapContainer}>
        <YandexMapView
          style={styles.map}
          showUserLocation={true}
          followUserLocation={isNavigating}
        />
      </View>

      {formatRouteInfo() ? (
        <View style={styles.routeInfoContainer}>
          <Text style={styles.routeInfoText}>{formatRouteInfo()}</Text>
        </View>
      ) : null}

      {currentPosition && (
        <View style={styles.speedContainer}>
          <Text
            style={[styles.speedText, isSpeeding ? styles.speedingText : null]}>
            {Math.round(currentPosition.speed * 3.6)} км/ч
            {speedLimit
              ? ` (ограничение: ${Math.round(speedLimit * 3.6)} км/ч)`
              : ''}
          </Text>
        </View>
      )}

      <View style={styles.buttonsContainer}>
        {!isNavigating ? (
          <TouchableOpacity
            style={[styles.navigationButton, styles.buildRouteButton]}
            onPress={buildRoute}>
            <Text style={styles.buttonText}>Построить маршрут</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navigationButton, styles.stopButton]}
            onPress={stopNavigation}>
            <Text style={styles.buttonText}>Завершить навигацию</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default MapScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
  },
  qrButtonContainer: {
    marginVertical: 10,
    alignItems: 'center',
  },
  qrButton: {
    backgroundColor: '#141317',
    paddingVertical: 10,
    width: '90%',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  buttonsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    padding: 10,
  },
  navigationButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 5,
  },
  buildRouteButton: {
    backgroundColor: '#2196F3',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  routeInfoContainer: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 10,
  },
  routeInfoText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  speedContainer: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 10,
    borderRadius: 8,
  },
  speedText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  speedingText: {
    color: 'red',
  },
});
