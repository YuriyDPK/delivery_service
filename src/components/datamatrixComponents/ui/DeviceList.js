import React from 'react';
import {View, Text, StyleSheet, Pressable, ScrollView} from 'react-native';
import {connectToDevice} from '../connectToDevice';
import {sendPrintCommand} from '../sendPrintCommand';

const DeviceList = ({
  showDeviceList,
  devices,
  scanningBle,
  stopScan,
  setShowDeviceList,
  setConnectedDevice,
  setServices,
  setCharacteristics,
  dataMatrix,
  setIsSending,
  setPrintLogs,
}) => {
  if (!showDeviceList) return null;

  const handleDevicePress = async device => {
    // Подключаемся к устройству и получаем подключённый объект
    const connected = await connectToDevice({
      device,
      stopScan,
      setConnectedDevice,
      setShowDeviceList,
      setServices,
      setCharacteristics,
    });
    if (connected) {
      await sendPrintCommand(dataMatrix, connected, setIsSending, setPrintLogs);
    }
  };

  const handleClose = () => {
    stopScan();
    setShowDeviceList(false);
  };

  return (
    <View style={styles.deviceListContainer}>
      <Text style={styles.logTitle}>Доступные устройства:</Text>
      <ScrollView style={styles.deviceScroll}>
        {devices.length > 0 ? (
          devices.map(device => (
            <Pressable
              key={device.id}
              style={styles.deviceItem}
              onPress={() => handleDevicePress(device)}>
              <Text style={styles.deviceText}>
                {device.name || 'Без имени'} (ID: {device.id})
              </Text>
            </Pressable>
          ))
        ) : (
          <Text style={styles.deviceText}>
            {scanningBle ? 'Сканирование...' : 'Устройства не найдены'}
          </Text>
        )}
      </ScrollView>
      <Pressable
        style={[styles.button, {backgroundColor: '#6c757d'}]}
        onPress={handleClose}>
        <Text style={styles.buttonText}>Закрыть</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  deviceListContainer: {
    width: '100%',
    padding: 10,
    backgroundColor: '#e9ecef',
    borderRadius: 10,
    marginTop: 10,
  },
  deviceScroll: {
    maxHeight: 200,
  },
  deviceItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  deviceText: {
    fontSize: 14,
    color: '#343a40',
  },
  logTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#6c757d',
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

export default DeviceList;
