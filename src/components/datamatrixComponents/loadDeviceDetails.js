import {Alert} from 'react-native';
import {Buffer} from 'buffer';

export const loadDeviceDetails = async ({
  device,
  setServices,
  setCharacteristics,
  bleManager,
}) => {
  try {
    // Подключение к устройству и обнаружение сервисов и характеристик
    await device
      .connect()
      .then(device => device.discoverAllServicesAndCharacteristics())
      .then(device => {
        const data = Buffer.from('Текст для печати').toString('base64');
        // Здесь предполагается, что serviceUUID и characteristicUUID известны
        // Если они не заданы, нужно будет выбрать их из writableCharacteristics
        return device.writeCharacteristicWithResponseForService(
          '000018f0-0000-1000-8000-00805f9b34fb', // Пример serviceUUID, замените на актуальный
          '00002af1-0000-1000-8000-00805f9b34fb', // Пример characteristicUUID, замените на актуальный
          data,
        );
      })
      .then(() => console.log('Данные отправлены'))
      .catch(error => console.error('Ошибка при отправке данных:', error));

    // Получение списка сервисов
    const servicesList = await device.services();
    setServices(servicesList);
    const charsData = {};
    const writableCharacteristics = [];

    // Перебор сервисов и характеристик
    for (const service of servicesList) {
      const chars = await service.characteristics();
      charsData[service.uuid] = chars;

      console.log(`Сервис: ${service.uuid}`);
      for (const characteristic of chars) {
        console.log(`  Характеристика: ${characteristic.uuid}`);
        console.log(
          `    ⤷ isWritableWithResponse: ${characteristic.isWritableWithResponse}`,
        );
        console.log(
          `    ⤷ isWritableWithoutResponse: ${characteristic.isWritableWithoutResponse}`,
        );

        if (
          characteristic.isWritableWithResponse ||
          characteristic.isWritableWithoutResponse
        ) {
          writableCharacteristics.push({
            serviceUUID: service.uuid,
            characteristicUUID: characteristic.uuid,
            mode: characteristic.isWritableWithResponse
              ? 'withResponse'
              : 'withoutResponse',
          });
        }
      }
    }

    setCharacteristics(charsData);

    if (writableCharacteristics.length === 0) {
      customAlert('Внимание', 'Не найдено записываемых характеристик');
    } else {
      console.log('🔍 Найденные записываемые характеристики:');
      writableCharacteristics.forEach(item => {
        console.log(
          `  Сервис: ${item.serviceUUID}, Характеристика: ${item.characteristicUUID}, Режим записи: ${item.mode}`,
        );
      });
    }

    return writableCharacteristics;
  } catch (error) {
    customAlert('Ошибка', 'Не удалось загрузить детали устройства');
    console.error('Ошибка при загрузке сервисов и характеристик:', error);
  }
};
