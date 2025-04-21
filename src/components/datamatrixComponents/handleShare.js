// handleShare.js
import {Share, Alert} from 'react-native';

export const handleShare = async dataMatrixUrl => {
  try {
    await Share.share({
      message: `Посмотрите на DataMatrix код: ${dataMatrixUrl}`,
      url: dataMatrixUrl,
    });
  } catch (error) {
    customAlert('Ошибка', 'Не удалось отправить DataMatrix код.');
  }
};
