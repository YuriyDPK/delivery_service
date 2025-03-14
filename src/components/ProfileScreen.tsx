import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {API_BASE_URL, API_KEY} from '../../config';
import {useFocusEffect} from '@react-navigation/native';
import {BackHandler} from 'react-native';
import {LoginScreenProps} from '../interfaces/interfaces';
import {StackNavigationProp} from '@react-navigation/stack';

import PencilIcon from '../../assets/images/pencil.svg';

// Типы для навигации
type RootStackParamList = {
  Login: undefined;
  MainTabs: {screen: string};
  Registration: undefined;
  RouteDetails: {
    route: {
      id: string;
      number_route: string;
      date: string;
      quantity_orders: number;
      status: string;
    };
  };
  Profile: undefined; // Добавляем Profile в стек
};

type ProfileScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Profile'
>;

interface ProfileScreenProps {
  navigation: ProfileScreenNavigationProp;
}

// Интерфейс для данных пользователя
interface UserInfo {
  firstName: string;
  lastName: string;
  middleName?: string; // Отчество необязательное
}
export default function ProfileScreen({navigation}: LoginScreenProps) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [updatedUserInfo, setUpdatedUserInfo] = useState<UserInfo>({
    firstName: '',
    lastName: '',
    middleName: '',
  });
  const [isSaved, setIsSaved] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => true; // Блокируем кнопку "назад"
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      return () => subscription.remove(); // Используем remove для отписки
    }, []),
  );

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        // Получаем userId из AsyncStorage
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) {
          Alert.alert('Ошибка', 'Не удалось получить ID пользователя');
          setIsLoading(false);
          return;
        }

        // Выполняем запрос для получения информации о пользователе
        const response = await axios.get(
          `${API_BASE_URL}/rest/user/getUserInfo/`,
          {
            params: {
              USER_ID: userId,
              API_KEY:
                '0TQVewPoqFubLhUinC1Mkm6boQC5RJ8M5wvknLe-LXhuBbqLt5PYngZSiERK81E3',
            },
          },
        );

        if (response.data.RESULT) {
          setUserInfo(response.data.RESULT);
          setUpdatedUserInfo(response.data.RESULT);
        } else {
          Alert.alert('Ошибка', 'Не удалось получить данные пользователя');
        }
      } catch (error) {
        Alert.alert('Ошибка', 'Ошибка при подключении к серверу');
        console.error('Ошибка при получении информации о пользователе:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось выйти из аккаунта');
      console.error('Ошибка при выходе из аккаунта:', error);
    }
  };

  const handleUpdateUserInfo = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Ошибка', 'Не удалось получить ID пользователя');
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/rest/user/setUserInfo/`,
        {
          params: {
            USER_ID: userId,
            FIRST_NAME: updatedUserInfo.firstName,
            LAST_NAME: updatedUserInfo.lastName,
            MIDDLE_NAME: updatedUserInfo.middleName,

            API_KEY:
              '0TQVewPoqFubLhUinC1Mkm6boQC5RJ8M5wvknLe-LXhuBbqLt5PYngZSiERK81E3',
          },
        },
      );

      // Если статус ответа 200, обновляем данные
      if (response.status === 200) {
        setUserInfo(updatedUserInfo);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
        setIsEditing(false);
        Alert.alert('Успех', 'Данные успешно обновлены');
      } else {
        Alert.alert('Ошибка', 'Сервер вернул некорректный статус');
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Ошибка при обновлении данных пользователя');
      console.error('Ошибка при обновлении информации о пользователе:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!userInfo) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Не удалось загрузить данные пользователя.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
      <ScrollView contentContainerStyle={{flexGrow: 1}}>
        <View style={styles.container}>
          <Text style={styles.title}>Профиль</Text>
          {isEditing ? (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Ваше имя *</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={updatedUserInfo.firstName}
                    onChangeText={text =>
                      setUpdatedUserInfo({
                        ...updatedUserInfo,
                        firstName: text,
                      })
                    }
                  />
                  <PencilIcon
                    name="pencil"
                    size={20}
                    color="gray"
                    style={styles.icon}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Фамилия *</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={updatedUserInfo.lastName}
                    onChangeText={text =>
                      setUpdatedUserInfo({...updatedUserInfo, lastName: text})
                    }
                  />
                  <PencilIcon
                    name="pencil"
                    size={20}
                    color="gray"
                    style={styles.icon}
                  />
                </View>
              </View>

              {/* <View style={styles.inputContainer}>
            <Text style={styles.label}>Отчество</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={updatedUserInfo.middleName}
                onChangeText={(text) =>
                  setUpdatedUserInfo({ ...updatedUserInfo, middleName: text })
                }
              />
              <Ionicons
                name="pencil"
                size={20}
                color="gray"
                style={styles.icon}
              />
            </View>
          </View> */}

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleUpdateUserInfo}>
                <Text style={styles.saveButtonText}>Сохранить</Text>
              </TouchableOpacity>
              {isSaved && (
                <View style={styles.successMessageContainer}>
                  <Text style={styles.successMessage}>
                    Данные успешно сохранены
                  </Text>
                </View>
              )}
            </>
          ) : (
            <>
              <Text style={styles.label}>Ваше имя</Text>
              <Text style={styles.value}>{userInfo.firstName}</Text>

              <Text style={styles.label}>Фамилия</Text>
              <Text style={styles.value}>{userInfo.lastName}</Text>

              {/* <Text style={styles.label}>Отчество</Text>
          <Text style={styles.value}>{userInfo.middleName}</Text> */}

              {/* <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(true)}
          >
            <Text style={styles.editButtonText}>Редактировать</Text>
          </TouchableOpacity> */}
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Выйти</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
  },
  icon: {
    marginLeft: 10,
  },
  value: {
    fontSize: 16,
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: '#26232f',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#26232f',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  successMessageContainer: {
    backgroundColor: '#e6ffed',
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
    alignItems: 'center',
  },
  successMessage: {
    color: '#27ae60',
    fontSize: 16,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#ff4d4d',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
