// src/NetworkContext.tsx
import React, {createContext, useEffect, useState} from 'react';
import NetInfo from '@react-native-community/netinfo';

interface NetworkContextType {
  isConnected: boolean;
}

export const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
});

export const NetworkProvider = ({children}: {children: React.ReactNode}) => {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  return (
    <NetworkContext.Provider value={{isConnected}}>
      {children}
    </NetworkContext.Provider>
  );
};
