import * as Network from "expo-network";

// Функция проверки подключения к интернету
export const checkNetwork = async () => {
  const networkState = await Network.getNetworkStateAsync();
  return networkState.isConnected;
};
