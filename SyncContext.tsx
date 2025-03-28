import React, {createContext, useState} from 'react';

export const SyncContext = createContext({
  isSyncing: false,
  setIsSyncing: (syncing: boolean) => {},
});

export const SyncProvider = ({children}) => {
  const [isSyncing, setIsSyncing] = useState(false);

  return (
    <SyncContext.Provider value={{isSyncing, setIsSyncing}}>
      {children}
    </SyncContext.Provider>
  );
};
