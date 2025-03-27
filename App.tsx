// App.tsx
import 'react-native-gesture-handler';
import {StyleSheet, View, ActivityIndicator, Alert} from 'react-native';
import React, {useEffect} from 'react';

import {UserProvider} from './UserContext';
import AppNavigator from './AppNavigator';
import {initDB} from './src/database';
import NetInfo from '@react-native-community/netinfo';

export default function App() {
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (!state.isConnected) {
        Alert.alert('Нет интернета', 'Приложение работает в оффлайн-режиме');
      }
    });
    initDB();
    return () => unsubscribe();
  }, []);
  return (
    <UserProvider>
      <AppNavigator />
    </UserProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
