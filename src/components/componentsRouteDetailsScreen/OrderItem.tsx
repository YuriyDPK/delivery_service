import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import LocationIcon from '../../../assets/images/location.svg';
import CheckedIcon from '../../../assets/images/check.svg';
// Определяем интерфейс для пропсов
interface OrderItemProps {
  item: {
    number_act: string;
    address: string;
    status: string;
  };
  handleAddressSelect: (address: string) => void;
  isSelected: boolean;
}

const {width} = Dimensions.get('window');
const baseWidth = 375; // базовая ширина для вычислений
const scale = width / baseWidth;

function scaledSize(size: number) {
  return Math.round(size * scale);
}

export const OrderItem: React.FC<OrderItemProps> = ({
  item,
  handleAddressSelect,
  isSelected,
}) => {
  // Функция форматирования времени
  const formatUnixTime = (unixTime: number) => {
    if (!unixTime) return '--:--'; // Проверка на случай, если время отсутствует
    const date = new Date(unixTime * 1000); // Перевод в миллисекунды
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const orderStatusIcon = (() => {
    if (item.status?.trim() === 'Закрыт (в реестре)') return 'checkmark-circle';
    if (item.status?.trim() === 'Аннулирован') return 'close-circle';
    return 'timer-outline';
  })();

  const orderStatusColor = (() => {
    if (item.status?.trim() === 'Закрыт (в реестре)') return 'green';
    if (item.status?.trim() === 'Аннулирован') return 'red';
    return 'black';
  })();

  return (
    <View style={styles.container2}>
      {/* <Feather
        name="map-pin"
        size={scaledSize(22)}
        color="gray"
        style={styles.iconMap}
      /> */}
      <View style={styles.addressContainer}>
        <Text style={styles.addressNumber}>Акт № {item.number_act}</Text>
        <TouchableOpacity
          onPress={() => handleAddressSelect(item.address)}
          style={[styles.addressTextContainer, isSelected && styles.selected]}>
          <Text
            style={[
              styles.addressText,
              isSelected && styles.addressTextSelected,
            ]}>
            {item.address}
          </Text>
        </TouchableOpacity>
        <View style={styles.addressStatusContainer}>
          <View style={styles.containerWork}>
            {item.status === 'Отправлен' ? (
              <>
                <CheckedIcon
                  name={orderStatusIcon}
                  size={scaledSize(20)}
                  color={orderStatusColor}
                />
                <Text style={styles.addressStatusChecked}>{item.status}</Text>
              </>
            ) : (
              <>
                <LocationIcon
                  name={orderStatusIcon}
                  size={scaledSize(20)}
                  color={orderStatusColor}
                />
                <Text style={styles.addressStatusWhait}>{item.status}</Text>
              </>
            )}
          </View>
        </View>
        <View style={styles.buttonContainer}>
          {/* Кнопка "Маршрут" */}
          <TouchableOpacity
            style={[
              styles.routeButton,
              isSelected && styles.routeButtonSelected,
            ]}
            onPress={() => handleAddressSelect(item.address)}>
            <LocationIcon
              name="location-outline"
              size={scaledSize(20)}
              color="black"
            />
            <Text style={styles.buttonText}>
              {isSelected ? 'Удалить из маршрута' : 'Добавить в маршрут'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container2: {
    flexDirection: 'row',
    width: '100%',
    gap: scaledSize(5),
    padding: scaledSize(5),
  },
  iconMap: {
    marginTop: scaledSize(10),
  },
  addressContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: scaledSize(10),
    padding: scaledSize(15),
    width: '100%',
  },
  addressNumber: {
    fontSize: scaledSize(16),
    fontWeight: 'bold',
  },
  addressTextContainer: {
    padding: scaledSize(5),
    borderRadius: scaledSize(5),
  },
  addressText: {
    fontSize: scaledSize(14),
    color: '#666',
  },
  addressTextSelected: {
    color: 'black',
  },
  selected: {
    backgroundColor: '#C7C7C7',
  },
  addressStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scaledSize(10),
  },
  addressStatusWhait: {
    fontSize: scaledSize(14),
    marginLeft: scaledSize(5),
    color: 'gray',
  },
  addressStatusChecked: {
    fontSize: scaledSize(14),
    marginLeft: scaledSize(5),
    color: 'green',
  },
  containerWork: {
    flexDirection: 'row',
    paddingTop: scaledSize(5),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: scaledSize(10),
    gap: scaledSize(15),
  },
  routeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    padding: scaledSize(10),
    borderRadius: scaledSize(10),
    flex: 1,
    textAlign: 'center',
    justifyContent: 'center',
  },
  routeButtonSelected: {
    backgroundColor: '#C7C7C7',
  },
  buttonText: {
    marginLeft: scaledSize(5),
    fontSize: scaledSize(14),
    color: 'black',
    textAlign: 'center',
    justifyContent: 'center',
  },
});
