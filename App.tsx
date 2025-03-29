// App.tsx
import 'react-native-gesture-handler';
import {
  StyleSheet,
  Alert,
  AppState,
  AppStateStatus,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import React, {useEffect, useRef, useContext} from 'react';

import {UserContext} from './UserContext';
import AppNavigator from './AppNavigator';
import {initDB} from './src/database';
import {syncDataFromServer, syncPendingRequests} from './src/sync';
import {NetworkProvider, NetworkContext} from './src/components/NetworkContext';
import {SyncProvider, SyncContext} from './SyncContext';
import {UserProvider} from './UserContext';

function AppContent() {
  const {isConnected} = useContext(NetworkContext);
  const {userId, isAuthenticated, loading} = useContext(UserContext);
  const wasOfflineRef = useRef(false);
  const hasSyncedOnceRef = useRef(false);
  const {isSyncing, setIsSyncing} = useContext(SyncContext); // Получаем setIsSyncing

  // Инициализация БД
  useEffect(() => {
    const init = async () => {
      await initDB();
    };
    init();
  }, []);

  // Предупреждение при сворачивании приложения во время синхронизации
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' && isSyncing) {
        Alert.alert(
          'Синхронизация',
          'Идёт синхронизация кодов честного знака. Пожалуйста, не сворачивайте или не закрывайте приложение, пока все коды не будут отправлены.',
        );
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, [isSyncing]);

  // Синхронизация при первом запуске и при восстановлении интернета
  useEffect(() => {
    console.log(
      'AppContent: userId=',
      userId,
      'isAuthenticated=',
      isAuthenticated,
      'isConnected=',
      isConnected,
      'loading=',
      loading,
    );

    // Ждём, пока загрузка завершится, и проверяем, что пользователь авторизован
    if (loading || !isAuthenticated || !userId) {
      console.log(
        'AppContent: Синхронизация не выполняется: ожидание авторизации или загрузки',
      );
      return;
    }

    if (!isConnected) {
      if (!wasOfflineRef.current) {
        Alert.alert('Нет интернета', 'Приложение работает в оффлайн-режиме');
        wasOfflineRef.current = true;
      }
      console.log('AppContent: Нет интернета, синхронизация отложена');
    } else {
      if (wasOfflineRef.current || !hasSyncedOnceRef.current) {
        wasOfflineRef.current = false;
        hasSyncedOnceRef.current = true;

        console.log('AppContent: Запуск синхронизации...');
        Alert.alert(
          'Интернет доступен',
          'Выполняется синхронизация... Не закрывайте приложение до ее окончания',
        );

        // Выполняем синхронизацию с обработкой ошибок
        const performSync = async () => {
          try {
            console.log('AppContent: Выполняется syncPendingRequests...');
            await syncPendingRequests(setIsSyncing); // Передаём setIsSyncing
            console.log('AppContent: syncPendingRequests завершён');
          } catch (error) {
            console.error('AppContent: Ошибка в syncPendingRequests:', error);
            Alert.alert(
              'Ошибка',
              'Не удалось синхронизировать отложенные запросы',
            );
          }

          try {
            console.log('AppContent: Выполняется syncDataFromServer...');
            await syncDataFromServer();
            console.log('AppContent: syncDataFromServer завершён');
          } catch (error) {
            console.error('AppContent: Ошибка в syncDataFromServer:', error);
            Alert.alert(
              'Ошибка',
              'Не удалось синхронизировать данные с сервера',
            );
          }

          Alert.alert('Успех', 'Синхронизация завершена');
        };

        performSync();
      } else {
        console.log('AppContent: Синхронизация уже выполнена ранее');
      }
    }
  }, [isConnected, userId, isAuthenticated, loading, setIsSyncing]);

  // Экран загрузки
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Загрузка...</Text>
      </View>
    );
  }

  return <AppNavigator />;
}

export default function App() {
  return (
    <NetworkProvider>
      <SyncProvider>
        <UserProvider>
          <AppContent />
        </UserProvider>
      </SyncProvider>
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
