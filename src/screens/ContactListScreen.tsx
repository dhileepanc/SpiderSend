import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppToolbar, CustomButton, CustomText, ConfirmModal } from '../components/common';
import { colors, fonts } from '../theme';
import { useAuth } from '../hooks';
import { useStatusModal } from '../contexts/StatusModalContext';
import { getContactList, getContactAddView, createContact, updateContact, getContactDetails, deleteContact, Contact, ContactGroupField } from '../services';
import ContactGroupIcon from '../assets/icons/contactgroup.svg';
import EditIcon from '../assets/icons/editIcon.svg';
import DeleteIcon from '../assets/icons/deleteicon.svg';
import { AppStackParamList } from '../navigation/types';

type ContactListRouteProp = RouteProp<AppStackParamList, 'ContactList'>;

const ContactListScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<ContactListRouteProp>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showError, showSuccess } = useStatusModal();

  const groupId = route.params.id;
  // Fallback name if passed, or we can fetch it. The UI says "KL Business Network"
  // Assuming we might pass the group name in route params or we just show a generic title if not found.
  // Wait, let's look at AppStackParamList, I didn't add name to it in my edit.
  // I'll update it to accept `name?` later or just display "Contact List"

  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groupName, setGroupName] = useState<string>('Group Contacts');
  const [groupFields, setGroupFields] = useState<ContactGroupField[]>([]);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);

  // Delete Modal State
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  
  // Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [metaFields, setMetaFields] = useState<Record<string, string>>({});
  const [addViewLoading, setAddViewLoading] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, [user?.id, groupId]);

  const fetchContacts = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await getContactList(user.id, groupId);
      if (res.status && res.data) {
        setContacts(res.data.contacts || []);
        if (res.data.group?.name) {
          setGroupName(res.data.group.name);
        }
        setGroupFields(res.data.group_fields || (res.data as any).fields || []);
      } else {
        showError(res.message || 'Failed to fetch contacts');
      }
    } catch (e: any) {
      showError(e?.message || 'Failed to fetch contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = async () => {
    if (!user?.id) return;
    try {
      setAddViewLoading(true);
      const res = await getContactAddView(user.id, groupId);
      if (res.status && res.data) {
        setGroupFields(res.data.group_fields || []);
      }
    } catch (e) {
      // non-fatal: fall back to existing groupFields from list API
    } finally {
      setAddViewLoading(false);
    }
    setEditingId(null);
    setContactName('');
    setContactEmail('');
    setMetaFields({});
    setModalVisible(true);
  };

  const handleEdit = async (id: string | number) => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await getContactDetails(user.id, id);
      if (res.status && res.data && res.data.contact) {
        const { contact } = res.data;
        setEditingId(id);
        setContactName(contact.name || '');
        setContactEmail(contact.email || '');
        setMetaFields(contact.meta || {});
        // Sync group fields from detail API so dynamic fields always render
        const fieldsToSync = res.data.group_fields || (res.data as any).fields;
        if (fieldsToSync && fieldsToSync.length > 0) {
          setGroupFields(fieldsToSync);
        }
        setModalVisible(true);
      } else {
        showError(res.message || 'Failed to fetch contact details');
      }
    } catch (e: any) {
      showError(e?.message || 'Error fetching contact details');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string | number) => {
    setDeletingId(id);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!user?.id || !deletingId) return;
    try {
      setLoading(true);
      setDeleteModalVisible(false);
      const res = await deleteContact(user.id, deletingId);
      if (res.status) {
        showSuccess(res.message || 'Contact deleted successfully', 'Success', 'trash');
        fetchContacts();
      } else {
        showError(res.message || 'Failed to delete contact');
      }
    } catch (e: any) {
      showError(e?.message || 'Error deleting contact');
    } finally {
      setLoading(false);
      setDeletingId(null);
    }
  };

  const handleSaveContact = async () => {
    if (!contactName.trim() || !contactEmail.trim()) {
      showError('Name and Email are required.');
      return;
    }
    if (!user?.id) return;

    try {
      setSaving(true);
      const payload = {
        clientId: user.id,
        groupId,
        contactId: editingId,
        name: contactName.trim(),
        email: contactEmail.trim(),
        meta: metaFields,
      };

      const res = editingId
        ? await updateContact(payload)
        : await createContact(payload);

      if (res.status) {
        showSuccess(
          res.message || `Contact ${editingId ? 'updated' : 'added'} successfully!`,
          editingId ? 'Contact Updated' : 'Contact Created',
          'tick'
        );
        setModalVisible(false);
        fetchContacts();
      } else {
        showError(res.message || 'Failed to save contact');
      }
    } catch (e: any) {
      showError(e?.message || 'Error saving contact');
    } finally {
      setSaving(false);
    }
  };

  const renderContactItem = ({ item, index }: { item: Contact; index: number }) => {
    const formattedIndex = String(index + 1).padStart(2, '0');

    return (
      <View style={styles.contactCard}>
        {/* Index */}
        <CustomText style={styles.contactIndex}>{formattedIndex}</CustomText>

        {/* Details */}
        <View style={styles.contactDetails}>
          <CustomText style={styles.contactName} numberOfLines={1}>
            {item.name || 'Unnamed Contact'}
          </CustomText>
          <CustomText style={styles.contactEmail} numberOfLines={1}>
            {item.email || 'No email provided'}
          </CustomText>
        </View>

        {/* Actions */}
        <View style={styles.contactActions}>
          <TouchableOpacity
            style={styles.actionBtnEdit}
            onPress={() => handleEdit(item.id)}
          >
            <EditIcon width={20} height={21} color="#2DADBE" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteClick(item.id)}
          >
            <DeleteIcon width={34} height={34} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AppToolbar title="Contacts" />

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]} showsVerticalScrollIndicator={false}>
        {/* Top Banner Card */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerHeader}>
            <View style={styles.bannerImagePlaceholder}>
              <ContactGroupIcon width={32} height={32} />
            </View>
            <View style={styles.bannerHeaderTextContainer}>
              <CustomText style={styles.bannerTitle} numberOfLines={1}>
                {groupName}
              </CustomText>
              <CustomText style={styles.bannerSubtitle}>You can add contact</CustomText>
               <View style={styles.divider} />

                <CustomButton
            title="Add Contact"
            onPress={handleOpenAdd}
            style={styles.addBtnDark}
            textStyle={styles.addBtnDarkText}
          />
            </View>
          </View>
         
         
        </View>

        <CustomText style={styles.sectionTitle}>Contacts</CustomText>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#1E1B4B" />
          </View>
        ) : (
          <FlatList
            data={contacts}
            keyExtractor={(item, index) => item.id?.toString() || index.toString()}
            renderItem={renderContactItem}
            scrollEnabled={false}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <CustomText style={styles.emptyText}>No contacts found in this group.</CustomText>
            }
          />
        )}
      </ScrollView>

      {/* Add/Edit Contact Modal */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            style={styles.modalContent}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <CustomText style={styles.modalTitle} numberOfLines={1}>
                {editingId ? 'Edit Contact' : 'Add Contact'}
              </CustomText>
              <TouchableOpacity
                style={styles.modalCloseIcon}
                onPress={() => setModalVisible(false)}
              >
                <CustomText style={styles.modalCloseIconText}>✕</CustomText>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Name */}
              <CustomText style={styles.inputLabel}>Name</CustomText>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your name"
                placeholderTextColor="#9CA3AF"
                value={contactName}
                onChangeText={setContactName}
              />

              {/* Email */}
              <CustomText style={styles.inputLabel}>Email</CustomText>
              <TextInput
                style={styles.textInput}
                placeholder="Enter mail id"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                value={contactEmail}
                onChangeText={setContactEmail}
              />

              {/* Dynamic group_fields */}
              {addViewLoading ? (
                <ActivityIndicator size="small" color="#2DADBE" style={{ marginTop: 16 }} />
              ) : (
                groupFields.map((field) => {
                  const isMultiline =
                    field.type === 'textarea' ||
                    field.label?.toLowerCase().includes('address');
                  return (
                    <View key={field.slug}>
                      <CustomText style={styles.inputLabel}>
                        {field.label}
                        {field.required ? (
                          <CustomText style={{ color: '#EF4444' }}> *</CustomText>
                        ) : null}
                      </CustomText>
                      <TextInput
                        style={[styles.textInput, isMultiline && styles.textInputMultiline]}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        placeholderTextColor="#9CA3AF"
                        multiline={isMultiline}
                        numberOfLines={isMultiline ? 4 : 1}
                        textAlignVertical={isMultiline ? 'top' : 'center'}
                        value={metaFields[field.slug] || ''}
                        onChangeText={(val) =>
                          setMetaFields((prev) => ({ ...prev, [field.slug]: val }))
                        }
                      />
                    </View>
                  );
                })
              )}

              {/* Modal Footer */}
              <View style={styles.modalFooter}>
                <CustomButton
                  title="Close"
                  variant="outline"
                  onPress={() => setModalVisible(false)}
                  style={styles.modalCancelBtn}
                  textStyle={styles.modalCancelText}
                />
                <CustomButton
                  title={editingId ? 'Update' : 'Create'}
                  onPress={handleSaveContact}
                  loading={saving}
                  style={styles.modalCreateBtn}
                  textStyle={styles.modalCreateBtnText}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={deleteModalVisible}
        title="Delete Contact"
        message="Are you sure you want to delete this contact? This action cannot be undone."
        onCancel={() => setDeleteModalVisible(false)}
        onConfirm={confirmDelete}
        confirmText="Delete"
        loading={loading}
      />
    </View>
  );
};

export default ContactListScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 20,
  },

  // -- Banner Card --
  bannerCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal:12,
    paddingVertical:20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerImagePlaceholder: {
    width: 84,
    height: 90,
    backgroundColor: '#E0F8FB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerHeaderTextContainer: {
    flex: 1,
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
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  addBtnDark: {
    backgroundColor: '#000',
    height: 35,
    borderRadius: 30,
    alignSelf: 'flex-start',
    paddingHorizontal: 24,
    width: 'auto',
  },
  addBtnDarkText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: fonts.families.bold,
  },

  // -- Section Title --
  sectionTitle: {
    fontSize: 14,
    fontFamily: fonts.families.bold,
    color: '#000',
    marginBottom: 12,
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
    fontFamily: fonts.families.medium,
  },

  // -- Contact Card --
 contactCard: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#FFF',
  borderRadius: 16,
  paddingVertical: 20,
  paddingHorizontal: 20,
  shadowColor: '#D1D5DB',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 6,
  elevation: 1,
  // borderWidth: 1,
  // borderColor: '#D1D5DB',
},
  contactIndex: {
    fontSize: 20,
    fontFamily: fonts.families.bold,
    color: '#06B6D4',
    marginRight: 8,
    minWidth: 24,
  },
  contactDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  contactName: {
    fontSize: 16,
    fontFamily: fonts.families.bold,
    color: '#000',
    marginBottom: 2,
  },
  contactEmail: {
    fontSize: 12,
    fontFamily: fonts.families.medium,
    color: '#000',
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    gap: 8,
  },
  actionBtnEdit: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#2DADBE',
    backgroundColor: '#E9FCFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnDelete: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // -- Modal --
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.families.bold,
    color: colors.primary.main,
    marginRight: 8,
  },
  modalCloseIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseIconText: {
    color: '#EF4444',
    fontSize: 14,
    fontFamily: fonts.families.bold,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: fonts.families.bold,
    color: '#000',
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 12,
    fontFamily: fonts.families.medium,
    color: colors.text.primary,
  },
  textInputMultiline: {
    height: undefined,
    minHeight: 96,
    paddingTop: 12,
    paddingBottom: 12,
  },
  modalFooter: {
    flexDirection: 'row',
    marginTop: 30,
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: colors.text.primary,
  },
  modalCreateBtn: {
    flex: 1,
    height: 50,
    backgroundColor: colors.text.primary,
    borderRadius: 30,
  },
  modalCreateBtnText: {
    color: '#FFF',
    fontFamily: fonts.families.bold,
  },
  modalCancelText:{
     color: colors.text.primary,
    fontFamily: fonts.families.bold,
  }
});
