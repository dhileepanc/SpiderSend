import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CustomTabBar } from './CustomTabBar';
import HomeScreen from '../screens/HomeScreen';
import DirectSendScreen from '../screens/DirectSendScreen';
import Click2ConnectScreen from '../screens/Click2ConnectScreen';
import MailTemplateScreen from '../screens/MailTemplateScreen';
import ContactGroupScreen from '../screens/ContactGroupScreen';

export type BottomTabParamList = {
  Home: undefined;
  DirectSend: undefined;
  Click2Connect: undefined;
  MailTemplate: undefined;
  ContactGroup: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

/**
 * BottomTabNavigator
 * Five-tab layout with a custom curved tab bar and floating centre button.
 * Tab order: Home | DirectSend | Click2Connect (centre) | MailTemplate | ContactGroup
 */
export const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      safeAreaInsets={{ bottom: 0 }}  // CustomTabBar handles insets manually
      sceneContainerStyle={{ backgroundColor: '#FFFFFF' }} // Ensures the area behind the cut-out is pure white
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home"          component={HomeScreen} />
      <Tab.Screen 
        name="DirectSend"    
        component={DirectSendScreen} 
        options={{
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tab.Screen 
        name="Click2Connect" 
        component={Click2ConnectScreen} 
        options={{
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tab.Screen name="MailTemplate"  component={MailTemplateScreen} />
      <Tab.Screen name="ContactGroup"  component={ContactGroupScreen} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
