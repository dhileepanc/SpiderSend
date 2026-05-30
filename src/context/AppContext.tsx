import React, {createContext, useContext} from 'react';

const AppContext = createContext<any>(null);

export const AppProvider = ({children}: any) => {
  const value = {
    themeMode: 'light',
    theme: {
      colors: {
        background: '#FFFFFF',
        primary: '#23A9BB',
      },
    },
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);