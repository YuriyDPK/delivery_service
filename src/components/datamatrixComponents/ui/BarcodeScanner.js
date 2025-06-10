// datamatrixComponents/ui/BarcodeScanner.js
import React, {useState} from 'react';
import {StyleSheet, View, Text} from 'react-native';
import {Camera} from 'react-native-camera-kit';
import {handleBarCodeScanned} from '../handleBarCodeScanned';
import {customAlert} from '../customAlertManager';

const BarcodeScanner = ({
  success,
  scannerKey,
  scanned,
  setScanned,
  replaceLast,
  setReplaceLast,
  setDataMatrix,
  setLastScannedCode,
}) => {
  const [scanError, setScanError] = useState(null);
  const [scanAttempts, setScanAttempts] = useState(0);

  if (success) return null;

  const handleScanError = error => {
    console.error('Ошибка инициализации сканера:', error);
    setScanError(error.message || 'Неизвестная ошибка');
    customAlert(
      'Ошибка камеры',
      `Не удалось инициализировать сканер: ${
        error.message || 'Неизвестная ошибка'
      }`,
    );
  };

  const handleReadCode = event => {
    try {
      if (scanned) return;

      setScanAttempts(prev => prev + 1);
      console.log(`Попытка сканирования #${scanAttempts + 1}`);

      if (!event || !event.nativeEvent) {
        console.error('Ошибка события сканирования: нет данных события');
        return;
      }

      const newCode = event.nativeEvent.codeStringValue?.trim();
      console.log('Тип отсканированного кода:', event.nativeEvent.codeType);
      console.log(
        'Формат кода:',
        event.nativeEvent.codeFormat || 'Неизвестный формат',
      );

      // Проверяем, является ли код DataMatrix
      if (
        event.nativeEvent.codeType &&
        event.nativeEvent.codeType.toLowerCase() !== 'datamatrix' &&
        event.nativeEvent.codeType.toLowerCase() !== 'data_matrix'
      ) {
        console.warn(
          'Отсканирован не DataMatrix код:',
          event.nativeEvent.codeType,
        );
        customAlert(
          'Неверный тип кода',
          `Отсканирован ${event.nativeEvent.codeType}, а не DataMatrix код. Пожалуйста, отсканируйте DataMatrix код.`,
        );
        return;
      }

      setLastScannedCode(newCode);
      setScanError(null);

      handleBarCodeScanned({
        event,
        scanned,
        setScanned,
        replaceLast,
        setReplaceLast,
        setDataMatrix,
      });
    } catch (error) {
      console.error('Критическая ошибка при обработке сканирования:', error);
      customAlert(
        'Ошибка сканирования',
        `Не удалось обработать отсканированный код: ${
          error.message || 'Неизвестная ошибка'
        }`,
      );
    }
  };

  return (
    <>
      <Camera
        key={scannerKey}
        scanBarcode={true}
        style={[StyleSheet.absoluteFillObject, styles.camera]}
        onReadCode={scanned ? undefined : handleReadCode}
        showFrame={true}
        laserColor="#fff"
        frameColor="#fff"
        onCameraError={handleScanError}
      />
      {scanError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Ошибка сканера: {scanError}</Text>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  camera: {
    flex: 1,
    width: '100%',
  },
  errorContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
  },
});

export default BarcodeScanner;
