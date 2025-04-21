// blePermissions.js
import {PermissionsAndroid, Platform, Alert} from 'react-native';

export const requestBLEPermissions = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);
      const fineLocationGranted =
        granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
        PermissionsAndroid.RESULTS.GRANTED;
      const btScanGranted =
        granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] ===
        PermissionsAndroid.RESULTS.GRANTED;
      const btConnectGranted =
        granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
        PermissionsAndroid.RESULTS.GRANTED;
      if (!fineLocationGranted || !btScanGranted || !btConnectGranted) {
        customAlert('Ошибка', 'BLE разрешения не предоставлены');
        return false;
      }
      return true;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return true; // Для iOS разрешения обрабатываются через Info.plist
};
