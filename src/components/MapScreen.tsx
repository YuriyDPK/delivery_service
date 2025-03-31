import React from 'react';
 import {View, StyleSheet, TouchableOpacity, Text} from 'react-native';
 import {WebView} from 'react-native-webview';
 import {RouteProp} from '@react-navigation/native';
 import ScanIcon from '../../assets/images/scan.svg';
 
 type MapScreenProps = {
   route: RouteProp<{params: {mapUrl: string}}, 'params'>;
   navigation: any; // Добавлено для работы с навигацией
 };
 
 const MapScreen: React.FC<MapScreenProps> = ({route, navigation}) => {
   const {mapUrl} = route.params;
 
   const handleQRCodeScan = () => {
     navigation.navigate('QRCodeScanner');
   };
 
   return (
     <View style={styles.container}>
       {/* Контейнер для кнопки */}
       <View style={styles.qrButtonContainer}>
         <TouchableOpacity style={styles.qrButton} onPress={handleQRCodeScan}>
           <ScanIcon name="qr-code-outline" size={20} color="white" />
           <Text style={styles.qrButtonText}>QR</Text>
         </TouchableOpacity>
       </View>
 
       {/* WebView для карты */}
       <WebView source={{uri: mapUrl}} style={{flex: 1}} />
     </View>
   );
 };
 
 export default MapScreen;
 
 const styles = StyleSheet.create({
   container: {
     flex: 1,
     backgroundColor: '#fff',
   },
   qrButtonContainer: {
     marginVertical: 10,
     alignItems: 'center', // Центрирование по горизонтали
   },
   qrButton: {
     backgroundColor: '#141317',
     paddingVertical: 10,
     width: '90%',
 
     borderRadius: 12,
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
   },
   qrButtonText: {
     color: 'white',
     fontSize: 16,
     fontWeight: 'bold',
     marginLeft: 8,
   },
 });