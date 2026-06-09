import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { CustomText } from '../components/common';
import { useAuth, useTheme } from '../hooks';
import { globalStyles } from '../styles/globalStyles';
import { colors, fonts } from '../theme';
import OverviewCard from '../components/common/OverviewCard';
import QuickActionCard from '../components/common/QuickActionCard';
import { getDashboardData } from '../services';

import SendIcon from '../assets/icons/SendIcon.svg';
import AvailableIcon from '../assets/icons/availableIcon.svg';
import PurchaseIcon from '../assets/icons/purchaseIcon.svg';
import ScanIcon from '../assets/icons/scanIcon.svg';

import DirectSendAngleCion from '../assets/icons/directsendangle.svg';
import MailIcon from '../assets/icons/mail.svg';
import ContactGroupIcon from '../assets/icons/contactgroup.svg';
import AiIcon from '../assets/icons/aiicon.svg';
import Logout from '../assets/icons/logout.svg';
import CloseIcon from '../assets/icons/cancelicon.svg';

import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { BottomTabParamList } from '../navigation/BottomTabNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export const HomeScreen = () => {
  const { colors: themeColors, spacing } = useTheme();
  const { user, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState<any[]>([]);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  const navigation = useNavigation<BottomTabNavigationProp<BottomTabParamList>>();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const showModal = () => {
    setProfileModalVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const hideModal = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setProfileModalVisible(false));
  };

  const handleLogout = async () => {
    hideModal();
    // Clear all AsyncStorage keys
    await AsyncStorage.clear();
    logout();
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!user?.id) return;
      try {
        const response = await getDashboardData(user.id);
        if (response && response.status) {
          const data = response.data;
          setOverviewData([
            {
              id: '1',
              title: 'Total Sent',
              value: data.sent_count,
              subtitle: 'Message sent so far',
              Icon: SendIcon,
              color: '#2DADBE',
            },
            {
              id: '2',
              title: 'Available Count',
              value: data.total_available_mail,
              subtitle: 'Remaining Balance',
              Icon: AvailableIcon,
              color: '#519E00',
            },
            {
              id: '3',
              title: 'Purchase Count',
              value: data.total_purchased_mail,
              subtitle: 'Total Credit Purchased',
              Icon: PurchaseIcon,
              color: '#5C61F2',
            },
            {
              id: '4',
              title: 'Scan Count',
              value: data.scan_count,
              subtitle: 'Used vs Total',
              Icon: ScanIcon,
              color: '#FFB600',
              showProgress: true,
              progressValue: Number(data.scan_count.split('/')[0]),
              progressTotal: Number(data.scan_count.split('/')[1]),
            },
          ]);
        }
      } catch (e: any) {
        if (e?.response?.status !== 401) {
          console.error('Failed to fetch dashboard data', e);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user?.id]);

  return (
    <>
      <ScrollView style={globalStyles.container} contentContainerStyle={styles.scrollContent}>
        {/* Welcome banner */}
        <View style={styles.header}>
          <View style={styles.profileRow}>
            <TouchableOpacity onPress={showModal} style={styles.profileImageWrapper}>
              <Image
                source={require('../assets/images/profile.png')}
                style={styles.profileImageCircle}
              />
            </TouchableOpacity>

            <View style={styles.textContainer}>
              <CustomText style={styles.welcomeTitle}>
                Welcome,{' '}
                <CustomText style={styles.userName}>
                  {user?.name || 'User'} 👋
                </CustomText>
              </CustomText>

              <CustomText
                color={themeColors.text.secondary}
                style={styles.subTitle}>
                You're all set to connect today
              </CustomText>
            </View>
          </View>
          <View style={styles.fullWidthDivider} />
        </View>

        {/* Overview */}
        <View>
          <CustomText style={styles.homeContentTitle}>Overview</CustomText>

          {loading ? (
            <View style={{ marginTop: 20, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary.main} />
            </View>
          ) : (
            <View style={styles.overviewGrid}>
              {overviewData.map(item => (
                <View key={item.id} style={styles.gridItem}>
                  <OverviewCard {...item} />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={{ marginBottom: 16 }}>
          <CustomText style={[styles.homeContentTitle, { marginTop: 10, marginBottom: 12 }]}>
            Quick Actions
          </CustomText>
          <View style={styles.quickActionsGrid}>
            <View style={styles.quickActionItem}>
              <QuickActionCard
                title="Click2Connect AI"
                subTitle="Instant smart outreach"
                Icon={AiIcon}
                borderColor="#06B6D4"
                backgroundColor="#E0F7FA"
                onPress={() => navigation.navigate('Click2Connect')}
              />
            </View>
            <View style={styles.quickActionItem}>
              <QuickActionCard
                title="Direct Send"
                subTitle="Send messages fast"
                Icon={DirectSendAngleCion}
                borderColor="#F87171"
                backgroundColor="#FEE2E2"
                onPress={() => navigation.navigate('DirectSend')}
              />
            </View>
            <View style={styles.quickActionItem}>
              <QuickActionCard
                title="Mail Template"
                subTitle="Create reusable emails"
                Icon={MailIcon}
                borderColor="#818CF8"
                backgroundColor="#EDE9FE"
                onPress={() => navigation.navigate('MailTemplate')}
              />
            </View>
            <View style={styles.quickActionItem}>
              <QuickActionCard
                title="Contact Group"
                subTitle="Manage & organize contacts"
                Icon={ContactGroupIcon}
                borderColor="#FBBF24"
                backgroundColor="#FEF9C3"
                onPress={() => navigation.navigate('ContactGroup')}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Profile Bottom Sheet Modal */}
      <Modal
        visible={profileModalVisible}
        transparent
        animationType="none"
        onRequestClose={hideModal}
        statusBarTranslucent
      >
        {/* Backdrop */}
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={hideModal}
        />

        {/* Slide-up sheet */}
        <Animated.View
  style={[styles.bottomSheet, { transform: [{ translateY: slideAnim }] }]}
>
  {/* Centered avatar sitting on top edge */}
  <View style={styles.avatarCenterWrapper}>
    <Image
      source={require('../assets/icons/bottomProfile.png')}
      style={styles.modalAvatar}
    />
  </View>

  {/* Close icon top right */}
  <TouchableOpacity style={styles.closeIconWrapper} onPress={hideModal}>
    <CloseIcon width={34} height={34} />
  </TouchableOpacity>

  {/* Name & Email */}
  <View style={styles.nameRow}>
    <CustomText style={styles.nameText}>Name:</CustomText>
    <CustomText style={styles.nameValueText}>{user?.name}</CustomText>
  </View>
  <View style={styles.emailRow}>
    <CustomText style={styles.nameText}>Email:</CustomText>
    <CustomText style={styles.emailValueText}>{user?.email}</CustomText>
  </View>

  <View style={styles.divider} />

  {/* Logout Button */}
  <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
    <Logout width={18} height={19} />
    <CustomText style={styles.logoutText}>Logout</CustomText>
  </TouchableOpacity>

  <View style={{ height: 30 }} />
</Animated.View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 24,
    flexGrow: 1,
  },
  header: {
    marginTop: 20,
    marginBottom: 10,
  },
  welcomeTitle: {
    fontSize: 20,
    fontFamily: fonts.families.extrabold,
  },
  homeContentTitle: {
    fontSize: 14,
    fontFamily: fonts.families.bold,
  },
  userName: {
    fontSize: 20,
    color: colors.primary.main,
    fontFamily: fonts.families.extrabold,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:"space-between"
  },
  textContainer: {
    flex: 1,
  },
  subTitle: {
    fontSize: 12,
    marginTop: 2,
  },
  fullWidthDivider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginTop: 16,
    marginHorizontal: -24,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
    marginHorizontal: -6,
  },
  gridItem: {
    width: '50%',
    padding: 6,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  quickActionItem: {
    width: '50%',
    padding: 6,
  },
  profileImageWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    overflow: 'hidden',
  },
  profileImageCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    resizeMode: 'cover',
  },

  // ---- Profile Bottom Sheet ----
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.50)',
  },
bottomSheet: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: '#FFFFFF',
  borderTopLeftRadius: 30,
  borderTopRightRadius: 30,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -6 },
  shadowOpacity: 0.15,
  shadowRadius: 20,
  elevation: 24,
  paddingHorizontal: 16,
  paddingTop: 70, // space for the avatar that overlaps the top
  paddingBottom: 16,
},
  handleBar: {
    width: 44,
    height: 5,
    backgroundColor: '#D1D5DB',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 0,
  },
  // Dark header section
  sheetHeader: {
    backgroundColor: '#171829',
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: 24,
    marginTop: 12,
  },
  avatarCenterWrapper: {
  position: 'absolute',
  top: -50, // half of avatar height, pulls it above the sheet
  width: 110,
  height: 110,
  borderRadius: 55,
  overflow: 'hidden',
 left: 16,
 
},
  avatarWrapper: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 3,
    borderColor: '#2DADBE',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    resizeMode: 'cover',
  },
  modalAvatar: {
  width: 110,
  height: 110,
  borderRadius: 55,
  resizeMode: 'cover',
},
closeIconWrapper: {
  position: 'absolute',
  top: 16,
  right: 16,
},
  sheetName: {
    fontSize: 18,
    fontFamily: fonts.families.bold,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sheetEmail: {
    fontSize: 13,
    fontFamily: fonts.families.regular,
    color: '#9CA3AF',
  },
  // Info list section
  infoList: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: fonts.families.medium,
    color: '#374151',
  },
  infoValue: {
    fontSize: 14,
    fontFamily: fonts.families.semiBold,
    color: '#111827',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 16,
    maxWidth: '55%',
  },
  logoutButton: {
    
    marginTop: 20,
    backgroundColor: '#1C1C28',
    borderRadius: 30,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection:'row',
    gap:5
  },
  logoutText: {
    fontSize: 16,
    fontFamily: fonts.families.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  nameText:{
    color: "#9A9A9A",
    fontFamily:fonts.families.regular,
    fontSize:12

  },  
  nameValueText:{
    color: colors.primary.main,
    fontFamily:fonts.families.bold,
    fontSize:20,
    marginStart:22

  },  
  emailValueText:{
    color: colors.text.primary,
    fontFamily:fonts.families.regular,
    fontSize:12,
    marginStart:22

  },  
  nameRow:{
    flexDirection:"row"
  },
  emailRow:{
    flexDirection:"row",
    marginTop:8
  },
   divider: {
    height: 0.7,
    backgroundColor: '#DADADA',
    marginVertical: 12,
  },
});

export default HomeScreen;
