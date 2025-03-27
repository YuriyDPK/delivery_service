// MapScreen.tsx
import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  NativeModules,
  requireNativeComponent,
  Button,
} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import ScanIcon from '../../assets/images/scan.svg';

type MapScreenProps = {
  route: RouteProp<{params: {mapUrl: string}}, 'params'>;
  navigation: any;
};

const YandexMapView = requireNativeComponent('YandexMapView');

const MapScreen: React.FC<MapScreenProps> = ({route, navigation}) => {
  const {mapUrl} = route.params;
  const [result, setResult] = useState([]);

  const {MapModule} = NativeModules;

  const handleQRCodeScan = () => {
    navigation.navigate('QRCodeScanner');
  };

  return (
    <View style={styles.container}>
      <View style={styles.qrButtonContainer}>
        <TouchableOpacity style={styles.qrButton} onPress={handleQRCodeScan}>
          <ScanIcon name="qr-code-outline" size={20} color="white" />
          <Text style={styles.qrButtonText}>QR</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mapContainer}>
        <YandexMapView style={styles.map} />
      </View>
    </View>
  );
};

export default MapScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  mapContainer: {
    height: '100%', // Карта занимает половину экрана
  },
  qrButtonContainer: {
    marginVertical: 10,
    alignItems: 'center',
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
  resultContainer: {
    padding: 20,
  },
  resultText: {
    fontSize: 16,
    marginVertical: 2,
  },
});
