import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  TextInput,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

export const AddRouteModal = ({ isVisible, onClose, handleAddRoute }) => {
  const [number, setNumber] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Устанавливаем статус "В работе" по умолчанию
  const status = "В работе";

  const onAdd = () => {
    const newRouteData = {
      number,
      status,
      date: date.toISOString().split("T")[0], // Преобразуем дату в строку ISO и выбираем только день
    };
    handleAddRoute(newRouteData);
    clearForm();
  };

  const clearForm = () => {
    setNumber("");
    setDate(new Date());
  };

  // Открытие и закрытие DateTimePicker
  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const onDateChange = (event, selectedDate) => {
    if (selectedDate) {
      setDate(selectedDate);
    }
    setShowDatePicker(false); // Закрываем DateTimePicker
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Добавить новый маршрут</Text>
          <TextInput
            style={styles.input}
            placeholder="Номер маршрута"
            value={number}
            onChangeText={setNumber}
          />

          {/* Кнопка для выбора даты */}
          <TouchableOpacity onPress={showDatepicker} style={styles.dateButton}>
            <Text style={styles.dateButtonText}>
              {`Выбрать дату: ${date.toLocaleDateString()}`}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date" // Устанавливаем режим выбора только даты
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onDateChange}
            />
          )}

          <TouchableOpacity style={styles.modalButton} onPress={onAdd}>
            <Text style={styles.modalButtonText}>Добавить</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalButtonCancel} onPress={onClose}>
            <Text style={styles.modalButtonText}>Отменить</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  dateButton: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  dateButtonText: {
    fontSize: 16,
  },
  modalButton: {
    backgroundColor: "green",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: "red",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
