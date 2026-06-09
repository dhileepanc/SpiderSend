/**
 * SpiderSend Root Application Shell
 * Configures the Redux store provider, safe area contexts,
 * and boots standard navigation stack structures.
 */

import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './src/redux';
import RootNavigator from './src/navigation/RootNavigator';
import { StatusModalProvider } from './src/contexts/StatusModalContext';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusModalProvider>
          <StatusBar
            barStyle={isDarkMode ? 'light-content' : 'dark-content'}
            backgroundColor="transparent"
            translucent
          />
          <RootNavigator />
        </StatusModalProvider>
      </SafeAreaProvider>
    </Provider>
  );
}

export default App;
