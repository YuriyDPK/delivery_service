// DataMatrixCodeScannerScreen.tsx
import React, {useState, useEffect, useContext, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  Button,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import {BleManager} from 'react-native-ble-plx';
import {Buffer} from 'buffer';
import {requestCameraPermission} from './datamatrixComponents/cameraPermissions';
import {handleConfirm} from './datamatrixComponents/handleConfirm';
import AddMoreCodeButton from './datamatrixComponents/ui/AddMoreCodeButton';
import BackButton from './datamatrixComponents/ui/BackButton';
import PrintButton from './datamatrixComponents/ui/PrintButton';
import ShareButton from './datamatrixComponents/ui/ShareButton';
import ReplaceCodeButton from './datamatrixComponents/ui/ReplaceCodeButton';
import BarcodeScanner from './datamatrixComponents/ui/BarcodeScanner';
import DeviceList from './datamatrixComponents/ui/DeviceList';
import PrintLogs from './datamatrixComponents/ui/PrintLogs';
import PermissionDeniedView from './datamatrixComponents/ui/PermissionDeniedView';
import {stopScan} from './datamatrixComponents/stopScan';
import {NetworkContext} from '../components/NetworkContext'; // Импортируем NetworkContext
import {generateDataMatrixBase64} from './DataMatrixNative';
import ViewShot, {captureRef} from 'react-native-view-shot';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';

// Глобально определяем Buffer
if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}

export default function DataMatrixCodeScannerScreen({route, navigation}) {
  const {productId, orderId, qr} = route.params;
  const {isConnected} = useContext(NetworkContext); // Используем NetworkContext
  const [hasPermission, setHasPermission] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [scannerKey, setScannerKey] = useState(Date.now());
  const [success, setSuccess] = useState(false);
  const [dataMatrix, setDataMatrix] = useState('');
  const [dataMatrixUrl, setDataMatrixUrl] = useState('');
  const [printLogs, setPrintLogs] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [replaceLast, setReplaceLast] = useState(false);
  const viewShotRef = useRef(null);
  // BLE состояние
  const [showDeviceList, setShowDeviceList] = useState(false);
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
  useEffect(() => {
    if (success) {
      generateDataMatrixBase64(dataMatrix)
        .then(uri => setDataMatrixUrl(uri))
        .catch(() => {});
    }
  }, [success]);
  // Запрос разрешения на камеру
  useEffect(() => {
    requestCameraPermission(setHasPermission);
  }, []);

  // Подписка на событие отключения устройства
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

  // Выполняем handleConfirm при сканировании
  useEffect(() => {
    if (scanned && dataMatrix && !success) {
      handleConfirm({
        qr,
        productId,
        orderId, // Передаём orderId
        dataMatrix,
        setSuccess,
        setDataMatrixUrl,
        isConnected, // Передаём состояние сети
      });
    }
  }, [scanned, dataMatrix, success, isConnected]);

  const saveShotToGallery = async () => {
    try {
      if (!CameraRoll) {
        throw new Error(
          'CameraRoll не доступен. Убедитесь, что библиотека @react-native-camera-roll/camera-roll установлена и настроена.',
        );
      }

      if (Platform.OS === 'android') {
        if (Platform.Version < 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert('Ошибка', 'Нет доступа к хранилищу');
            return;
          }
        }
        // На Android 13+ CameraRoll сам обрабатывает доступ к медиа
      }

      const uri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 1,
      });

      console.log('URI изображения:', uri);
      await CameraRoll.save(uri, {type: 'photo'});
      Alert.alert('Успех', 'Сохранено в галерею');
    } catch (error) {
      console.error('Ошибка при сохранении:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить: ' + error.message);
    }
  };

  return (
    <>
      <PermissionDeniedView
        hasPermission={hasPermission}
        setHasPermission={setHasPermission}
      />
      {hasPermission && (
        <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
          <ScrollView contentContainerStyle={{flexGrow: 1}}>
            <View style={styles.container}>
              <BarcodeScanner
                success={success}
                scannerKey={scannerKey}
                scanned={scanned}
                setScanned={setScanned}
                replaceLast={replaceLast}
                setReplaceLast={setReplaceLast}
                setDataMatrix={setDataMatrix}
              />
              {success && (
                <View style={styles.successContainer}>
                  <ViewShot
                    ref={viewShotRef}
                    options={{format: 'png', quality: 1}}>
                    {dataMatrixUrl && (
                      <Image
                        source={{uri: dataMatrixUrl}}
                        style={{width: 200, height: 200, marginTop: 20}}
                        resizeMode="contain"
                      />
                    )}
                  </ViewShot>
                  <Text style={styles.successText}>Успех</Text>
                  <View style={styles.buttonsContainer}>
                    <Pressable
                      style={[styles.button, {backgroundColor: '#28a745'}]}
                      onPress={saveShotToGallery}>
                      <Text style={styles.buttonText}>Сохранить в галерею</Text>
                    </Pressable>
                    {/* <PrintButton
                      manager={manager}
                      setDevices={setDevices}
                      setScanningBle={setScanningBle}
                      setShowDeviceList={setShowDeviceList}
                      stopScan={() => stopScan(manager, setScanningBle)}
                      scanningBle={scanningBle}
                      isSending={isSending}
                    /> */}
                    <ShareButton dataMatrixUrl={dataMatrixUrl} />
                    <ReplaceCodeButton
                      setReplaceLast={setReplaceLast}
                      setSuccess={setSuccess}
                      setScanned={setScanned}
                      setScannerKey={setScannerKey}
                    />
                    <AddMoreCodeButton
                      setSuccess={setSuccess}
                      setScanned={setScanned}
                      setReplaceLast={setReplaceLast}
                      setScannerKey={setScannerKey}
                    />
                    <BackButton navigation={navigation} />
                  </View>
                  <DeviceList
                    showDeviceList={showDeviceList}
                    devices={devices}
                    scanningBle={scanningBle}
                    stopScan={() => stopScan(manager, setScanningBle)}
                    setShowDeviceList={setShowDeviceList}
                    setConnectedDevice={setConnectedDevice}
                    setServices={setServices}
                    setCharacteristics={setCharacteristics}
                    dataMatrix={dataMatrix}
                    connectedDevice={connectedDevice}
                    setIsSending={setIsSending}
                    setPrintLogs={setPrintLogs}
                  />
                  <PrintLogs
                    printLogs={printLogs}
                    setPrintLogs={setPrintLogs}
                    connectedDevice={connectedDevice}
                    setConnectedDevice={setConnectedDevice}
                    setServices={setServices}
                    setCharacteristics={setCharacteristics}
                  />
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  successText: {
    marginTop: 20,
    fontSize: 24,
    color: 'green',
    fontWeight: 'bold',
  },
  qrCode: {
    width: 200,
    height: 200,
  },
  buttonsContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 10,
    justifyContent: 'center',
    alignItems: 'center',
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
});
