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
import CameraScreen from '../screens/CameraScreen';
import Click2ConnectScreen from '../screens/Click2ConnectScreen';

import PreviewExtractedScreen from '../screens/PreviewExtractedScreen';
import PreviewSendScreen from '../screens/PreviewSendScreen';

export const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Home" component={BottomTabNavigator} />
      <Stack.Screen name="Camera" component={CameraScreen} />
      <Stack.Screen name="Click2Connect" component={Click2ConnectScreen} />
      <Stack.Screen name="PreviewExtracted" component={PreviewExtractedScreen} />
      <Stack.Screen name="PreviewSend" component={PreviewSendScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
