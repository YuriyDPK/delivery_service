import React from 'react';
import {Pressable, Text, StyleSheet} from 'react-native';
import ScanIcon from '../../../assets/images/scan.svg';

export const QRButton = ({onPress, text = 'QR'}) => {
  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [
        styles.qrButton,
        {backgroundColor: pressed ? '#333' : 'black'}, // затемняем цвет при нажатии
      ]}>
      <ScanIcon name="qr-code-outline" size={20} color="white" />
      <Text style={styles.buttonText}>{text}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    textAlign: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 5,
  },
  buttonText: {
    fontSize: 14,
    color: 'white',
  },
});
