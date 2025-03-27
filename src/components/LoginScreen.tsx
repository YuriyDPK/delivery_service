// LoginScreen.tsx
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Pressable,
  Alert,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {API_BASE_URL, API_KEY} from '../../config';
import {StackNavigationProp} from '@react-navigation/stack';
import {LoginScreenProps} from '../interfaces/interfaces';

// Получаем размеры экрана
const {width, height} = Dimensions.get('window');

// Коэффициенты для адаптации
const baseWidth = 375;
const scale = width / baseWidth;

function scaledSize(size: number) {
  return Math.round(size * scale);
}

export default function LoginScreen({navigation}: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [colorLinkRegister, setColorLinkRegister] = useState('#007BFF');
  const [colorButtonEnter, setColorButtonEnter] = useState('#26232f');
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [userId, setUserId] = useState<string | null>(null); // Типизируем userId
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      if (storedUserId) {
        setUserId(storedUserId); // storedUserId - строка, совместима с типом
        navigation.navigate('MainTabs', {screen: 'Route'});
      } else {
        setIsLoading(false);
      }
    };

    checkUser();
  }, [navigation]);

  const handleLogin = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/rest/user/getCode/`, {
        params: {
          LOGIN: email,
          PASS: password,
          API_KEY,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data.RESULT && response.data.RESULT.id) {
        let fetchedUserId = response.data.RESULT.id;
        await AsyncStorage.setItem('userId', fetchedUserId);

        Alert.alert('Успех', 'Авторизация успешна!');
        navigation.navigate('MainTabs', {screen: 'Route'});
      } else {
        Alert.alert('Ошибка', 'Неверный логин или пароль');
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Данные не найдены');
      console.error('Error during API request:', error);
    }
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
      <ScrollView contentContainerStyle={{flexGrow: 1}}>
        <View style={styles.container}>
          <View style={styles.logoContainer}>
            <Image
              style={styles.logo}
              source={require('../../assets/images/main.png')}
            />
            <Text style={styles.title}>СЛУЖБА {'\n'}ДОСТАВКИ</Text>
          </View>
          <Text style={styles.welcome}>Добро пожаловать!</Text>
          <Text style={styles.instructions}>
            Для входа в приложение, пожалуйста, авторизуйтесь
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Имя пользователя"
              value={email}
              onChangeText={setEmail}
            />
            <Image
              style={styles.icon}
              source={require('../../assets/images/Profile.png')}
            />
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Введите пароль"
              secureTextEntry={!isPasswordVisible}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              onPress={() => setPasswordVisible(!isPasswordVisible)}>
              <Image
                style={styles.icon2}
                source={
                  isPasswordVisible
                    ? require('../../assets/images/Eye_close.png')
                    : require('../../assets/images/Eye.png')
                }
              />
            </TouchableOpacity>
          </View>
          <Pressable
            style={[styles.button, {backgroundColor: colorButtonEnter}]}
            onPress={handleLogin}
            onPressIn={() => {
              setColorButtonEnter('black');
            }}
            onPressOut={() => {
              setColorButtonEnter('#26232f');
            }}>
            <Text style={styles.buttonText}>Войти</Text>
          </Pressable>
          <View style={styles.linkReg}>
            <Pressable
              onPressIn={() => {
                setColorLinkRegister('black');
              }}
              onPressOut={() => {
                setColorLinkRegister('#007BFF');
                navigation.navigate('Registration');
              }}>
              {/* Если нужна текстовая ссылка, добавьте <Text> сюда */}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: scaledSize(30),
    paddingTop: height * 0.15,
    paddingBottom: height * 0.15,
    backgroundColor: '#fff',
  },
  logoContainer: {
    flexDirection: 'row',
    gap: scaledSize(20),
    alignItems: 'center',
    marginBottom: scaledSize(20),
  },
  logo: {
    width: scaledSize(70),
    height: scaledSize(90),
    resizeMode: 'contain',
  },
  title: {
    fontSize: scaledSize(36),
    fontWeight: 'bold',
  },
  welcome: {
    fontSize: scaledSize(36),
    marginVertical: scaledSize(10),
    fontWeight: 'bold',
  },
  instructions: {
    fontSize: scaledSize(16),
    color: '#666',
    marginBottom: scaledSize(20),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: scaledSize(15),
    padding: scaledSize(10),
    marginBottom: scaledSize(15),
    paddingHorizontal: scaledSize(15),
  },
  icon: {
    width: scaledSize(20),
    height: scaledSize(20),
    resizeMode: 'contain',
  },
  icon2: {
    width: scaledSize(24),
    height: scaledSize(24),
    resizeMode: 'contain',
  },
  input: {
    flex: 1,
    height: scaledSize(40),
    fontSize: scaledSize(16),
  },
  button: {
    backgroundColor: '#141317',
    padding: scaledSize(25),
    borderRadius: scaledSize(15),
    width: '100%',
    marginBottom: scaledSize(20),
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: scaledSize(16),
  },
  linkReg: {
    textAlign: 'center',
    width: '100%',
  },
});
