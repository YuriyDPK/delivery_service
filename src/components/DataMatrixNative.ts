// DataMatrixNative.ts
import {Alert, NativeModules, PermissionsAndroid, Platform} from 'react-native';

const {DataMatrixGenerator} = NativeModules;

export const generateDataMatrixBase64 = async (
  data: string,
): Promise<string> => {
  try {
    console.log('Попытка генерации DataMatrix для данных:', data);
    const base64 = await DataMatrixGenerator.generateBase64(data);
    console.log('DataMatrix успешно сгенерирован:', base64);
    return base64;
  } catch (err) {
    console.error('Ошибка генерации DataMatrix:', err);
    throw err;
  }
};
