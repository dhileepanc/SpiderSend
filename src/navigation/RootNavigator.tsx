import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BootSplash from 'react-native-bootsplash';
import { useAppDispatch } from '../redux';
import { rehydrateAuth, User } from '../redux/slices/authSlice';
import { useAuth } from '../hooks';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import { USER_STORAGE_KEY } from '../hooks/useAuth';

/**
 * RootNavigator
 * Top-level coordinator that:
 *  1. On mount — reads AsyncStorage for a persisted user session and
 *     dispatches rehydrateAuth before rendering anything (prevents flicker).
 *  2. Swaps stacks based on isAuthenticated from Redux.
 *  3. Hides BootSplash once the navigation tree is mounted.
 */
export const RootNavigator = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const rehydrate = async () => {
      try {
        const raw = await AsyncStorage.getItem(USER_STORAGE_KEY);
        if (raw) {
          const user: User = JSON.parse(raw);
          dispatch(rehydrateAuth({ user }));
        } else {
          dispatch(rehydrateAuth(null));
        }
      } catch (e) {
        console.warn('[RootNavigator] Failed to rehydrate auth:', e);
        dispatch(rehydrateAuth(null));
      } finally {
        setIsReady(true);
      }
    };

    rehydrate();
  }, [dispatch]);

  // Keep splash visible until AsyncStorage check is complete
  if (!isReady) {
    return null;
  }

  const handleNavigationReady = () => {
    // Hide the native splash screen once the navigation tree has mounted
    BootSplash.hide({ fade: true }).catch((err) => {
      console.warn('BootSplash.hide error:', err);
    });
  };

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: '#FFFFFF', // CRITICAL: This fixes the grey color behind the tab bar cut-out!
    },
  };

  return (
    <NavigationContainer theme={navTheme} onReady={handleNavigationReady}>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default RootNavigator;
