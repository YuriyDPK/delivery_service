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
  TouchableOpacity,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';

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
import AlertProvider from './datamatrixComponents/AlertProvider';
import {customAlert} from './datamatrixComponents/customAlertManager';

// Определяем типы для route и navigation
interface RouteParams {
  productId: string;
  orderId: string;
  qr: string;
}

interface RouteProp {
  params: RouteParams;
}

interface NavigationProp {
  goBack: () => void;
  navigate: (screen: string, params?: any) => void;
}

// Глобально определяем Buffer
if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}

export default function DataMatrixCodeScannerScreen({
  route,
  navigation,
}: {
  route: RouteProp;
  navigation: NavigationProp;
}) {
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
  // Добавляем новые состояния
  const [displayMode, setDisplayMode] = useState('image'); // 'image', 'text', or 'formatted'
  const [formattedCode, setFormattedCode] = useState('');
  // BLE состояние
  const [showDeviceList, setShowDeviceList] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<any>(null);
  const [scanningBle, setScanningBle] = useState(false);
  const [manager, setManager] = useState<BleManager | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [characteristics, setCharacteristics] = useState<Record<string, any>>(
    {},
  );
  const [lastScannedCode, setLastScannedCode] = useState('');

  // Инициализация BLE менеджера
  useEffect(() => {
    const bleManager = new BleManager();
    // Явно привести к типу BleManager перед установкой в state
    setManager(bleManager as BleManager);
    return () => {
      bleManager.destroy();
    };
  }, []);
  useEffect(() => {
    if (success) {
      generateDataMatrixBase64(lastScannedCode)
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
      const subscription = connectedDevice.onDisconnected(
        (error: Error | null, device: any) => {
          if (error) {
            console.log('Ошибка при отключении:', error);
          }
          customAlert('Уведомление', `Устройство ${device.name} отключено`);
          setConnectedDevice(null);
          setServices([]);
          setCharacteristics({});
        },
      );
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
        customAlert, // Используем кастомный Alert
      });
    }
  }, [scanned, dataMatrix, success, isConnected]);

  // Извлечение кода идентификации (КИ) из DataMatrix
  const extractIdentificationCode = (code: string): string => {
    // Ищем паттерн КИ: 01 + 14 цифр + 21 + 13 символов
    const kiPattern = /01\d{14}21.{13}/;
    const match = code.match(kiPattern);

    if (match && match[0]) {
      return match[0]; // Возвращаем найденный КИ
    }

    // Если КИ не найден по шаблону, но длина кода минимум 31 символ
    // И он начинается с 01 и содержит 21 на 17-18 позициях
    if (
      code.length >= 31 &&
      code.startsWith('01') &&
      code.substring(16, 18) === '21'
    ) {
      return code.substring(0, 31); // Берем первые 31 символ
    }

    // Если КИ не найден, возвращаем исходный код
    return code;
  };

  // Обработка нажатия на код/изображение
  const handleCodePress = () => {
    // Циклическое переключение режимов отображения
    if (displayMode === 'image') {
      setDisplayMode('text');
      // Копирование КИ в буфер обмена
      const kiCode = extractIdentificationCode(lastScannedCode);
      Clipboard.setString(kiCode);
    } else {
      setDisplayMode('image');
    }
  };

  // Форматирование кода при его получении
  useEffect(() => {
    if (lastScannedCode) {
      setFormattedCode(extractIdentificationCode(lastScannedCode));
    }
  }, [lastScannedCode]);

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
            customAlert('Ошибка', 'Нет доступа к хранилищу');
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
      customAlert(
        'Успех',
        displayMode === 'image'
          ? 'DataMatrix код сохранен в галерею'
          : 'Код идентификации (КИ) сохранен в галерею',
      );
    } catch (error: unknown) {
      console.error('Ошибка при сохранении:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Неизвестная ошибка';
      customAlert('Ошибка', 'Не удалось сохранить: ' + errorMessage);
    }
  };

  return (
    <AlertProvider>
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
                setLastScannedCode={setLastScannedCode}
              />
              {success && (
                <View style={styles.successContainer}>
                  <TouchableOpacity onPress={handleCodePress}>
                    <ViewShot
                      ref={viewShotRef}
                      options={{format: 'png', quality: 1}}>
                      {displayMode === 'image' ? (
                        dataMatrixUrl && (
                          <Image
                            source={{uri: dataMatrixUrl}}
                            style={{width: 200, height: 200, marginTop: 20}}
                            resizeMode="contain"
                          />
                        )
                      ) : (
                        <View style={styles.kiContainer}>
                          <Text style={styles.codeTitle}>
                            Код идентификации (КИ):
                          </Text>
                          <Text style={styles.codeText}>{formattedCode}</Text>
                        </View>
                      )}
                    </ViewShot>

                    {displayMode === 'text' && (
                      <Text style={styles.codeCopiedText}>
                        КИ скопирован в буфер обмена
                      </Text>
                    )}
                  </TouchableOpacity>
                  <Text style={styles.successText}>Успех</Text>
                  <Text style={styles.helpText}>
                    Нажмите на изображение для переключения между DataMatrix и
                    кодом идентификации (КИ)
                  </Text>
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
    </AlertProvider>
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
  helpText: {
    marginTop: 5,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  qrCode: {
    width: 200,
    height: 200,
  },
  codeContainer: {
    width: 200,
    minHeight: 80,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginTop: 10,
  },
  kiContainer: {
    width: 200,
    minHeight: 120,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginTop: 20,
  },
  codeText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  codeCopiedText: {
    marginTop: 10,
    fontSize: 14,
    color: 'green',
    textAlign: 'center',
  },
  codeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 10,
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
