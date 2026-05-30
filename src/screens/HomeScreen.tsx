import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import { CustomText, CustomButton } from '../components/common';
import { useAuth, useTheme } from '../hooks';
import { globalStyles } from '../styles/globalStyles';
import { formatCurrency, formatDate } from '../utils/helpers';
import { colors, fonts } from '../theme';
import OverviewCard from '../components/common/OverviewCard';
import { getDashboardData } from '../services';

import SendIcon from '../assets/icons/SendIcon.svg';
import AvailableIcon from '../assets/icons/availableIcon.svg';
import PurchaseIcon from '../assets/icons/purchaseIcon.svg';
import ScanIcon from '../assets/icons/scanIcon.svg';

export const HomeScreen = () => {
  const { colors, spacing } = useTheme();
  const { user, logout } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState<any[]>([]);

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
              subtitle: 'Message sent so for',
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
            },
          ]);
        }
      } catch (e) {
        console.error('Failed to fetch dashboard data', e);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user?.id]);

  return (
    <ScrollView style={globalStyles.container} contentContainerStyle={styles.scrollContent}>
      {/* Welcome banner */}
      <View style={styles.header}>
        <View style={styles.profileRow}>
          <Image
            source={{
              uri: 'https://i.pravatar.cc/150?img=1', // replace with user image
            }}
            style={styles.profileImage}
          />

          <View style={styles.textContainer}>
            <CustomText variant="h2" style={styles.welcomeTitle}>
              Welcome,{' '}
              <CustomText variant="h2" style={styles.userName}>
                {user?.name || 'User'} 👋
              </CustomText>
            </CustomText>

            <CustomText
              variant="body"
              color={colors.text.secondary}
              style={styles.subTitle}>
              You’re all set to connect today
            </CustomText>

          </View>

        </View>
        <View style={styles.fullWidthDivider} />
      </View>
      <View>
        <CustomText variant="h2" style={styles.homeContentTitle}>
          Overview
        </CustomText>
        
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
    </ScrollView>
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
  badge: {
    letterSpacing: 1,
    marginBottom: 8,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: fonts.weights.extrabold,
    fontFamily: fonts.families.extrabold,

  },
  homeContentTitle:{
  fontSize: 14,
    fontWeight: fonts.weights.bold,
    fontFamily: fonts.families.bold,
  },
  userName: {
    fontSize: 20,
    fontWeight: fonts.weights.extrabold,
    color: colors.primary.main, // your highlight color
    fontFamily: fonts.families.extrabold,
  },
  cardHeader: {
    fontWeight: '700',
  },
  controlContainer: {
    marginTop: 40,
    alignItems: 'center',
    width: '100%',
  },
  footerInfo: {
    marginBottom: 20,
    lineHeight: 18,
  },
  logoutButton: {
    marginTop: 10,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 50,
    marginRight: 12,
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
    marginHorizontal: -24, // same as scrollContent padding
  },
  overviewGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  marginTop: 16,
  marginHorizontal: -6,
},

gridItem: {
  width: '50%',
  padding: 6,
},
});

export default HomeScreen;
