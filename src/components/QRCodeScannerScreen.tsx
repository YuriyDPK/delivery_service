import React, {useState, useEffect, useCallback} from 'react';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {API_BASE_URL, API_KEY} from '../../config';
import {Camera, CameraType} from 'react-native-camera-kit';

interface QRCodeScannerScreenProps {
  route: any;
}

const QRCodeScannerScreen: React.FC<QRCodeScannerScreenProps> = ({route}) => {
  const navigation = useNavigation();
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [scanned, setScanned] = useState<boolean>(false);
  const [scannerKey, setScannerKey] = useState<number>(Date.now());

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

  useFocusEffect(
    useCallback(() => {
      setScanned(false);
      setScannerKey(Date.now());
    }, []),
  );

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const handleQRCodeScan = async ({nativeEvent}: any) => {
    if (scanned) return;
    setScanned(true);

    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Ошибка', 'Не удалось получить ID пользователя');
        return;
      }

      const qrCode = nativeEvent.codeStringValue.trim();

      const response = await axios.get(`${API_BASE_URL}/rest/orders/getInfo/`, {
        params: {
          USER_ID: userId,
          ORDER_ID: 0,
          QR: qrCode,
          API_KEY: API_KEY,
        },
      });

      const json = response.data;
      if (json.RESULT) {
        const orderId = json.RESULT.id;
        navigation.navigate('OrderDetails', {orderId, qrCode});
      } else {
        Alert.alert('Ошибка', 'Не удалось найти данные по заказу');
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Ошибка при подключении к серверу');
      console.error('Ошибка при получении информации о заказе:', error);
    }
  };

  if (!hasPermission) {
    return <Text>Нет доступа к камере</Text>;
  }

  return (
    <View style={styles.container}>
      <Camera
        key={scannerKey}
        scanBarcode={true}
        style={styles.camera}
        onReadCode={scanned ? undefined : handleQRCodeScan}
        showFrame={true}
        laserColor="#fff"
        frameColor="#fff"
      />
      {scanned && (
        <Pressable
          style={({pressed}) => [
            styles.button,
            {backgroundColor: pressed ? '#1e7d34' : '#28a745'},
          ]}
          onPress={() => setScanned(false)}>
          <Text style={styles.buttonText}>
            Нажмите, чтобы отсканировать снова
          </Text>
        </Pressable>
      )}
    </View>
  );
};

export default QRCodeScannerScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
  },
  camera: {
    flex: 1, // Камера занимает всё доступное пространство
    width: '100%', // Устанавливаем ширину на 100%
  },
  button: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    padding: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
