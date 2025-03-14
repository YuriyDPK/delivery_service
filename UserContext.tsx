// UserContext.tsx
import React, {createContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_BASE_URL} from './config';

// Определяем тип для значений контекста
interface UserContextValue {
  userId: number | null;
  isAuthenticated: boolean | null;
  loading: boolean;
}

// Создаем контекст с начальным значением
export const UserContext = createContext<UserContextValue>({
  userId: null,
  isAuthenticated: null,
  loading: true,
});

export const UserProvider = ({children}: {children: React.ReactNode}) => {
  const [userId, setUserId] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
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
            setUserId(userData.id);
          } else {
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Ошибка при проверке токена:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, []);

  return (
    <UserContext.Provider value={{userId, isAuthenticated, loading}}>
      {children}
    </UserContext.Provider>
  );
};
