import {Alert} from 'react-native';
import {loadDeviceDetails} from './loadDeviceDetails';

export const connectToDevice = async ({
  device,
  stopScan,
  setConnectedDevice,
  setShowDeviceList,
  setServices,
  setCharacteristics,
}) => {
  try {
    stopScan();
    const connected = await device.connect({timeout: 10000});
    await connected.discoverAllServicesAndCharacteristics();
    setConnectedDevice(connected);
    customAlert(
      'Успех',
      `Подключено к устройству: ${device.name || device.id}`,
    );

    // Загружаем сервисы и характеристики
    await loadDeviceDetails({
      device: connected,
      setServices,
      setCharacteristics,
    });

    setShowDeviceList(false); // Закрываем список устройств
    return connected; // Возвращаем подключённое устройство
  } catch (error) {
    customAlert('Ошибка', `Не удалось подключиться: ${error.message}`);
    console.error('Ошибка при подключении:', error);
    return null;
  }
};
