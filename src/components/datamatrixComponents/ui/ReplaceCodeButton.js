// datamatrixComponents/ui/ReplaceCodeButton.js
import React from 'react';
import {Pressable, Text, StyleSheet} from 'react-native';

const ReplaceCodeButton = ({
  setReplaceLast,
  setSuccess,
  setScanned,
  setScannerKey,
}) => {
  const handleReplaceCode = () => {
    setReplaceLast(true);
    setSuccess(false);
    setScanned(false);
    setScannerKey(Date.now());
  };

  return (
    <Pressable
      style={[styles.button, {backgroundColor: '#28a745'}]}
      onPress={handleReplaceCode}>
      <Text style={styles.buttonText}>Заменить код</Text>
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

export default ReplaceCodeButton;
