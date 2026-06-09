import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { CustomText, AppToolbar, CustomButton } from '../components/common';
import { globalStyles } from '../styles/globalStyles';
import { colors, fonts } from '../theme';
import { useAuth } from '../hooks';
import { useStatusModal } from '../contexts/StatusModalContext';
import { getContactGroupList, ContactGroup } from '../services';

import ContactGroupIcon from '../assets/icons/contactgroup.svg';
import EditIcon from '../assets/icons/editIcon.svg';
import { CONSTANTS } from '../utils';
import { AppNavigationProp } from '../navigation/types';

const ContactGroupScreen = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const { user } = useAuth();
  const { showError } = useStatusModal();

  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<ContactGroup[]>([]);

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [user?.id])
  );

  const fetchGroups = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await getContactGroupList(user.id);
      if (res.status) {
        setGroups(res.data || []);
      } else {
        showError(res.message || 'Failed to fetch contact groups');
      }
    } catch (e: any) {
      showError(e?.message || 'Failed to fetch contact groups');
    } finally {
      setLoading(false);
    }
  };

  const GroupCard = ({ item }: { item: ContactGroup }) => {
    const imageUrl = item.logo ? `${CONSTANTS.IMAGE_URL.GROUP_LOGO}${item.logo}` : null;
    const [imgError, setImgError] = useState(false);

    return (
      <View style={styles.groupCard}>
        <View style={[styles.groupCardHeader, { alignItems: 'center' }]}>
          <View style={styles.groupImageWrapper}>
            {imageUrl && !imgError ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.groupImage}
                onError={() => setImgError(true)}
              />
            ) : (
              <View style={[styles.groupImage, styles.groupImagePlaceholder]}>
                <ContactGroupIcon width={24} height={24} />
              </View>
            )}
          </View>
          <View style={styles.groupInfo}>
            <View style={styles.groupTitleRow}>
              <CustomText style={styles.groupTitle} numberOfLines={1}>{item.name}</CustomText>
              <TouchableOpacity 
                style={styles.editBtn}
                onPress={() => navigation.navigate('EditContactGroup', { id: item.id })}
              >
                <EditIcon width={16} height={17} />
              </TouchableOpacity>
            </View>
            <View style={styles.divider} />
            <View style={styles.totalContactsRow}>
              <CustomText style={styles.totalContactsLabel}>Total Contacts</CustomText>
              <View style={styles.totalContactsBadge}>
                <CustomText style={styles.totalContactsBadgeText}>
                  {item.contacts_count !== 0 ? item.contacts_count : 0}
                </CustomText>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.viewContactsBtn}
              onPress={() => navigation.navigate('ContactList', { id: item.id })}
            >
              <CustomText
                style={styles.viewContactsText}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                View Contacts
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderGroupItem = ({ item }: { item: ContactGroup }) => (
    <GroupCard item={item} />
  );

  return (
    <View style={styles.container}>
      <AppToolbar title="Contact Groups" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Banner Card */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerHeader}>
            <ContactGroupIcon width={20} height={20} color="#111827" />
            <View style={styles.bannerHeaderTextContainer}>
              <CustomText style={styles.bannerTitle}>Contact Group</CustomText>
              <CustomText style={styles.bannerSubtitle}>Manage &amp; organize contacts</CustomText>
            </View>
          </View>
          <CustomButton
            title="Add Contact Group"
            onPress={() => navigation.navigate('AddContactGroup')}
            style={styles.addBtnDark}
            textStyle={styles.addBtnDarkText}
          />
        </View>

        <CustomText style={styles.sectionTitle}>Groups</CustomText>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.primary.main} />
          </View>
        ) : (
          <FlatList
            data={groups}
            keyExtractor={(item, index) => item.id?.toString() || index.toString()}
            renderItem={renderGroupItem}
            scrollEnabled={false}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <CustomText style={styles.emptyText}>No contact groups found.</CustomText>
            }
          />
        )}
      </ScrollView>
    </View>
  );
};

export default ContactGroupScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },

  // -- Banner Card --
  bannerCard: {
    backgroundColor: '#FFF3D5',
    borderWidth: 1,
    borderColor: '#FFB600',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  bannerHeaderTextContainer: {
    marginLeft: 12,
  },
  bannerTitle: {
    fontSize: 16,
    fontFamily: fonts.families.bold,
    color: '#000',
  },
  bannerSubtitle: {
    fontSize: 12,
    fontFamily: fonts.families.medium,
    color: '#000',
    marginTop: 1,
  },
  addBtnDark: {
    backgroundColor: '#000',
    height: 48,
    borderRadius: 92,
  },
  addBtnDarkText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: fonts.families.bold,
  },

  sectionTitle: {
    fontSize: 14,
    fontFamily: fonts.families.bold,
    color: '#000',
    marginBottom: 10,
  },

  // -- List --
  loaderContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  listContainer: {
    gap: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 20,
  },

  // -- Group Card --
  groupCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  groupCardHeader: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  groupImageWrapper: {
    width: 90,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 14,
  },
  groupImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  groupImagePlaceholder: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupInfo: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  groupTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  groupTitle: {
    fontSize: 16,
    fontFamily: fonts.families.bold,
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  editBtn: {
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
  },
  totalContactsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  totalContactsLabel: {
    fontSize: 12,
    fontFamily: fonts.families.medium,
    color: '#6B7280',
  },
  totalContactsBadge: {
    backgroundColor: '#2DADBE',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 60,
    minWidth: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalContactsBadgeText: {
    fontSize: 12,
    fontFamily: fonts.families.bold,
    color: '#FFF',
    textAlign: 'center',
  },
  viewContactsBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 7,
    borderRadius: 92,
    borderWidth: 1.5,
    borderColor: '#111827',
  },
  viewContactsText: {
    fontSize: 12,
    fontFamily: fonts.families.bold,
    color: '#111827',
  },
});
