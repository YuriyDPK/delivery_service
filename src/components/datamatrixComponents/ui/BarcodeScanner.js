// datamatrixComponents/ui/BarcodeScanner.js
import React from 'react';
import {StyleSheet} from 'react-native';
import {Camera} from 'react-native-camera-kit';
import {handleBarCodeScanned} from '../handleBarCodeScanned';

const BarcodeScanner = ({
  success,
  scannerKey,
  scanned,
  setScanned,
  replaceLast,
  setReplaceLast,
  setDataMatrix,
}) => {
  if (success) return null;

  return (
    <>
      <Camera
        key={scannerKey}
        scanBarcode={true}
        style={[StyleSheet.absoluteFillObject, styles.camera]}
        onReadCode={
          scanned
            ? undefined
            : event =>
                handleBarCodeScanned({
                  event,
                  scanned,
                  setScanned,
                  replaceLast,
                  setReplaceLast,
                  setDataMatrix,
                })
        }
        showFrame={true}
        laserColor="#fff"
        frameColor="#fff"
      />
    </>
  );
};

const styles = StyleSheet.create({
  camera: {
    flex: 1,
    width: '100%',
  },
});

export default BarcodeScanner;
