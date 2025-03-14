import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';

// Определяем типы для стека навигации
export type RootStackParamList = {
  Login: undefined;
  MainTabs: {screen: string};
  Registration: undefined;
  OrderDetails: {orderId: string; qrCode: string}; // Типы для OrderDetails
  DataMatrixCodeScanner: {orderId: string; productId: string; qr: string}; // Типы для DataMatrixCodeScanner
};
export type OrderDetailsRouteProp = RouteProp<
  RootStackParamList,
  'OrderDetails'
>;

// Тип для navigation
export type OrderDetailsNavigationProp = StackNavigationProp<
  RootStackParamList,
  'OrderDetails'
>;

// Обновлённый интерфейс для пропсов компонента
export interface OrderDetailsScreenProps {
  route: OrderDetailsRouteProp;
  navigation: OrderDetailsNavigationProp;
}
// Тип для navigation в LoginScreen
export type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Login'
>;

// Пропсы для LoginScreen
export interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}
