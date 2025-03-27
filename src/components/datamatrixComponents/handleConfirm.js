// handleConfirm.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {Alert} from 'react-native';
import {API_BASE_URL, API_KEY} from '../../../config';

export const handleConfirm = async ({
  qr,
  productId,
  dataMatrix,
  setSuccess,
  setDataMatrixUrl,
}) => {
  try {
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      Alert.alert('Ошибка', 'Не удалось получить ID пользователя');
      return;
    }
    const response = await axios.get(`${API_BASE_URL}/rest/orders/setQR/`, {
      params: {
        USER_ID: userId,
        QR: qr,
        PRODUCT_ID: productId,
        DATA_MATRIX: dataMatrix,
        API_KEY: API_KEY,
      },
    });
    // console.log('dataMatrix:', dataMatrix);--- delete
    if (response.data.RESULT === 'OK') {
      setSuccess(true);
      const datamatrixResponse = await axios.get(
        `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(
          dataMatrix,
        )}&code=DataMatrix`,
      );
      setDataMatrixUrl(datamatrixResponse.config.url);
      Alert.alert('Успех', 'DataMatrix код успешно обновлён.');
    } else {
      Alert.alert('Ошибка', 'Не удалось обновить DataMatrix код.');
    }
  } catch (error) {
    Alert.alert('Ошибка', 'Произошла ошибка при обновлении DataMatrix кода.');
    console.error('Ошибка при обновлении DataMatrix кода:', error);
  }
};
