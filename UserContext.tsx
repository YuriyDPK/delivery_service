// UserContext.tsx
import React, {createContext, useState, useEffect, ReactNode} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_BASE_URL} from './config';

// Определяем тип для значений контекста
interface UserContextValue {
  userId: string | null; // Изменим тип на string, так как userId в AsyncStorage хранится как строка
  isAuthenticated: boolean | null;
  loading: boolean;
  setUserId: (userId: string | null) => void; // Добавляем функцию для обновления userId
  setIsAuthenticated: (isAuthenticated: boolean | null) => void; // Добавляем функцию для обновления isAuthenticated
}

// Создаем контекст с начальным значением
export const UserContext = createContext<UserContextValue>({
  userId: null,
  isAuthenticated: null,
  loading: true,
  setUserId: () => {},
  setIsAuthenticated: () => {},
});

export const UserProvider = ({children}: {children: ReactNode}) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const storedUserId = await AsyncStorage.getItem('userId'); // Добавляем проверку userId

        if (token && storedUserId) {
          const response = await fetch(`${API_BASE_URL}/user/profile`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            setIsAuthenticated(true);
            setUserId(userData.id.toString()); // Убедимся, что userId — строка
          } else {
            setIsAuthenticated(false);
            setUserId(null);
            await AsyncStorage.removeItem('userId'); // Очищаем userId, если токен недействителен
            await AsyncStorage.removeItem('token'); // Очищаем токен
          }
        } else {
          setIsAuthenticated(false);
          setUserId(null);
        }
      } catch (error) {
        console.error('Ошибка при проверке токена:', error);
        setIsAuthenticated(false);
        setUserId(null);
        await AsyncStorage.removeItem('userId'); // Очищаем userId при ошибке
        await AsyncStorage.removeItem('token'); // Очищаем токен
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, []);

  return (
    <UserContext.Provider
      value={{
        userId,
        isAuthenticated,
        loading,
        setUserId,
        setIsAuthenticated,
      }}>
      {children}
    </UserContext.Provider>
  );
};
