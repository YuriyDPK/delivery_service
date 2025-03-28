// handleConfirm.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {Alert} from 'react-native';
import {API_BASE_URL, API_KEY} from '../../../config';
import {getDB} from '../../database'; // Импортируем доступ к базе данных

export const handleConfirm = async ({
  qr,
  productId,
  orderId, // Добавляем orderId для сохранения в pending_requests
  dataMatrix,
  setSuccess,
  setDataMatrixUrl,
  isConnected, // Добавляем параметр для проверки состояния сети
}) => {
  try {
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      Alert.alert('Ошибка', 'Не удалось получить ID пользователя');
      return;
    }
    console.log('qr111', qr);
    console.log('productId111', productId);
    console.log('dataMatrix111', dataMatrix);

    if (isConnected) {
      // Онлайн-режим: отправляем запрос на сервер
      const response = await axios.get(`${API_BASE_URL}/rest/orders/setQR/`, {
        params: {
          USER_ID: userId,
          QR: qr,
          PRODUCT_ID: productId,
          DATA_MATRIX: dataMatrix,
          API_KEY: API_KEY,
        },
      });

      if (response.data.RESULT === 'OK') {
        setSuccess(true);
        // const datamatrixResponse = await axios.get(
        //   `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(
        //     dataMatrix,
        //   )}&code=DataMatrix`,
        // );
        // setDataMatrixUrl(datamatrixResponse.config.url);
        // Генерация DataMatrix-кода будет добавлена ниже
        Alert.alert('Успех', 'DataMatrix код успешно обновлён.');
      } else {
        Alert.alert('Ошибка', 'Не удалось обновить DataMatrix код.');
      }
    } else {
      // Оффлайн-режим: сохраняем запрос в pending_requests
      const db = getDB();
      if (!db) {
        Alert.alert(
          'Ошибка',
          'Не удалось подключиться к локальной базе данных',
        );
        return;
      }

      try {
        console.log('data111:', productId, orderId, qr, dataMatrix);

        await new Promise((resolve, reject) => {
          db.transaction(
            tx => {
              tx.executeSql(
                'INSERT INTO pending_requests (productId, orderId, qr, dataMatrix, status) VALUES (?, ?, ?, ?, ?)',
                [productId, orderId, qr, dataMatrix, 'pending'],
                (_, {insertId}) => {
                  console.log(
                    'Запрос сохранён в pending_requests с ID:',
                    insertId,
                  );
                  resolve(insertId);
                },
                (_, err) => {
                  console.error(
                    'Ошибка при сохранении запроса в pending_requests:',
                    err,
                  );
                  reject(err);
                },
              );
            },
            error => reject(error),
          );
        });

        setSuccess(true); // Устанавливаем success, чтобы показать пользователю, что операция "выполнена"
        Alert.alert(
          'Оффлайн-режим',
          'DataMatrix код сохранён локально. Он будет отправлен на сервер, как только появится интернет.',
        );
      } catch (error) {
        Alert.alert(
          'Ошибка',
          'Не удалось сохранить DataMatrix код в оффлайн-режиме.',
        );
        console.error(
          'Ошибка при сохранении DataMatrix кода в оффлайн-режиме:',
          error,
        );
      }
    }
  } catch (error) {
    Alert.alert('Ошибка', 'Произошла ошибка при обновлении DataMatrix кода.');
    console.error('Ошибка при обновлении DataMatrix кода:', error);
  }
};
