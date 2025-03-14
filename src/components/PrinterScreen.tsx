import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import BluetoothPrinterAPI, { BluetoothDevice } from "./BluetoothPrinter";

const PrinterScreen: React.FC = () => {
  const [devices, setDevices] = useState<BluetoothDevice[]>([]); // Список устройств
  const [connectedDevice, setConnectedDevice] =
    useState<BluetoothDevice | null>(null); // Подключенное устройство

  // Сканирование доступных устройств
  const scanDevices = async () => {
    try {
      const foundDevices = await BluetoothPrinterAPI.scanDevices();
      setDevices(foundDevices);
      Alert.alert("Успех", "Устройства найдены!");
    } catch (error) {
      Alert.alert("Ошибка", error.message);
    }
  };

  // Подключение к устройству
  const connect = async (device: BluetoothDevice) => {
    try {
      await BluetoothPrinterAPI.connectToDevice(device.address);
      setConnectedDevice(device);
      Alert.alert("Успех", `Подключено к ${device.name}`);
    } catch (error) {
      Alert.alert("Ошибка", error.message);
    }
  };

  // Печать текста
  const print = async () => {
    try {
      if (!connectedDevice) {
        Alert.alert("Ошибка", "Сначала подключитесь к принтеру.");
        return;
      }
      await BluetoothPrinterAPI.printText("Привет, это тестовая печать!");
      Alert.alert("Успех", "Текст успешно напечатан.");
    } catch (error) {
      Alert.alert("Ошибка", error.message);
    }
  };

  // Отключение устройства
  const disconnect = async () => {
    try {
      await BluetoothPrinterAPI.disconnect();
      setConnectedDevice(null);
      Alert.alert("Успех", "Устройство отключено.");
    } catch (error) {
      Alert.alert("Ошибка", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.button} onPress={scanDevices}>
        <Text style={styles.buttonText}>Сканировать устройства</Text>
      </Pressable>

      {/* Список найденных устройств */}
      <FlatList
        data={devices}
        keyExtractor={(item) => item.address}
        renderItem={({ item }) => (
          <Pressable style={styles.deviceButton} onPress={() => connect(item)}>
            <Text style={styles.deviceText}>{item.name}</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Нет найденных устройств</Text>
        }
      />

      {connectedDevice && (
        <>
          <Pressable style={styles.button} onPress={print}>
            <Text style={styles.buttonText}>Напечатать текст</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={disconnect}>
            <Text style={styles.buttonText}>Отключить устройство</Text>
          </Pressable>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 10,
  },
  button: {
    backgroundColor: "#28a745",
    padding: 15,
    marginVertical: 10,
    borderRadius: 8,
    width: "80%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  deviceButton: {
    backgroundColor: "#007bff",
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    width: "80%",
    alignItems: "center",
  },
  deviceText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  emptyText: {
    marginTop: 20,
    fontSize: 16,
    color: "#6c757d",
  },
});

export default PrinterScreen;
