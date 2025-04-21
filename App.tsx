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
import React, {useEffect, useRef, useContext, useState} from 'react';

import {UserContext} from './UserContext';
import AppNavigator from './AppNavigator';
import {initDB} from './src/database';
import {syncDataFromServer, syncPendingRequests} from './src/sync';
import {NetworkProvider, NetworkContext} from './src/components/NetworkContext';
import {SyncProvider, SyncContext} from './SyncContext';
import {UserProvider} from './UserContext';
import SyncIndicator from './SyncIndicator';
import AlertProvider from './src/components/datamatrixComponents/AlertProvider';
import {customAlert} from './src/components/datamatrixComponents/customAlertManager';

function AppContent() {
  const {isConnected} = useContext(NetworkContext);
  const {userId, isAuthenticated, loading} = useContext(UserContext);
  const wasOfflineRef = useRef(false);
  const hasSyncedOnceRef = useRef(false);
  const {isSyncing, setIsSyncing} = useContext(SyncContext);
  const [isSyncingIndicator, setIsSyncingIndicator] = useState(false);

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
        customAlert(
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
        customAlert('Нет интернета', 'Приложение работает в оффлайн-режиме');
        wasOfflineRef.current = true;
      }
      console.log('AppContent: Нет интернета, синхронизация отложена');
    } else {
      if (wasOfflineRef.current || !hasSyncedOnceRef.current) {
        wasOfflineRef.current = false;
        hasSyncedOnceRef.current = true;

        console.log('AppContent: Запуск синхронизации...');

        // Устанавливаем флаг синхронизации перед показом Alert
        setIsSyncing(true);
        setIsSyncingIndicator(true);

        // Показываем уведомление о начале синхронизации
        customAlert(
          'Интернет доступен',
          'Выполняется синхронизация... Не закрывайте приложение до ее окончания',
        );

        // Выполняем синхронизацию с обработкой ошибок
        const performSync = async () => {
          let syncSuccess = true;

          try {
            console.log('AppContent: Выполняется syncPendingRequests...');
            await syncPendingRequests(setIsSyncing); // возможно, он сам обновляет isSyncing — убери, если не нужно
            console.log('AppContent: syncPendingRequests завершён');
          } catch (error) {
            console.error('AppContent: Ошибка в syncPendingRequests:', error);
            customAlert(
              'Ошибка',
              'Не удалось синхронизировать отложенные запросы',
            );
            syncSuccess = false;
          }

          try {
            console.log('AppContent: Выполняется syncDataFromServer...');
            await syncDataFromServer();
            console.log('AppContent: syncDataFromServer завершён');
          } catch (error) {
            console.error('AppContent: Ошибка в syncDataFromServer:', error);
            customAlert(
              'Ошибка',
              'Не удалось синхронизировать данные с сервера',
            );
            syncSuccess = false;
          }

          if (syncSuccess) {
            setIsSyncing(false);
            setIsSyncingIndicator(false);
            customAlert('Успех', 'Синхронизация завершена');
          } else {
            customAlert(
              'Синхронизация не завершена',
              'Повторим попытку при следующем подключении к интернету.',
            );
          }
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

  return (
    <View style={styles.container}>
      <AppNavigator />
      {isSyncingIndicator && <SyncIndicator />}
    </View>
  );
}

export default function App() {
  return (
    <NetworkProvider>
      <SyncProvider>
        <UserProvider>
          <AlertProvider>
            <AppContent />
          </AlertProvider>
        </UserProvider>
      </SyncProvider>
    </NetworkProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
