import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  Animated,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppToolbar, CustomText, CustomButton } from '../components/common';
import { colors, fonts } from '../theme';
import { globalStyles } from '../styles/globalStyles';
import { scanBusinessCard } from '../services';
import { useAuth } from '../hooks';
import { BottomTabParamList } from '../navigation/BottomTabNavigator';
import { AppNavigationProp } from '../navigation/types';

import UploadIcon from '../assets/icons/uploadicon.svg';  
import ScanningIcon from '../assets/icons/scanningIcon.svg';

const Click2ConnectScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<RouteProp<BottomTabParamList, 'Click2Connect'>>();
  const insets = useSafeAreaInsets();
  
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  // Animated value for line loader
  const lineAnim = useRef(new Animated.Value(0)).current;

  // ── Listen for photo captured from CameraScreen ───────────────────────────
  useEffect(() => {
    if (route.params?.photoUri) {
      setPhotoUri(route.params.photoUri);
      // Clear param so it doesn't trigger again on re-focus
      navigation.setParams({ photoUri: undefined });
    }
  }, [route.params?.photoUri, navigation]);

  // ── Animate Line Loader ───────────────────────────────────────────────────
  useEffect(() => {
    if (scanning) {
      lineAnim.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(lineAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(lineAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      lineAnim.stopAnimation();
    }
  }, [scanning, lineAnim]);

  // ── Open Camera ───────────────────────────────────────────────────────────
  const handleOpenCamera = () => {
    navigation.navigate('Camera');
  };

  const handleRemoveImage = () => setPhotoUri(null);

  // ── Call the scan API ──────────────────────────────────────────────────────
  const handleScanNow = async () => {
    if (!photoUri || !user?.id) return;

    setScanning(true);
    try {
      // Create a filename from the URI or a default one
      const fileName = photoUri.split('/').pop() || 'card.jpg';
      const result = await scanBusinessCard(
        user.id,
        photoUri,
        fileName,
        'image/jpeg',
      );

      if (result.status) {
        console.log("scanBusinessCard",result);
        
        // Alert.alert('Success', result.message || 'Business card scanned successfully!');
        setPhotoUri(null);
        navigation.navigate('PreviewExtracted', {
          data: result.data
        });
      } else {
        Alert.alert('Failed', result.message || 'Scan failed. Please try again.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Something went wrong. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <View style={styles.root}>
      <AppToolbar title="Click2Connect" />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* ── Upload card section ────────────────────────────────────────── */}
        <View style={styles.card}>
          <CustomText style={styles.sectionTitle}>Upload Business Card</CustomText>
          <View style={globalStyles.divider} />
          <CustomText style={styles.subTitle}>
            Scan and digitize your business cards instantly with AI-powered recognition
          </CustomText>

          {/* Upload area — always visible */}
          <TouchableOpacity
            style={styles.uploadArea}
            onPress={handleOpenCamera}
            activeOpacity={0.75}>
            <View style={styles.uploadIconContainer}>
              <UploadIcon width={28} height={28} />
            </View>

            <CustomText style={styles.uploadText}>Tap to Scan Your Card</CustomText>

            <CustomText style={styles.choosePhotoText}>
              Open camera to capture
            </CustomText>
          </TouchableOpacity>
        </View>

        {/* ── Preview section — shown only when image is selected ────────── */}
        {photoUri && (
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <CustomText style={styles.previewLabel}>Preview #1</CustomText>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={handleRemoveImage}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <CustomText style={styles.removeBtnText}>✕</CustomText>
              </TouchableOpacity>
            </View>

            <Image
              source={{ uri: photoUri }}
              style={styles.previewImage} 
              resizeMode="cover"
            />
          </View>
        )}
      </ScrollView>

      {/* ── Scan Now button — anchored at the bottom when image is selected ─ */}
      {photoUri && !scanning && (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <CustomButton
            title="Scan Now"
            onPress={handleScanNow}
            style={styles.scanButton}
            textStyle={styles.scanButtonText}
          />
        </View>
      )}

      {/* ── Scanning Modal Overlay ─────────────────────────────────────────────── */}
      <Modal visible={scanning} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.scanningModalCard}>
            <View style={styles.scanningContent}>
       <View style={styles.scannerIconWrapper}>
  <ScanningIcon
    width={100}
    height={100}
  />
</View>
              <CustomText style={styles.scanningTitle}>Scanning Your Card</CustomText>
              <CustomText style={styles.scanningSubTitle}>
                Please wait while we extract the information from{'\n'}your business card
              </CustomText>
              
              {/* Line Loader above extracting text */}
              <View style={styles.lineLoaderContainer}>
                <Animated.View 
                  style={[
                    styles.lineLoaderBar, 
                    {
                      left: lineAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '70%'],
                      }),
                    }
                  ]} 
                />
              </View>
              
              <CustomText style={styles.extractingText}>Extracting Card Details....</CustomText>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Click2ConnectScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    padding: 20,
    paddingBottom: 100,
  },

  // ── Section card ──────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.families.bold,
    color: colors.primary.main,
    marginBottom: 10,
  },
  subTitle: {
    fontSize: 12,
    fontFamily: fonts.families.medium,
    color: '#000',
    lineHeight: 18,
    marginTop: 10,
  },

  // ── Upload area ───────────────────────────────────────────────────────────
  uploadArea: {
    marginTop: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary.main,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  uploadIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primary.main,
    backgroundColor: '#EDF9FB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  uploadText: {
    fontSize: 18,
    color: '#111827',
    fontFamily: fonts.families.bold,
    textAlign: 'center',
  },
  choosePhotoText: {
    marginTop: 4,
    fontSize: 13,
    color: '#475569',
    fontFamily: fonts.families.medium,
    textAlign: 'center',
  },
  fileTypeBadge: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: colors.primary.main,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#E9FCFF',
  },
  fileTypeText: {
    fontSize: 12,
    color: '#334155',
    fontFamily: fonts.families.medium,
  },

  // ── Preview card ──────────────────────────────────────────────────────────
  previewCard: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  previewLabel: {
    fontSize: 15,
    fontFamily: fonts.families.bold,
    color: colors.primary.main,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    fontSize: 12,
    color: '#EF4444',
    fontFamily: fonts.families.bold,
  },
  previewImage: {
    width: '100%',
    height: 200,
  },

  // ── Bottom scan bar ───────────────────────────────────────────────────────
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  scanButton: {
    height: 54,
    borderRadius: 30,
    backgroundColor: '#22242A',
  },
  scanButtonText: {
    fontSize: 16,
    fontFamily: fonts.families.bold,
    color: '#FFFFFF',
  },
  scanningRow: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22242A',
    borderRadius: 30,
    gap: 10,
  },
  scanningText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: fonts.families.medium,
  },

  // ── Scanning Modal ────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  scanningModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  scanningContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  scannerIconWrapper: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  scannerCornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#7BA4F5',
  },
  scannerCornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#7BA4F5',
  },
  scannerCornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 20,
    height: 20,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#7BA4F5',
  },
  scannerCornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#7BA4F5',
  },
  scannerLine: {
    position: 'absolute',
    top: 50,
    left: 4,
    right: 4,
    height: 3,
    backgroundColor: '#7BA4F5',
    borderRadius: 2,
    zIndex: 10,
    shadowColor: '#7BA4F5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  scannerDocument: {
    width: 50,
    height: 66,
    backgroundColor: '#F0F8FF',
    borderRadius: 4,
    padding: 8,
    justifyContent: 'center',
  },
  docLine1: { width: '80%', height: 3, backgroundColor: '#CBD5E1', marginBottom: 6, borderRadius: 2 },
  docLine2: { width: '60%', height: 3, backgroundColor: '#CBD5E1', marginBottom: 12, borderRadius: 2 },
  docLine3: { width: '90%', height: 3, backgroundColor: '#CBD5E1', marginBottom: 6, borderRadius: 2 },
  docLine4: { width: '70%', height: 3, backgroundColor: '#CBD5E1', borderRadius: 2 },
  
  scanningTitle: {
    fontSize: 16,
    fontFamily: fonts.families.bold,
    color: colors.primary.main,
  },
  scanningSubTitle: {
    fontSize: 12,
    fontFamily: fonts.families.medium,
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  lineLoaderContainer: {
    width: '70%',
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  lineLoaderBar: {
    position: 'absolute',
    width: '30%',
    height: '100%',
    backgroundColor: '#111827',
    borderRadius: 2,
  },
  extractingText: {
    fontSize: 12,
    fontFamily: fonts.families.bold,
    color: '#000',
  },
  scannerImage: {
  width: 60,
  height: 60,
},
});
