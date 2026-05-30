import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppStackParamList } from './types';
import { BottomTabNavigator } from './BottomTabNavigator';

const Stack = createNativeStackNavigator<AppStackParamList>();

/**
 * AppNavigator
 * Root navigator for authenticated users.
 * Renders BottomTabNavigator as the default screen.
 * Additional full-screen routes (details, modals, etc.) can be added here.
 */
export const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Home" component={BottomTabNavigator} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
