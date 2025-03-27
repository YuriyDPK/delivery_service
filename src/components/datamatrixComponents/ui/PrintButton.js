// datamatrixComponents/ui/PrintButton.js
import React from 'react';
import {Pressable, Text, StyleSheet} from 'react-native';
import {startScan} from '../startScan';

const PrintButton = ({
  manager,
  setDevices,
  setScanningBle,
  setShowDeviceList,
  stopScan,
  scanningBle,
  isSending,
}) => {
  return (
    <Pressable
      style={[styles.button, {backgroundColor: '#28a745'}]}
      onPress={() =>
        startScan({
          manager,
          setDevices,
          setScanningBle,
          setShowDeviceList,
          stopScan,
        })
      }
      disabled={scanningBle || isSending}>
      <Text style={styles.buttonText}>
        {scanningBle ? 'Сканирование...' : 'Распечатать код'}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
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

export default PrintButton;
