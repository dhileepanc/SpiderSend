import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import LoginScreen from '../screens/LoginScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * AuthNavigator
 * Coordinates paths for authentication actions (Sign In, Registration, Recovery).
 */
export const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      {/* Dynamic extension: Add Register screen, Recovery, etc. */}
    </Stack.Navigator>
  );
};

export default AuthNavigator;
