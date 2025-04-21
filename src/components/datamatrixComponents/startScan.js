// startScan.js
import {Alert} from 'react-native';
import {requestBLEPermissions} from './blePermissions';

export const startScan = async ({
  manager,
  setDevices,
  setScanningBle,
  setShowDeviceList,
  stopScan,
}) => {
  const blePermsGranted = await requestBLEPermissions();
  if (!blePermsGranted) return;

  if (!manager) {
    customAlert('Ошибка', 'BLE менеджер не инициализирован');
    return;
  }

  setDevices([]); // Очищаем список устройств
  setScanningBle(true);
  setShowDeviceList(true); // Показываем список устройств

  manager.startDeviceScan(null, {allowDuplicates: false}, (error, device) => {
    if (error) {
      customAlert('Ошибка', `Не удалось начать сканирование: ${error.message}`);
      setScanningBle(false);
      setShowDeviceList(false);
      return;
    }
    if (device && device.name) {
      // Фильтруем только устройства с именами
      setDevices(prev => {
        if (!prev.some(d => d.id === device.id)) {
          return [...prev, device];
        }
        return prev;
      });
    }
  });

  // Останавливаем сканирование через 10 секунд
  setTimeout(() => {
    stopScan();
  }, 10000);
};
