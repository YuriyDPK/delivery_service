import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Image,
  Share,
  SafeAreaView,
  ScrollView,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {API_BASE_URL, API_KEY} from '../../config';
import {BleManager} from 'react-native-ble-plx';
import {Buffer} from 'buffer';
import {Camera} from 'react-native-camera-kit';

// Глобально определяем Buffer
if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}

export default function DataMatrixCodeScannerScreen({route, navigation}) {
  const {productId, orderId, qr} = route.params;
  const [hasPermission, setHasPermission] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [scannerKey, setScannerKey] = useState(Date.now());
  const [success, setSuccess] = useState(false);
  const [dataMatrix, setDataMatrix] = useState('');
  const [dataMatrixUrl, setDataMatrixUrl] = useState('');
  const [printLogs, setPrintLogs] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [replaceLast, setReplaceLast] = useState(false);

  // BLE состояние
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [scanningBle, setScanningBle] = useState(false);
  const [manager, setManager] = useState(null);
  const [services, setServices] = useState([]);
  const [characteristics, setCharacteristics] = useState({});

  // Инициализация BLE менеджера
  useEffect(() => {
    const bleManager = new BleManager();
    setManager(bleManager);
    return () => {
      bleManager.destroy();
    };
  }, []);

  // Запрос разрешения на камеру (для Android)
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

  useEffect(() => {
    requestCameraPermission();
  }, []);

  // Обработка считывания DataMatrix кода
  const handleBarCodeScanned = ({nativeEvent}) => {
    if (scanned) return;
    setScanned(true);
    const newCode = nativeEvent.codeStringValue.trim();
    if (replaceLast) {
      setDataMatrix(prev => {
        if (!prev) return newCode;
        const parts = prev.split('\n');
        parts[parts.length - 1] = newCode;
        return parts.join('\n');
      });
      setReplaceLast(false);
    } else {
      setDataMatrix(prev => (prev ? prev + '\n' + newCode : newCode));
    }
  };

  // Функции для работы с Bluetooth (BLE)
  const startScan = () => {
    if (manager) {
      setDevices([]);
      setScanningBle(true);
      manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          Alert.alert('Ошибка', 'Ошибка сканирования Bluetooth устройства.');
          setScanningBle(false);
          return;
        }
        if (device && device.id) {
          setDevices(prev => {
            if (!prev.some(d => d.id === device.id)) {
              return [...prev, device];
            }
            return prev;
          });
        }
      });
      setTimeout(() => {
        stopScan();
      }, 10000);
    }
  };

  const stopScan = () => {
    if (manager) {
      manager.stopDeviceScan();
      setScanningBle(false);
    }
  };

  const connectToDevice = async device => {
    try {
      stopScan();
      const connected = await device.connect();
      await connected.discoverAllServicesAndCharacteristics();
      setConnectedDevice(connected);
      Alert.alert('Успех', `Подключено к устройству: ${device.name}`);
      loadDeviceDetails(connected);
    } catch (error) {
      Alert.alert(
        'Ошибка',
        `Не удалось подключиться к устройству: ${device.name}`,
      );
      console.error('Ошибка при подключении:', error);
    }
  };

  const loadDeviceDetails = async device => {
    try {
      const servicesList = await device.services();
      setServices(servicesList);
      const charsData = {};
      for (const service of servicesList) {
        const chars = await service.characteristics();
        charsData[service.uuid] = chars;
      }
      setCharacteristics(charsData);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить детали устройства');
      console.error('Ошибка при загрузке сервисов и характеристик:', error);
    }
  };

  useEffect(() => {
    if (connectedDevice) {
      const subscription = connectedDevice.onDisconnected((error, device) => {
        if (error) {
          console.log('Ошибка при отключении:', error);
        }
        Alert.alert('Уведомление', `Устройство ${device.name} отключено`);
        setConnectedDevice(null);
        setServices([]);
        setCharacteristics({});
      });
      return () => {
        subscription.remove();
      };
    }
  }, [connectedDevice]);

  // Подтверждение и обновление DataMatrix кода
  const handleConfirm = async () => {
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
      console.log('dataMatrix:', dataMatrix);
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

  useEffect(() => {
    if (scanned && dataMatrix && !success) {
      handleConfirm();
    }
  }, [scanned, dataMatrix, success]);

  // Отправка команды печати через BLE
  const sendPrintCommand = async dataMatrix => {
    if (!connectedDevice) {
      Alert.alert('Ошибка', 'Нет подключенного устройства');
      return;
    }
    setIsSending(true);
    try {
      let attemptCount = 0;
      let successCount = 0;
      let failureCount = 0;
      const newLogs = [];
      for (const service of services) {
        for (const char of characteristics[service.uuid]) {
          if (char.isWritableWithResponse || char.isWritableWithoutResponse) {
            attemptCount += 1;
            try {
              const command = `PRINT_DATAMATRIX:${dataMatrix}`;
              const commandBytes = Buffer.from(command, 'utf-8');
              if (char.isWritableWithResponse) {
                await char.writeWithResponse(commandBytes.toString('hex'));
              } else if (char.isWritableWithoutResponse) {
                await char.writeWithoutResponse(commandBytes.toString('hex'));
              }
              newLogs.push(
                `Успешно отправлено через характеристику UUID: ${char.uuid}`,
              );
              console.log(
                `Команда отправлена через характеристику UUID: ${char.uuid}`,
              );
              successCount += 1;
            } catch (writeError) {
              newLogs.push(
                `Не удалось отправить через характеристику UUID: ${char.uuid}`,
              );
              console.error(
                `Ошибка при отправке через характеристику ${char.uuid}:`,
                writeError,
              );
              failureCount += 1;
            }
          }
        }
      }
      setPrintLogs(newLogs);
      Alert.alert(
        'Результат отправки',
        `Попыток: ${attemptCount}\nУспешно: ${successCount}\nНеудачно: ${failureCount}`,
      );
      if (successCount === 0) {
        Alert.alert(
          'Ошибка',
          'Команда не была успешно отправлена ни через одну из доступных характеристик.',
        );
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось отправить команду на устройство');
      console.error('Ошибка при отправке команды:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Функция для шаринга DataMatrix кода
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Посмотрите на DataMatrix код: ${dataMatrixUrl}`,
        url: dataMatrixUrl,
      });
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось отправить DataMatrix код.');
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text>Нет доступа к камере</Text>
        <Pressable
          style={[styles.button, {backgroundColor: '#28a745'}]}
          onPress={requestCameraPermission}>
          <Text style={styles.buttonText}>Запросить разрешение</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
      <ScrollView contentContainerStyle={{flexGrow: 1}}>
        <View style={styles.container}>
          {!success && (
            <>
              <Camera
                key={scannerKey}
                scanBarcode={true}
                style={[StyleSheet.absoluteFillObject, styles.camera]}
                onReadCode={scanned ? undefined : handleBarCodeScanned}
                showFrame={true}
                laserColor="#fff"
                frameColor="#fff"
              />
              {/* {scanned && (
                <View style={styles.buttonOverlay}>
                  <Pressable
                    style={[styles.button, {width: '80%'}]}
                    onPress={handleConfirm}>
                    <Text style={styles.buttonText}>Готово</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.button, {width: '80%'}]}
                    onPress={() => {
                      setReplaceLast(true);
                      setScanned(false);
                      setScannerKey(Date.now());
                    }}>
                    <Text style={styles.buttonText}>Заменить код</Text>
                  </Pressable>
                </View>
              )} */}
            </>
          )}
          {success && (
            <View style={styles.successContainer}>
              <Image source={{uri: dataMatrixUrl}} style={styles.qrCode} />
              <Text style={styles.successText}>Успешно</Text>
              <View style={styles.buttonsContainer}>
                <Pressable
                  style={[styles.button, {backgroundColor: '#28a745'}]}
                  onPress={handleShare}>
                  <Text style={styles.buttonText}>Поделиться кодом</Text>
                </Pressable>
                <Pressable
                  style={[styles.button, {backgroundColor: '#28a745'}]}
                  onPress={() => {
                    setReplaceLast(true);
                    setSuccess(false);
                    setScanned(false);
                    setScannerKey(Date.now());
                  }}>
                  <Text style={styles.buttonText}>Заменить код</Text>
                </Pressable>
                <Pressable
                  style={[styles.button, {backgroundColor: '#28a745'}]}
                  onPress={() => {
                    setSuccess(false);
                    setScanned(false);
                    setReplaceLast(false);
                    setScannerKey(Date.now());
                  }}>
                  <Text style={styles.buttonText}>Добавить еще код</Text>
                </Pressable>
                {printLogs.length > 0 && (
                  <View style={styles.logContainer}>
                    <Text style={styles.logTitle}>Логи отправки команды:</Text>
                    <ScrollView style={styles.logScroll}>
                      {printLogs.map((log, index) => (
                        <Text key={index} style={styles.logText}>
                          {log}
                        </Text>
                      ))}
                    </ScrollView>
                    <Pressable
                      style={[styles.button, {backgroundColor: '#6c757d'}]}
                      onPress={() => setPrintLogs([])}>
                      <Text style={styles.buttonText}>Очистить логи</Text>
                    </Pressable>
                  </View>
                )}
                <Pressable
                  style={[styles.button, {backgroundColor: '#28a745'}]}
                  onPress={handleBack}>
                  <Text style={styles.buttonText}>Назад</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  button: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 10,
    width: '80%',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  buttonOverlay: {
    position: 'absolute',
    bottom: 40,
    gap: 10,
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  qrCode: {
    width: 200,
    height: 200,
  },
  successText: {
    marginTop: 20,
    fontSize: 24,
    color: 'green',
    fontWeight: 'bold',
  },
  buttonsContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logContainer: {
    width: '100%',
    padding: 10,
    backgroundColor: '#e9ecef',
    borderRadius: 10,
    marginTop: 10,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  logScroll: {
    maxHeight: 150,
  },
  logText: {
    fontSize: 14,
    color: '#343a40',
  },
});
