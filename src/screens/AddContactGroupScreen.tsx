import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppToolbar, CustomButton, CustomText } from '../components/common';
import { colors, fonts } from '../theme';
import { useAuth } from '../hooks';
import { useStatusModal } from '../contexts/StatusModalContext';
import { createContactGroup } from '../services';
import { Dropdown } from 'react-native-element-dropdown';
import CloseIcon from '../assets/icons/cancelicon.svg';

import { launchImageLibrary } from 'react-native-image-picker';


// ─── Types ────────────────────────────────────────────────────────────────────
interface CustomField {
  id: string;
  label: string;
  type: string;
  isRequired: boolean;
}



// ─── Constants ────────────────────────────────────────────────────────────────
const FIELD_TYPES = ['Text', 'Email', 'Number'];

const toSlug = (label: string) =>
  label.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

// ─── Component ────────────────────────────────────────────────────────────────
const AddContactGroupScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showError, showSuccess } = useStatusModal();

  // Form state
  const [groupName, setGroupName] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [logoFileName, setLogoFileName] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [creating, setCreating] = useState(false);



  // ── Field helpers ───────────────────────────────────────────────────────────
  const handleAddCustomField = () => {
    setCustomFields((prev) => [
      ...prev,
      { id: Date.now().toString(), label: '', type: '', isRequired: false },
    ]);
  };

  const handleRemoveCustomField = (id: string) => {
    setCustomFields((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUpdateCustomField = (id: string, key: keyof CustomField, value: any) => {
    setCustomFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [key]: value } : f))
    );
  };



  // ── Create handler ──────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!groupName.trim()) {
      showError('Please enter a group name.', 'Validation Error');
      return;
    }
    if (!user?.id) {
      showError('User not found. Please log in again.');
      return;
    }
    try {
      setCreating(true);
      const res = await createContactGroup({
        clientId: user.id,
        name: groupName.trim(),
        logo: logoFile,
        fields: customFields.map((f) => ({
          label: f.label,
          slug: toSlug(f.label) || toSlug(f.type),
          type: f.type || 'text',
          required: f.isRequired ? 1 : 0,
        })),
      });
      if (res.status) {
        showSuccess(
          'The group was created successfully. You can now start adding contacts.',
          'Group Created Successfully',
          'mail'
        );
        setTimeout(() => {
          navigation.goBack();
        }, 800);
      } else {
        showError(res.message || 'Failed to create contact group.');
      }
    } catch (e: any) {
      showError(e?.message || 'Failed to create contact group.');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => navigation.goBack();

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

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <AppToolbar title="Add Contact Group" onBackPress={handleClose} />

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
              {logoUri ? 'File selected' : 'No File Chosen'}
            </CustomText>
            <TouchableOpacity style={styles.chooseFileBtn} onPress={handleChooseFile}>
              <CustomText style={styles.chooseFileBtnText}>Choose File</CustomText>
            </TouchableOpacity>
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
              <Dropdown
                style={styles.dropdownInput}
                containerStyle={styles.dropdownList}
                placeholderStyle={[styles.dropdownText, { color: '#9CA3AF' }]}
                selectedTextStyle={styles.dropdownText}
                itemTextStyle={styles.dropdownOptionText}
                activeColor="#F0FDFF"
                data={FIELD_TYPES.map(t => ({ label: t, value: t }))}
                labelField="label"
                valueField="value"
                placeholder="Choose from below"
                value={field.type || null}
                onChange={item => handleUpdateCustomField(field.id, 'type', item.value)}
                maxHeight={240}
              />

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
            title="Create"
            onPress={handleCreate}
            loading={creating}
            style={styles.createBtn}
            textStyle={styles.createBtnText}
          />
        </View>
      </KeyboardAvoidingView>


    </View>
  );
};

export default AddContactGroupScreen;

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
  fieldLabel: {
    fontSize: 16,
    fontFamily: fonts.families.bold,
    color: '#000',
    marginBottom: 8,
    marginTop: 25,
  },
  textInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    fontSize: 12,
    fontFamily: fonts.families.medium,
    color: '#000',
  },

  // Logo picker
  fileInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    justifyContent: 'space-between',
  },
  fileInputText: {
    fontSize: 12,
    color: '#9A9A9A',
    fontFamily: fonts.families.medium,
  },
  chooseFileBtn: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chooseFileBtnText: {
    fontSize: 12,
    fontFamily: fonts.families.bold,
    color: '#111827',
  },

  // Info box
  infoBox: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#DADADA',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFF',
  },
  infoBoxTitle: {
    fontSize: 14,
    fontFamily: fonts.families.bold,
    color: '#000',
    marginBottom: 4,
  },
  infoBoxDesc: {
    fontSize: 12,
    fontFamily: fonts.families.medium,
    color: '#000',
    lineHeight: 18,
    marginBottom: 12,
  },
  addFieldBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: '#171829',
    borderRadius: 92,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addFieldBtnText: {
    fontSize: 12,
    fontFamily: fonts.families.bold,
    color: '#171829',
  },

  // Custom field card
  customFieldCard: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFF',
  },
  customFieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customFieldTitle: {
    fontSize: 16,
    fontFamily: fonts.families.bold,
    color: colors.primary.main,
  },

  // Dropdown trigger
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  dropdownText: {
    fontSize: 14,
    fontFamily: fonts.families.medium,
    color: '#000',
  },

  dropdownList: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  dropdownOptionText: {
    fontSize: 14,
    fontFamily: fonts.families.medium,
    color: '#000',
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
    backgroundColor: '#1E1B4B',
    borderColor: '#0000',
  },
  checkmark: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: fonts.families.extrabold,
  },
  checkboxLabel: {
    fontSize: 13,
    fontFamily: fonts.families.bold,
    color: '#000',
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
  closeBtnText:{
    color: '#000',
    fontFamily: fonts.families.bold,
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
});
