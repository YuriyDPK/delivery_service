import React, {useState, useEffect, useCallback, useContext} from 'react';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {API_BASE_URL, API_KEY} from '../../config';
import {Camera} from 'react-native-camera-kit';

import {NetworkContext} from '../components/NetworkContext';
import {getDB} from '../database';
import {customAlert} from './datamatrixComponents/customAlertManager';

interface QRCodeScannerScreenProps {
  route: any;
}

interface Order {
  id: number;
  number_act?: string;
  [key: string]: any;
}

interface SQLTransaction {
  executeSql: (
    sqlStatement: string,
    args?: any[],
    callback?: (transaction: SQLTransaction, resultSet: any) => void,
    errorCallback?: (transaction: SQLTransaction, error: Error) => boolean,
  ) => void;
}

interface Database {
  transaction: (
    callback: (tx: SQLTransaction) => void,
    errorCallback?: (error: Error) => void,
    successCallback?: () => void,
  ) => void;
}

const QRCodeScannerScreen: React.FC<QRCodeScannerScreenProps> = ({route}) => {
  const navigation = useNavigation();
  const {isConnected} = useContext(NetworkContext);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [scanned, setScanned] = useState<boolean>(false);
  const [scannerKey, setScannerKey] = useState<number>(Date.now());
  const [scanAttempts, setScanAttempts] = useState<number>(0);
  const [scanError, setScanError] = useState<string | null>(null);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        console.log('Запрашиваем разрешение на использование камеры...');
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Доступ к камере',
            message: 'Приложению требуется доступ к камере',
            buttonNeutral: 'Спросить позже',
            buttonNegative: 'Отмена',
            buttonPositive: 'ОК',
          },
        );
        const hasAccess = granted === PermissionsAndroid.RESULTS.GRANTED;
        console.log(
          'Разрешение на камеру:',
          hasAccess ? 'Предоставлено' : 'Отклонено',
        );
        setHasPermission(hasAccess);

        if (!hasAccess) {
          console.warn(
            'Пользователь отклонил разрешение на использование камеры',
          );
          customAlert(
            'Нет доступа к камере',
            'Для сканирования QR-кодов необходим доступ к камере. Пожалуйста, предоставьте разрешение в настройках приложения.',
          );
        }
      } catch (err) {
        console.error('Ошибка при запросе разрешения на камеру:', err);
        setHasPermission(false);
        customAlert(
          'Ошибка доступа',
          'Не удалось запросить разрешение на использование камеры. Пожалуйста, проверьте настройки приложения.',
        );
      }
    } else {
      console.log(
        'Платформа iOS: разрешение на камеру запрашивается автоматически',
      );
      setHasPermission(true);
    }
  };

  useFocusEffect(
    useCallback(() => {
      console.log('Экран сканирования QR кода активирован');
      setScanned(false);
      setScannerKey(Date.now());
      setScanAttempts(0);
      setScanError(null);
    }, []),
  );

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const handleQRCodeScan = async ({nativeEvent}: any) => {
    try {
      if (scanned) {
        console.log('Сканирование уже выполнено, игнорируем повторное событие');
        return;
      }

      setScanAttempts(prev => prev + 1);
      console.log(`Попытка сканирования QR кода #${scanAttempts + 1}`);

      if (!nativeEvent || !nativeEvent.codeStringValue) {
        console.error('Ошибка сканирования: отсутствуют данные события');
        setScanError('Отсутствуют данные сканирования');
        return;
      }

      setScanned(true);
      setScanError(null);

      const qrCode = nativeEvent.codeStringValue.trim();
      console.log('Отсканирован QR код:', qrCode);
      console.log('Тип кода:', nativeEvent.codeType || 'Неизвестный тип');

      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        console.error(
          'Ошибка: не удалось получить ID пользователя из AsyncStorage',
        );
        customAlert(
          'Ошибка аутентификации',
          'Не удалось получить ID пользователя. Пожалуйста, перезайдите в приложение.',
        );
        setScanned(false);
        return;
      }
      console.log('ID пользователя получен:', userId);

      if (isConnected) {
        console.log('Работаем в онлайн-режиме. Отправляем запрос на сервер...');
        // Онлайн-режим: делаем запрос к серверу
        try {
          const response = await axios.get(
            `${API_BASE_URL}/rest/orders/getInfo/`,
            {
              params: {
                USER_ID: userId,
                ORDER_ID: 0,
                QR: qrCode,
                API_KEY: API_KEY,
              },
            },
          );

          console.log('Ответ сервера:', response.data);
          const json = response.data;

          if (json.RESULT) {
            console.log('Сервер вернул информацию о заказе:', json.RESULT);
            const orderId = json.RESULT.id;
            navigation.navigate(
              'OrderDetails' as never,
              {orderId, qrCode} as never,
            );
          } else {
            console.error('Сервер не вернул данные о заказе:', json);
            const errorMessage = json.ERROR || 'Неизвестная ошибка';
            customAlert(
              'Заказ не найден',
              `Не удалось найти данные по заказу: ${errorMessage}`,
            );
            setScanned(false);
          }
        } catch (networkError: any) {
          console.error('Ошибка сетевого запроса:', networkError);

          // Анализ ошибки сети для более точной диагностики
          if (networkError.response) {
            // Сервер вернул ответ со статусом не 2xx
            console.error('Статус ответа:', networkError.response.status);
            console.error('Данные ответа:', networkError.response.data);
            customAlert(
              'Ошибка сервера',
              `Сервер вернул ошибку ${networkError.response.status}: ${
                networkError.response.data?.message || 'Неизвестная ошибка'
              }`,
            );
          } else if (networkError.request) {
            // Запрос был сделан, но ответ не получен
            console.error('Нет ответа от сервера');
            customAlert(
              'Ошибка соединения',
              'Запрос отправлен, но сервер не ответил. Проверьте соединение с интернетом.',
            );
          } else {
            // Произошла ошибка при настройке запроса
            console.error('Ошибка настройки запроса:', networkError.message);
            customAlert(
              'Ошибка запроса',
              `Не удалось выполнить запрос: ${networkError.message}`,
            );
          }

          // Предложим поискать в локальной базе
          const checkOffline = await new Promise(resolve => {
            customAlert(
              'Поиск в локальной базе',
              'Не удалось получить данные с сервера. Хотите поискать заказ в локальной базе данных?',
              [
                {text: 'Нет', onPress: () => resolve(false)},
                {text: 'Да', onPress: () => resolve(true)},
              ],
            );
          });

          if (checkOffline) {
            // Переходим к поиску в локальной базе данных
            await searchOrdersOffline(qrCode);
          } else {
            setScanned(false);
          }
        }
      } else {
        console.log(
          'Работаем в оффлайн-режиме. Ищем заказ в локальной базе...',
        );
        await searchOrdersOffline(qrCode);
      }
    } catch (error: any) {
      console.error('Критическая ошибка при обработке QR кода:', error);
      customAlert(
        'Критическая ошибка',
        `Произошла непредвиденная ошибка при сканировании QR кода: ${
          error.message || 'Неизвестная ошибка'
        }`,
      );
      setScanned(false);
    }
  };

  const searchOrdersOffline = async (qrCode: string) => {
    try {
      console.log('Поиск заказа в локальной базе данных по QR коду:', qrCode);
      const db = getDB();
      if (!db) {
        console.error('Ошибка: не удалось получить экземпляр базы данных');
        customAlert(
          'Ошибка базы данных',
          'Не удалось подключиться к локальной базе данных. Проверьте права доступа к хранилищу.',
        );
        setScanned(false);
        return;
      }

      const orders: Order[] = await new Promise((resolve, reject) => {
        (db as Database).transaction(
          tx => {
            tx.executeSql(
              'SELECT * FROM orders WHERE qr = ?',
              [qrCode],
              (_, {rows}) => {
                const foundOrders = rows.raw(); // Получаем все записи
                console.log(
                  'Найдено заказов в локальной базе:',
                  foundOrders.length,
                );
                resolve(foundOrders);
              },
              (_, err) => {
                console.error('Ошибка SQL при поиске заказов:', err);
                reject(err);
                return false;
              },
            );
          },
          error => {
            console.error('Ошибка транзакции при поиске заказов:', error);
            reject(error);
          },
        );
      });

      if (orders.length > 0) {
        console.log('Найдены заказы в локальной базе:', orders);
        if (orders.length === 1) {
          // Если найден ровно один заказ, переходим сразу в OrderDetails
          const orderId = orders[0].id;
          console.log('Переход к деталям заказа с ID:', orderId);
          navigation.navigate(
            'OrderDetails' as never,
            {orderId, qrCode} as never,
          );
        } else {
          // Если найдено несколько заказов, показываем список для выбора
          console.log(
            'Найдено несколько заказов, показываем список для выбора',
          );
          customAlert(
            'Найдено несколько заказов',
            `Обнаружено ${orders.length} заказов с QR-кодом ${qrCode}. Выберите один:`,
            orders.map(order => ({
              text: `Заказ ${order.id} (${order.number_act || 'Без номера'})`,
              onPress: () => {
                navigation.navigate(
                  'OrderDetails' as never,
                  {
                    orderId: order.id,
                    qrCode,
                  } as never,
                );
              },
            })),
          );
        }
      } else {
        console.warn('Заказ не найден в локальной базе данных');
        customAlert(
          'Заказ не найден',
          'Заказ с таким QR-кодом не найден в локальной базе данных: ' + qrCode,
        );
        setScanned(false);
      }
    } catch (error: any) {
      console.error('Ошибка при поиске заказа в оффлайн-режиме:', error);
      customAlert(
        'Ошибка поиска',
        `Не удалось найти заказ в локальной базе данных: ${
          error.message || 'Неизвестная ошибка'
        }`,
      );
      setScanned(false);
    }
  };

  const handleCameraError = (error: any) => {
    console.error('Ошибка камеры:', error);
    setScanError(error.message || 'Неизвестная ошибка камеры');
    customAlert(
      'Ошибка камеры',
      `Не удалось инициализировать камеру: ${
        error.message || 'Неизвестная ошибка'
      }`,
    );
  };

  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Нет доступа к камере</Text>
        <Pressable
          style={styles.permissionButton}
          onPress={requestCameraPermission}>
          <Text style={styles.buttonText}>Запросить доступ</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        key={scannerKey}
        scanBarcode={true}
        style={styles.camera}
        onReadCode={scanned ? undefined : handleQRCodeScan}
        showFrame={true}
        laserColor="#fff"
        frameColor="#fff"
        onCameraError={handleCameraError}
      />
      {scanned && (
        <Pressable
          style={({pressed}) => [
            styles.button,
            {backgroundColor: pressed ? '#1e7d34' : '#28a745'},
          ]}
          onPress={() => {
            setScanned(false);
            setScannerKey(Date.now());
          }}>
          <Text style={styles.buttonText}>
            Нажмите, чтобы отсканировать снова
          </Text>
        </Pressable>
      )}
      {scanError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Ошибка: {scanError}</Text>
        </View>
      )}
    </View>
  );
};

export default QRCodeScannerScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  button: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    padding: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  errorContainer: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 10,
  },
});
