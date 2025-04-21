// datamatrixComponents/sendPrintCommand.js
import {Alert} from 'react-native';
import {Buffer} from 'buffer';

export const sendPrintCommand = async (
  dataMatrix,
  connectedDevice,
  setIsSending,
  setPrintLogs,
) => {
  if (!connectedDevice) {
    customAlert('Ошибка', 'Нет подключенного устройства');
    return;
  }

  setIsSending(true);

  const servicesAndCharacteristics = [
    {
      serviceUUID: '00001800-0000-1000-8000-00805f9b34fb',
      characteristicUUID: '00002a00-0000-1000-00805f9b34fb',
      mode: 'withResponse',
    },
    {
      serviceUUID: '0000ae30-0000-1000-8000-00805f9b34fb',
      characteristicUUID: '0000ae01-0000-1000-8000-00805f9b34fb',
      mode: 'withoutResponse',
    },
    {
      serviceUUID: '0000ae30-0000-1000-8000-00805f9b34fb',
      characteristicUUID: '0000ae03-0000-1000-8000-00805f9b34fb',
      mode: 'withoutResponse',
    },
    {
      serviceUUID: '0000ae30-0000-1000-8000-00805f9b34fb',
      characteristicUUID: '0000ae10-0000-1000-8000-00805f9b34fb',
      mode: 'withResponse',
    },
    {
      serviceUUID: '0000ae3a-0000-1000-8000-00805f9b34fb',
      characteristicUUID: '0000ae3b-0000-1000-8000-00805f9b34fb',
      mode: 'withoutResponse',
    },
  ];
  const testMessage = 'TEST PRINT\n';
  const commandBytes = Buffer.from(testMessage, 'utf-8');
  for (const {
    serviceUUID,
    characteristicUUID,
    mode,
  } of servicesAndCharacteristics) {
    try {
      setPrintLogs(prev => [
        ...prev,
        `Тестируем ${serviceUUID} / ${characteristicUUID} (${mode})`,
      ]);

      if (mode === 'withResponse') {
        await connectedDevice.writeCharacteristicWithResponseForService(
          serviceUUID,
          characteristicUUID,
          commandBytes.toString('base64'),
        );
      } else {
        await connectedDevice.writeCharacteristicWithoutResponseForService(
          serviceUUID,
          characteristicUUID,
          commandBytes.toString('base64'),
        );
      }

      setPrintLogs(prev => [
        ...prev,
        `✅ Успешно отправлено на ${characteristicUUID}`,
      ]);
      customAlert('Успех', `Команда отправлена через ${characteristicUUID}`);
    } catch (error) {
      setPrintLogs(prev => [
        ...prev,
        `❌ Ошибка на ${characteristicUUID}: ${error.message}`,
      ]);
      console.error(`Ошибка на ${characteristicUUID}:`, error);
    } finally {
      setIsSending(false);
    }
  }
};
