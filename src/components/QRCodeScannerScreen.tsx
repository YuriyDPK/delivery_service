import React, {useState, useEffect, useCallback, useContext} from 'react';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
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

const QRCodeScannerScreen: React.FC<QRCodeScannerScreenProps> = ({route}) => {
  const navigation = useNavigation();
  const {isConnected} = useContext(NetworkContext);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [scanned, setScanned] = useState<boolean>(false);
  const [scannerKey, setScannerKey] = useState<number>(Date.now());

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
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
        setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
      } catch (err) {
        console.warn(err);
        setHasPermission(false);
      }
    } else {
      setHasPermission(true);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setScanned(false);
      setScannerKey(Date.now());
    }, []),
  );

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const handleQRCodeScan = async ({nativeEvent}: any) => {
    if (scanned) return;
    setScanned(true);

    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        customAlert('Ошибка', 'Не удалось получить ID пользователя');
        return;
      }

      const qrCode = nativeEvent.codeStringValue.trim();

      if (isConnected) {
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

          const json = response.data;
          if (json.RESULT) {
            const orderId = json.RESULT.id;
            console.log('orderId: ', orderId);
            console.log('qrCode: ', qrCode);
            navigation.navigate('OrderDetails', {orderId, qrCode});
          } else {
            customAlert('Ошибка', 'Не удалось найти данные по заказу');
          }
        } catch (error) {
          customAlert('Ошибка', 'Ошибка при подключении к серверу');
          console.error('Ошибка при получении информации о заказе:', error);
        }
      } else {
        // Оффлайн-режим: ищем заказы в локальной базе данных
        const db = getDB();
        if (!db) {
          customAlert(
            'Ошибка',
            'Не удалось подключиться к локальной базе данных',
          );
          return;
        }

        try {
          const orders = await new Promise((resolve, reject) => {
            db.transaction(
              tx => {
                tx.executeSql(
                  'SELECT * FROM orders WHERE qr = ?',
                  [qrCode],
                  (_, {rows}) => {
                    const foundOrders = rows.raw(); // Получаем все записи
                    console.log(
                      'Найдено заказов в оффлайн-режиме:',
                      foundOrders,
                    );
                    resolve(foundOrders);
                  },
                  (_, err) => {
                    console.error(
                      'Ошибка при поиске заказов в базе данных:',
                      err,
                    );
                    reject(err);
                  },
                );
              },
              error => reject(error),
            );
          });

          if (orders.length > 0) {
            if (orders.length === 1) {
              // Если найден ровно один заказ, переходим сразу в OrderDetails
              const orderId = orders[0].id;
              navigation.navigate('OrderDetails', {orderId, qrCode});
            } else {
              // Если найдено несколько заказов, можно показать список для выбора
              customAlert(
                'Найдено несколько заказов',
                `Обнаружено ${orders.length} заказов с QR-кодом ${qrCode}. Выберите один:`,
                orders.map((order, index) => ({
                  text: `Заказ ${order.id} (${
                    order.number_act || 'Без номера'
                  })`,
                  onPress: () => {
                    navigation.navigate('OrderDetails', {
                      orderId: order.id,
                      qrCode,
                    });
                  },
                })),
                {cancelable: true},
              );
            }
          } else {
            customAlert('Ошибка', 'Заказ не найден в локальной базе данных');
          }
        } catch (error) {
          customAlert(
            'Ошибка',
            'Ошибка при поиске заказа в локальной базе данных',
          );
          console.error('Ошибка при поиске заказа в оффлайн-режиме:', error);
        }
      }
    } catch (error) {
      customAlert('Ошибка', 'Произошла непредвиденная ошибка');
      console.error('Ошибка в handleQRCodeScan:', error);
    }
  };

  if (!hasPermission) {
    return <Text>Нет доступа к камере</Text>;
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
      />
      {scanned && (
        <Pressable
          style={({pressed}) => [
            styles.button,
            {backgroundColor: pressed ? '#1e7d34' : '#28a745'},
          ]}
          onPress={() => setScanned(false)}>
          <Text style={styles.buttonText}>
            Нажмите, чтобы отсканировать снова
          </Text>
        </Pressable>
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
});
