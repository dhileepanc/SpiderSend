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
import PreviewExtractedScreen from '../screens/PreviewExtractedScreen';
import PreviewSendScreen from '../screens/PreviewSendScreen';
import AddContactGroupScreen from '../screens/AddContactGroupScreen';
import EditContactGroupScreen from '../screens/EditContactGroupScreen';
import ContactListScreen from '../screens/ContactListScreen';
import AddMailTemplateScreen from '../screens/AddMailTemplateScreen';
import EditMailTemplateScreen from '../screens/EditMailTemplateScreen';

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
      <Stack.Screen name="PreviewExtracted" component={PreviewExtractedScreen} />
      <Stack.Screen name="PreviewSend" component={PreviewSendScreen} />
      <Stack.Screen name="AddContactGroup" component={AddContactGroupScreen} />
      <Stack.Screen name="EditContactGroup" component={EditContactGroupScreen} />
      <Stack.Screen name="ContactList" component={ContactListScreen} />
      <Stack.Screen name="AddMailTemplate" component={AddMailTemplateScreen} />
      <Stack.Screen name="EditMailTemplate" component={EditMailTemplateScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
