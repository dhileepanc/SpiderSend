import React, { useEffect } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import { AppNavigationProp } from '../navigation/types';
import { useAuth } from '../hooks';
import { getClickToVerify } from '../services/click2ConnectService';

const CameraScreen = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const { user } = useAuth();

  useEffect(() => {
    openCamera();
  }, []);

  const openCamera = async () => {
    const result = await launchCamera({
      mediaType: 'photo',
      cameraType: 'back',
      quality: 0.4,
      maxWidth: 1024,
      maxHeight: 1024,
      saveToPhotos: false,
    });

    if (result.didCancel) {
      navigation.goBack();
      return;
    }

    if (result.assets?.length) {
      const photoUri = result.assets[0].uri;

      // Navigate to the Click2Connect tab. 
      // This will pop CameraScreen and switch to the Click2Connect tab.
      (navigation as any).navigate('Home', {
        screen: 'Click2Connect',
        params: { photoUri },
      });
    } else {
      navigation.goBack();
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <ActivityIndicator size="large" />
    </View>
  );
};

export default CameraScreen;