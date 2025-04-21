// customAlertManager.js
import React from 'react';
import {DeviceEventEmitter} from 'react-native';

// Константы для событий
export const ALERT_EVENTS = {
  SHOW: 'SHOW_CUSTOM_ALERT',
  HIDE: 'HIDE_CUSTOM_ALERT',
};

// Функция для показа пользовательского алерта
export const showAlert = (title, message, buttons) => {
  DeviceEventEmitter.emit(ALERT_EVENTS.SHOW, {
    title,
    message,
    buttons,
  });
};

// Функция для скрытия пользовательского алерта
export const hideAlert = () => {
  DeviceEventEmitter.emit(ALERT_EVENTS.HIDE);
};

// Версия Alert.alert, но использующая наш CustomAlert
export const customAlert = (title, message, buttons) => {
  // Преобразуем кнопки стандартного Alert в формат для CustomAlert
  const customButtons = buttons
    ? buttons.map(button => ({
        text: button.text,
        onPress: () => {
          hideAlert();
          if (button.onPress) {
            button.onPress();
          }
        },
        style: button.style,
        isDestructive: button.style === 'destructive',
      }))
    : [
        {
          text: 'OK',
          onPress: () => {
            hideAlert();
          },
        },
      ];

  showAlert(title, message, customButtons);
};
