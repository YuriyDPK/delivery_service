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
  customAlert, // Добавляем параметр для использования кастомного Alert
}) => {
  // Определяем функцию для показа алертов в зависимости от переданного параметра
  // const showAlert = customAlert || Alert.alert;

  try {
    console.log('Начало обработки DataMatrix кода...');
    console.log('Параметры запроса:', {
      qr: qr || 'Отсутствует',
      productId: productId || 'Отсутствует',
      orderId: orderId || 'Отсутствует',
      dataMatrixLength: dataMatrix ? dataMatrix.length : 0,
      isConnected: isConnected ? 'Да' : 'Нет',
    });

    // Проверка обязательных параметров
    if (!qr) {
      console.error('Ошибка: отсутствует QR код');
      customAlert('Ошибка', 'Отсутствует QR код для привязки DataMatrix');
      return;
    }

    if (!productId) {
      console.error('Ошибка: отсутствует ID продукта');
      customAlert('Ошибка', 'Отсутствует ID продукта для привязки DataMatrix');
      return;
    }

    if (!dataMatrix) {
      console.error('Ошибка: отсутствует DataMatrix код');
      customAlert('Ошибка', 'Отсутствует DataMatrix код для привязки');
      return;
    }

    const userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      console.error(
        'Ошибка: не удалось получить ID пользователя из AsyncStorage',
      );
      customAlert(
        'Ошибка аутентификации',
        'Не удалось получить ID пользователя. Пожалуйста, перезайдите в приложение.',
      );
      return;
    }
    console.log('ID пользователя получен:', userId);
    console.log('QR код:', qr);
    console.log('ID продукта:', productId);
    console.log('DataMatrix код:', dataMatrix);

    if (isConnected) {
      console.log('Работаем в онлайн-режиме. Отправляем запрос на сервер...');
      // Онлайн-режим: отправляем запрос на сервер
      try {
        const response = await axios.get(`${API_BASE_URL}/rest/orders/setQR/`, {
          params: {
            USER_ID: userId,
            QR: qr,
            PRODUCT_ID: productId,
            DATA_MATRIX: dataMatrix,
            API_KEY: API_KEY,
          },
        });

        console.log('Ответ сервера:', response.data);

        if (response.data.RESULT === 'OK') {
          console.log('Сервер вернул успешный результат');
          setSuccess(true);
          // const datamatrixResponse = await axios.get(
          //   `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(
          //     dataMatrix,
          //   )}&code=DataMatrix`,
          // );
          // setDataMatrixUrl(datamatrixResponse.config.url);
          // Генерация DataMatrix-кода будет добавлена ниже
          customAlert('Успех', 'DataMatrix код успешно обновлён.');
        } else {
          console.error('Сервер вернул ошибку:', response.data);
          const errorMessage =
            response.data.ERROR || 'Неизвестная ошибка сервера';
          customAlert(
            'Ошибка сервера',
            `Не удалось обновить DataMatrix код: ${errorMessage}`,
          );
        }
      } catch (networkError) {
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

        // Предложим сохранить в оффлайн режиме, если произошла сетевая ошибка
        const saveOffline = await new Promise(resolve => {
          customAlert(
            'Сохранить оффлайн?',
            'Не удалось отправить данные на сервер. Хотите сохранить их локально для последующей отправки?',
            [
              {text: 'Нет', onPress: () => resolve(false)},
              {text: 'Да', onPress: () => resolve(true)},
            ],
          );
        });

        if (saveOffline) {
          // Переходим к сохранению в оффлайн режиме
          await saveDataOffline(
            userId,
            productId,
            orderId,
            qr,
            dataMatrix,
            setSuccess,
            customAlert,
          );
        }
      }
    } else {
      console.log('Работаем в оффлайн-режиме. Сохраняем данные локально...');
      await saveDataOffline(
        userId,
        productId,
        orderId,
        qr,
        dataMatrix,
        setSuccess,
        customAlert,
      );
    }
  } catch (error) {
    console.error('Критическая ошибка при обработке DataMatrix кода:', error);
    customAlert(
      'Критическая ошибка',
      `Произошла непредвиденная ошибка при обновлении DataMatrix кода: ${
        error && error.message ? error.message : 'Неизвестная ошибка'
      }`,
    );
  }
};

// Выносим логику сохранения в оффлайн режиме в отдельную функцию
const saveDataOffline = async (
  userId,
  productId,
  orderId,
  qr,
  dataMatrix,
  setSuccess,
  customAlert,
) => {
  try {
    console.log('Сохранение данных в оффлайн режиме...');
    const db = getDB();
    if (!db) {
      console.error('Ошибка: не удалось получить экземпляр базы данных');
      customAlert(
        'Ошибка базы данных',
        'Не удалось подключиться к локальной базе данных. Проверьте права доступа к хранилищу.',
      );
      return false;
    }

    console.log('Данные для сохранения:', {
      productId,
      orderId,
      qr,
      dataMatrixLength: dataMatrix.length,
    });

    const insertId = await new Promise((resolve, reject) => {
      db.transaction(
        tx => {
          tx.executeSql(
            'INSERT INTO pending_requests (productId, orderId, qr, dataMatrix, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            [productId, orderId, qr, dataMatrix, 'pending', Date.now()],
            (_, {insertId}) => {
              console.log('Запрос успешно сохранён с ID:', insertId);
              resolve(insertId);
            },
            (_, err) => {
              console.error('Ошибка SQL при сохранении запроса:', err);
              reject(err);
            },
          );
        },
        error => {
          console.error('Ошибка транзакции:', error);
          reject(error);
        },
      );
    });

    console.log('Данные успешно сохранены с ID:', insertId);
    setSuccess(true);
    customAlert(
      'Оффлайн-режим',
      'DataMatrix код успешно сохранён локально. Он будет отправлен на сервер автоматически при подключении к интернету.',
    );
    return true;
  } catch (error) {
    console.error('Ошибка при сохранении в оффлайн режиме:', error);
    customAlert(
      'Ошибка сохранения',
      `Не удалось сохранить DataMatrix код в оффлайн-режиме: ${
        error && error.message ? error.message : 'Неизвестная ошибка'
      }`,
    );
    return false;
  }
};
