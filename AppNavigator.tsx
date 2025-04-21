// AppNavigator.tsx
import React, {useContext} from 'react';
import {View, ActivityIndicator, Alert} from 'react-native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

import {NavigationContainer} from '@react-navigation/native';

import ProfileScreen from './src/components/ProfileScreen';
import RoutesScreen from './src/components/RoutesScreen';
import ArchiveScreen from './src/components/ArchiveScreen';
import RouteDetailsScreen from './src/components/RouteDetailsScreen';
import OrderDetailsScreen from './src/components/OrderDetailsScreen';
import QRCodeScannerScreen from './src/components/QRCodeScannerScreen';
import DataMatrixCodeScannerScreen from './src/components/DataMatrixCodeScannerScreen';
import LoginScreen from './src/components/LoginScreen';
import MapScreen from './src/components/MapScreen';

import {UserContext} from './UserContext';

import ClipboadIcon from './assets/images/clipboard.svg';
import CalendarIcon from './assets/images/calendar.svg';
import ProfileIcon from './assets/images/profile_circled.svg';
import {NetworkContext} from './src/components/NetworkContext';
import {customAlert} from './src/components/datamatrixComponents/customAlertManager';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const {isConnected} = useContext(NetworkContext);

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({color, size}) => {
          // Выбираем иконку в зависимости от имени маршрута
          if (route.name === 'Routes') {
            return <ClipboadIcon width={size} height={size} fill={color} />;
          } else if (route.name === 'Archive') {
            return <CalendarIcon width={size} height={size} fill={color} />;
          } else if (route.name === 'Profile') {
            return <ProfileIcon width={size} height={size} fill={color} />;
          }
          // Возвращаем запасную иконку, если маршрут не распознан (опционально)
          return <ClipboadIcon width={size} height={size} fill={color} />;
        },
        tabBarActiveTintColor: 'black',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          display: 'flex',
        },
      })}>
      <Tab.Screen
        name="Routes"
        component={RoutesScreen}
        options={{headerShown: false, title: 'Маршруты'}}
      />
      <Tab.Screen
        name="Archive"
        component={isConnected ? ArchiveScreen : RoutesScreen}
        listeners={({navigation}) => ({
          tabPress: e => {
            if (!isConnected) {
              e.preventDefault(); // блокируем переход
              customAlert(
                'Нет интернета',
                'Раздел "Архив" недоступен в оффлайн-режиме',
              );
            }
          },
        })}
        options={{headerShown: false, title: 'Архив'}}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{headerShown: false, title: 'Профиль'}}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const {isAuthenticated, loading} = useContext(UserContext);

  if (loading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isAuthenticated ? 'MainTabs' : 'Login'}>
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="RouteDetails"
          component={RouteDetailsScreen}
          options={{headerTitle: 'Детали маршрута'}}
        />
        <Stack.Screen
          name="OrderDetails"
          component={OrderDetailsScreen}
          options={{headerTitle: 'Детали заказа'}}
        />
        <Stack.Screen
          name="QRCodeScanner"
          component={QRCodeScannerScreen}
          options={{headerTitle: 'Сканировать заказ'}}
        />
        <Stack.Screen
          name="DataMatrixCodeScanner"
          component={DataMatrixCodeScannerScreen}
          options={{headerTitle: 'Сканировать продукт'}}
        />
        <Stack.Screen
          name="MapScreen"
          component={MapScreen}
          options={{headerTitle: 'Маршрут на карте'}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
