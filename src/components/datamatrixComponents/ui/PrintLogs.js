// datamatrixComponents/ui/PrintLogs.js
import React from 'react';
import {View, Text, StyleSheet, Pressable, ScrollView} from 'react-native';

const PrintLogs = ({
  printLogs,
  setPrintLogs,
  connectedDevice,
  setConnectedDevice,
  setServices,
  setCharacteristics,
}) => {
  if (printLogs.length === 0) return null;

  const handleDisconnect = async () => {
    try {
      if (connectedDevice) {
        const isConnected = await connectedDevice.isConnected();
        if (isConnected) {
          await connectedDevice.cancelConnection();
          setPrintLogs(prev => [...prev, '✅ Устройство отключается...']);
          // Остальные setX будут вызваны внутри onDisconnected
        } else {
          setPrintLogs(prev => [...prev, '⚠️ Устройство уже отключено']);
        }
      } else {
        setPrintLogs(prev => [...prev, '⚠️ Нет активного подключения']);
      }
    } catch (error) {
      console.error('Ошибка при отключении:', error);
      setPrintLogs(prev => [
        ...prev,
        `❌ Ошибка при отключении: ${error.message}`,
      ]);
    }
  };

  return (
    <View style={styles.logContainer}>
      <Text style={styles.logTitle}>Логи отправки команды:</Text>
      <ScrollView style={styles.logScroll}>
        {printLogs.map((log, index) => (
          <Text key={index} style={styles.logText}>
            {log}
          </Text>
        ))}
        {connectedDevice && (
          <Text style={styles.logText}>
            Подключено к: {connectedDevice.name || connectedDevice.id}
          </Text>
        )}
      </ScrollView>

      <Pressable
        style={[styles.button, {backgroundColor: '#6c757d'}]}
        onPress={() => setPrintLogs([])}>
        <Text style={styles.buttonText}>Очистить логи</Text>
      </Pressable>

      <Pressable
        style={[styles.button, {backgroundColor: '#dc3545'}]}
        onPress={handleDisconnect}>
        <Text style={styles.buttonText}>Отключить устройство</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  logContainer: {
    width: '100%',
    padding: 10,
    backgroundColor: '#e9ecef',
    borderRadius: 10,
    marginTop: 10,
    gap: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  // logScroll: {
  //   maxHeight: 150,
  // },
  logText: {
    fontSize: 14,
    color: '#343a40',
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

export default PrintLogs;
