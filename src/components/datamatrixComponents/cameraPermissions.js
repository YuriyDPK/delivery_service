// cameraPermissions.js
import {PermissionsAndroid, Platform} from 'react-native';

export const requestCameraPermission = async setHasPermission => {
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
    setHasPermission(true); // Для iOS предполагается, что разрешение задано в Info.plist
  }
};
