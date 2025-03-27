// datamatrixComponents/ui/BackButton.js
import React from 'react';
import {Pressable, Text, StyleSheet} from 'react-native';

const BackButton = ({navigation}) => {
  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <Pressable
      style={[styles.button, {backgroundColor: '#28a745'}]}
      onPress={handleBack}>
      <Text style={styles.buttonText}>Назад</Text>
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

export default BackButton;
