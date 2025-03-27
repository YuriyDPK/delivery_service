// datamatrixComponents/ui/PermissionDeniedView.js
import React from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';
import {requestCameraPermission} from '../cameraPermissions';

const PermissionDeniedView = ({hasPermission, setHasPermission}) => {
  if (hasPermission) return null;

  return (
    <View style={styles.container}>
      <Text>Нет доступа к камере</Text>
      <Pressable
        style={[styles.button, {backgroundColor: '#28a745'}]}
        onPress={() => requestCameraPermission(setHasPermission)}>
        <Text style={styles.buttonText}>Запросить разрешение</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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

export default PermissionDeniedView;
