// datamatrixComponents/ui/AddMoreCodeButton.js
import React from 'react';
import {Pressable, Text, StyleSheet} from 'react-native';

const AddMoreCodeButton = ({
  setSuccess,
  setScanned,
  setReplaceLast,
  setScannerKey,
}) => {
  const handleAddMoreCode = () => {
    setSuccess(false);
    setScanned(false);
    setReplaceLast(false);
    setScannerKey(Date.now());
  };

  return (
    <Pressable
      style={[styles.button, {backgroundColor: '#28a745'}]}
      onPress={handleAddMoreCode}>
      <Text style={styles.buttonText}>Добавить еще код</Text>
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

export default AddMoreCodeButton;
