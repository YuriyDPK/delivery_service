import 'react-native-gesture-handler';
import {StyleSheet, Alert} from 'react-native';
import React, {useEffect, useRef, useState, useContext} from 'react';

import {UserProvider} from './UserContext';
import AppNavigator from './AppNavigator';
import {initDB} from './src/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {syncDataFromServer, syncPendingRequests} from './src/sync';
import {NetworkProvider, NetworkContext} from './src/components/NetworkContext';

function AppContent() {
  const {isConnected} = useContext(NetworkContext);
  const [userId, setUserId] = useState<string | null>(null);
  const wasOfflineRef = useRef(false);
  const hasSyncedOnceRef = useRef(false); // 👈 чтобы не дублировать первую синхронизацию

  // Инициализация БД и userId
  useEffect(() => {
    const init = async () => {
      await initDB();
      const storedUserId = await AsyncStorage.getItem('userId');
      if (storedUserId) {
        setUserId(storedUserId);
      }
    };
    init();
  }, []);

  // Синхронизация при первом запуске и при восстановлении интернета
  useEffect(() => {
    if (!userId) return;

    if (!isConnected) {
      if (!wasOfflineRef.current) {
        Alert.alert('Нет интернета', 'Приложение работает в оффлайн-режиме');
        wasOfflineRef.current = true;
      }
    } else {
      // Если до этого был оффлайн или это первый запуск
      if (wasOfflineRef.current || !hasSyncedOnceRef.current) {
        wasOfflineRef.current = false;
        hasSyncedOnceRef.current = true;

        Alert.alert('Интернет доступен', 'Выполнена синхронизация');
        syncDataFromServer();
        syncPendingRequests();
      }
    }
  }, [isConnected, userId]);

  return (
    <UserProvider>
      <AppNavigator />
    </UserProvider>
  );
}

export default function App() {
  return (
    <NetworkProvider>
      <AppContent />
    </NetworkProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
