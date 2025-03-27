// datamatrixComponents/ui/ShareButton.js
import React from 'react';
import {Pressable, Text, StyleSheet} from 'react-native';
import {handleShare} from '../handleShare';

const ShareButton = ({dataMatrixUrl}) => {
  return (
    <Pressable
      style={[styles.button, {backgroundColor: '#28a745'}]}
      onPress={() => handleShare(dataMatrixUrl)}>
      <Text style={styles.buttonText}>Поделиться кодом</Text>
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

export default ShareButton;
