// App.tsx
import 'react-native-gesture-handler';
import {StyleSheet, View, ActivityIndicator} from 'react-native';
import React from 'react';

import {UserProvider} from './UserContext';
import AppNavigator from './AppNavigator';

export default function App() {
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
