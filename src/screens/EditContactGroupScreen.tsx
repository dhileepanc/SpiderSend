import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppToolbar, CustomButton, CustomText } from '../components/common';
import { fonts } from '../theme';
import { useAuth } from '../hooks';
import { useStatusModal } from '../contexts/StatusModalContext';
import { getContactGroupDetails, updateContactGroup } from '../services';
import DownArrow from '../assets/icons/downarrow.svg';
import { launchImageLibrary } from 'react-native-image-picker';
import { AppStackParamList } from '../navigation/types';
import CloseIcon from '../assets/icons/cancelicon.svg';

// ─── Types ────────────────────────────────────────────────────────────────────
interface CustomField {
  id: string | number;
  label: string;
  type: string;
  isRequired: boolean;
  isNew?: boolean;
}

interface DropdownState {
  fieldId: string | number;
  top: number;
  left: number;
  width: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const FIELD_TYPES = ['Text', 'Email', 'Number'];

const toSlug = (label: string) =>
  label.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

type EditScreenRouteProp = RouteProp<AppStackParamList, 'EditContactGroup'>;

// ─── Component ────────────────────────────────────────────────────────────────
const EditContactGroupScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<EditScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showError, showSuccess } = useStatusModal();

  const groupId = route.params.id;

  // Form state
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [logoFileName, setLogoFileName] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [updating, setUpdating] = useState(false);

  // Dropdown portal state
  const [dropdown, setDropdown] = useState<DropdownState | null>(null);
  const triggerRefs = useRef<Record<string, View | null>>({});

  // ── Fetch Details ───────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchDetails = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const res = await getContactGroupDetails(user.id, groupId);
        if (res.status && res.data && res.data.group) {
          const { group, fields } = res.data;
          setGroupName(group.name || '');
          if (group.logo) {
            setLogoUri(group.logo);
            // Extract a display filename from URL or use a generic one
            setLogoFileName(group.logo.split('/').pop() || 'Existing Logo');
          }
          if (fields && Array.isArray(fields)) {
            setCustomFields(
              fields.map((f) => ({
                id: f.id,
                label: f.label,
                type: f.type ? f.type.charAt(0).toUpperCase() + f.type.slice(1) : 'Text',
                isRequired: f.required === true || f.required === 1 || String(f.required) === '1',
                isNew: false,
              }))
            );
          }
        } else {
          showError(res.message || 'Failed to fetch contact group details.');
          navigation.goBack();
        }
      } catch (e: any) {
        showError(e?.message || 'Error fetching details.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [user?.id, groupId]);

  // ── Field helpers ───────────────────────────────────────────────────────────
  const handleAddCustomField = () => {
    setCustomFields((prev) => [
      ...prev,
      { id: `new_${Date.now()}`, label: '', type: '', isRequired: false, isNew: true },
    ]);
  };

  const handleRemoveCustomField = (id: string | number) => {
    setCustomFields((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUpdateCustomField = (id: string | number, key: keyof CustomField, value: any) => {
    setCustomFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [key]: value } : f))
    );
  };

  // ── Dropdown helpers ────────────────────────────────────────────────────────
  const openDropdown = (fieldId: string | number) => {
    const ref = triggerRefs.current[String(fieldId)];
    if (!ref) return;
    ref.measureInWindow((x, y, width, height) => {
      setDropdown({ fieldId, top: y + height + 4, left: x, width });
    });
  };

  const closeDropdown = () => setDropdown(null);

  const selectType = (type: string) => {
    if (dropdown) {
      handleUpdateCustomField(dropdown.fieldId, 'type', type);
    }
    closeDropdown();
  };

  // ── Logo helper ─────────────────────────────────────────────────────────────
  const handleChooseFile = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 1,
      },
      (response) => {
        if (response.didCancel || response.errorCode) return;
        const asset = response.assets?.[0];
        if (asset?.uri) {
          setLogoUri(asset.uri);
          setLogoFileName(asset.fileName || 'Selected file');
          setLogoFile({
            uri: asset.uri,
            name: asset.fileName || 'logo.jpg',
            type: asset.type || 'image/jpeg',
          });
        }
      }
    );
  };

  const handleClearFile = () => {
    setLogoUri(null);
    setLogoFileName(null);
    setLogoFile(null);
  };

  // ── Update handler ──────────────────────────────────────────────────────────
  const handleUpdate = async () => {
    if (!groupName.trim()) {
      showError('Please enter a group name.', 'Validation Error');
      return;
    }
    if (!user?.id) {
      showError('User not found. Please log in again.');
      return;
    }
    try {
      setUpdating(true);
      const res = await updateContactGroup({
        clientId: user.id,
        id: groupId,
        name: groupName.trim(),
        logo: logoFile,
        fields: customFields.map((f) => ({
          ...(f.isNew ? {} : { id: f.id }), // Only pass id if it already existed
          label: f.label,
          slug: toSlug(f.label) || toSlug(f.type),
          type: f.type || 'text',
          required: f.isRequired ? 1 : 0,
        })),
      });
      if (res.status) {
        showSuccess(
          'The contact details have been updated successfully.',
          'Contact Group Updated',
          'tick'
        );
        setTimeout(() => {
          navigation.goBack();
        }, 800);
      } else {
        showError(res.message || 'Failed to update contact group.');
      }
    } catch (e: any) {
      showError(e?.message || 'Failed to update contact group.');
    } finally {
      setUpdating(false);
    }
  };

  const handleClose = () => navigation.goBack();

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1E1B4B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppToolbar title="Edit Contact Group" onBackPress={handleClose} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Group Name */}
          <CustomText style={styles.fieldLabel}>Group Name</CustomText>
          <TextInput
            style={styles.textInput}
            placeholder="Enter Group Name"
            placeholderTextColor="#9CA3AF"
            value={groupName}
            onChangeText={setGroupName}
          />

          {/* Logo */}
          <CustomText style={styles.fieldLabel}>Logo</CustomText>
          <View style={styles.fileInputContainer}>
            <CustomText style={styles.fileInputText}>
              {logoFileName ? 'File selected' : 'No File Chosen'}
            </CustomText>
            {logoFileName ? (
              <View style={styles.selectedFileBadge}>
                <CustomText style={styles.selectedFileText} numberOfLines={1}>
                  {logoFileName}
                </CustomText>
                <TouchableOpacity onPress={handleClearFile} style={styles.clearFileBtn}>
                  <CustomText style={styles.clearFileIcon}>✕</CustomText>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.chooseFileBtn} onPress={handleChooseFile}>
                <CustomText style={styles.chooseFileBtnText}>Choose File</CustomText>
              </TouchableOpacity>
            )}
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <CustomText style={styles.infoBoxTitle}>
              Default fields like NAME &amp; EMAIL ID already added.
            </CustomText>
            <CustomText style={styles.infoBoxDesc}>
              Please add any new custom fields that you may required in the contact form
            </CustomText>
            <TouchableOpacity style={styles.addFieldBtn} onPress={handleAddCustomField}>
              <CustomText style={styles.addFieldBtnText}>+ Add Field</CustomText>
            </TouchableOpacity>
          </View>

          {/* Custom Fields */}
          {customFields.map((field) => (
            <View key={field.id} style={styles.customFieldCard}>
              {/* Card Header */}
              <View style={styles.customFieldHeader}>
                <CustomText style={styles.customFieldTitle}>Custom Field</CustomText>
                <TouchableOpacity
            
                  onPress={() => handleRemoveCustomField(field.id)}
                >
                 <CloseIcon width={34} height={34} />
                </TouchableOpacity>
              </View>

              {/* Label */}
              <CustomText style={styles.fieldLabel}>Label</CustomText>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Address, Phone number, Company"
                placeholderTextColor="#9CA3AF"
                value={field.label}
                onChangeText={(val) => handleUpdateCustomField(field.id, 'label', val)}
              />

              {/* Field Type trigger — ref stored for measureInWindow */}
              <CustomText style={styles.fieldLabel}>Field Type</CustomText>
              <View
                ref={(r) => { triggerRefs.current[String(field.id)] = r; }}
                collapsable={false}
              >
                <TouchableOpacity
                  style={styles.dropdownInput}
                  activeOpacity={0.8}
                  onPress={() =>
                    dropdown?.fieldId === field.id ? closeDropdown() : openDropdown(field.id)
                  }
                >
                  <CustomText
                    style={[styles.dropdownText, !field.type && { color: '#9CA3AF' }]}
                  >
                    {field.type || 'Choose from below'}
                  </CustomText>
                  <DownArrow width={16} height={16} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Mark as Required */}
              <TouchableOpacity
                style={styles.checkboxRow}
                activeOpacity={0.8}
                onPress={() =>
                  handleUpdateCustomField(field.id, 'isRequired', !field.isRequired)
                }
              >
                <View style={[styles.checkbox, field.isRequired && styles.checkboxActive]}>
                  {field.isRequired && (
                    <CustomText style={styles.checkmark}>✓</CustomText>
                  )}
                </View>
                <CustomText style={styles.checkboxLabel}>Mark as Required Field</CustomText>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* Footer */}
        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 20) },
          ]}
        >
          <CustomButton
            title="Close"
            variant="outline"
            onPress={handleClose}
            style={styles.closeBtn}
                  textStyle={styles.closeBtnText}
          />
          <CustomButton
            title="Update"
            onPress={handleUpdate}
            loading={updating}
            style={styles.createBtn}
            textStyle={styles.createBtnText}
          />
        </View>
      </KeyboardAvoidingView>

      {/* ── Dropdown Portal ──────────────────────────────────────────────────── */}
      <Modal
        visible={!!dropdown}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeDropdown}
      >
        <TouchableOpacity
          style={[StyleSheet.absoluteFillObject, { backgroundColor: 'transparent' }]}
          activeOpacity={1}
          onPress={closeDropdown}
        />

        {dropdown && ((() => {
          const { height: screenH } = Dimensions.get('window');
          const safeBottom = Math.max(insets.bottom, 16);
          const availableH = screenH - dropdown.top - safeBottom - 8;
          const listMaxH = Math.min(240, Math.max(availableH, 80));
          return (
            <View
              style={[
                styles.dropdownList,
                { top: dropdown.top, left: dropdown.left, width: dropdown.width },
              ]}
              pointerEvents="box-none"
            >
              <ScrollView
                bounces={false}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                style={{ maxHeight: listMaxH }}
              >
                {FIELD_TYPES.map((type, index) => {
                  const currentField = customFields.find((f) => f.id === dropdown.fieldId);
                  const isSelected = currentField?.type === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.dropdownOption,
                        index === FIELD_TYPES.length - 1 && { borderBottomWidth: 0 },
                        isSelected && styles.dropdownOptionSelected,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => selectType(type)}
                    >
                      <CustomText
                        style={[
                          styles.dropdownOptionText,
                          isSelected && styles.dropdownOptionTextSelected,
                        ]}
                      >
                        {type}
                      </CustomText>
                      {isSelected && (
                        <CustomText style={styles.dropdownCheckmark}>✓</CustomText>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          );
        })())}
      </Modal>
    </View>
  );
};

export default EditContactGroupScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },

  // Fields
// Fields
  fieldLabel: {
    fontSize: 16,
    fontFamily: fonts.families.bold,
    color: '#000',
    marginBottom: 8,
    marginTop: 25,
  },
  textInput: {
    backgroundColor: '#E0F8FB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    fontSize: 12,
    fontFamily: fonts.families.medium,
    color: '#000',
     borderColor: '#99E6EF',
     borderWidth: 1,
  },

  // Logo picker
  fileInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F8FB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#99E6EF',
  },
  fileInputText: {
    fontSize: 13,
    color: '#000',
    fontFamily: fonts.families.medium,
  },
  chooseFileBtn: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chooseFileBtnText: {
    fontSize: 12,
    fontFamily: fonts.families.bold,
    color: '#000',
  },
  selectedFileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 6,
    maxWidth: '60%',
  },
  selectedFileText: {
    fontSize: 12,
    fontFamily: fonts.families.bold,
    color: '#000',
    marginRight: 6,
  },
  clearFileBtn: {
    padding: 2,
  },
  clearFileIcon: {
    fontSize: 14,
    color: '#EF4444',
    fontFamily: fonts.families.bold,
  },

  // Info box
  infoBox: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#FFF',
  },
  infoBoxTitle: {
    fontSize: 13,
    fontFamily: fonts.families.bold,
    color: '#000',
    marginBottom: 6,
  },
  infoBoxDesc: {
    fontSize: 12,
    fontFamily: fonts.families.medium,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 16,
  },
  addFieldBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: '#000',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addFieldBtnText: {
    fontSize: 13,
    fontFamily: fonts.families.bold,
    color: '#000',
  },

  // Custom field card
  customFieldCard: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#FFF',
  },
  customFieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customFieldTitle: {
    fontSize: 14,
    fontFamily: fonts.families.bold,
    color: '#2DADBE',
  },
  removeFieldBtn: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeFieldBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontFamily: fonts.families.bold,
  },

  // Dropdown trigger
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E0F8FB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: '#99E6EF',
  },
  dropdownText: {
    fontSize: 14,
    fontFamily: fonts.families.medium,
    color: '#000',
  },

  // Dropdown list
  dropdownList: {
    position: 'absolute',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownOptionSelected: {
    backgroundColor: '#F0FDFF',
  },
  dropdownOptionText: {
    fontSize: 14,
    fontFamily: fonts.families.medium,
    color: '#000',
  },
  dropdownOptionTextSelected: {
    fontFamily: fonts.families.bold,
    color: '#2DADBE',
  },
  dropdownCheckmark: {
    fontSize: 14,
    color: '#2DADBE',
    fontFamily: fonts.families.bold,
  },

  // Checkbox
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  checkmark: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: fonts.families.extrabold,
  },
  checkboxLabel: {
    fontSize: 13,
    fontFamily: fonts.families.bold,
    color: '#111827',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  closeBtn: {
    flex: 1,
    height: 54,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#000',
  },
  createBtn: {
    flex: 1,
    height: 54,
    backgroundColor: '#000',
    borderRadius: 30,
  },
  createBtnText: {
    color: '#FFF',
    fontFamily: fonts.families.bold,
  },
   closeBtnText:{
    color: '#000',
    fontFamily: fonts.families.bold,
  },
});
