// components/OrderItem.js
import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from '@expo/vector-icons/Feather';

export const OrderItem = ({
  item,
  handleAddressSelect,
  isSelected,
  navigation,
}) => {
  // Check if dateEnd or dateStart is empty and set a default value if needed
  const formattedDateEnd = item.dateEnd
    ? new Date(item.dateEnd).toLocaleString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '--:--'; // Placeholder when dateEnd is empty

  const formattedDateStart = item.dateStart
    ? new Date(item.dateStart).toLocaleString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '--:--'; // Placeholder when dateStart is empty

  const orderStatusIcon =
    item.status === 'Выполнено' ? 'checkmark-circle' : 'timer-outline';
  const orderStatusColor = item.status === 'Выполнено' ? 'green' : 'black';

  return (
    <View style={styles.container2}>
      <Feather name="map-pin" size={22} color="gray" style={styles.iconMap} />
      <View style={styles.addressContainer}>
        <Text style={styles.addressNumber}>№ акта {item.id}</Text>
        <TouchableOpacity
          onPress={() => handleAddressSelect(item.address)}
          style={[styles.addressTextContainer, isSelected && styles.selected]}>
          <Text style={styles.addressText}>{item.address}</Text>
        </TouchableOpacity>
        <View style={styles.addressStatusContainer}>
          <View style={styles.containerWork}>
            <Ionicons
              name={orderStatusIcon}
              size={20}
              color={orderStatusColor}
            />
            <Text style={styles.addressStatus}>{item.status}</Text>
          </View>
          <View style={styles.containerDates}>
            <Ionicons name="time-outline" size={18} color="black" />
            <Text style={styles.addressTime}>{formattedDateStart}</Text>
            <Text>-</Text>
            <Text style={styles.addressTime}>{formattedDateEnd}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() =>
            navigation.navigate('QRCodeScanner', {
              id: item.id,
              orderNumber: item.orderNumber,
            })
          }>
          <Ionicons name="qr-code-outline" size={20} color="black" />
          <Text style={styles.scanButtonText}>Сканировать QR код заказа</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Добавьте сюда стили для OrderItem
  container2: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    gap: 5,
    padding: 5,
  },
  iconMap: {
    marginTop: 10,
  },
  addressTextContainer: {
    padding: 5,
    borderRadius: 5,
  },
  selected: {
    backgroundColor: '#d0f0c0', // Цвет выделения
  },
  containerDates: {
    display: 'flex',
    flexDirection: 'row',
    gap: 5,
    padding: 5,
  },
  containerWork: {
    display: 'flex',
    flexDirection: 'row',
    paddingTop: 5,
  },
  // и остальные стили...
  addressContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    width: '90%',
  },
  addressNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginVertical: 5,
  },
  addressStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  addressStatus: {
    fontSize: 14,
    marginLeft: 5,
    color: 'gray',
  },
  addressTime: {
    marginLeft: 'auto',
    fontSize: 14,
    color: 'gray',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 10,
  },
  scanButtonText: {
    marginLeft: 10,
    fontSize: 14,
    color: 'black',
  },
});
