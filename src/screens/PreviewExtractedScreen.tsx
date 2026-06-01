import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppToolbar, CustomText, CustomButton, CustomInput } from '../components/common';
import { colors, fonts } from '../theme';
import { AppStackParamList, AppNavigationProp } from '../navigation/types';
import { useAuth } from '../hooks';
import { 
  reScanBusinessCard, 
  getMailTemplates, 
  generateMailTemplate, 
  storeScanData,
  MailTemplate,
  ContactData
} from '../services/click2ConnectService';

import AiIcon from '../assets/icons/aiicon.svg';

const PreviewExtractedScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<RouteProp<AppStackParamList, 'PreviewExtracted'>>();
  const insets = useSafeAreaInsets();
  
  const scanData = route.params?.data;
  const initialFields = scanData?.fields && scanData.fields.length > 0 ? scanData.fields : [{}];

  // Map initial fields to array of contacts
  const [contacts, setContacts] = useState<ContactData[]>(
    initialFields.map((f, i) => ({
      id: Date.now().toString() + i,
      name: f.name || '',
      email: f.email || '',
      companyName: f.company_name || '',
      mobileNumber: f.mobile_number || '',
      address: f.address || '',
    }))
  );

  // Rescan state
  const [rescanning, setRescanning] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mail Templates state
  const [templates, setTemplates] = useState<MailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<MailTemplate | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // AI Generation state
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generating, setGenerating] = useState(false);

  // Fetch mail templates on mount
  const loadTemplates = async () => {
    if (!user?.id) return;
    try {
      const response = await getMailTemplates(user.id);
      if (response.status && response.data?.templates) {
        setTemplates(response.data.templates);
      }
    } catch (e) {
      console.error('Failed to load templates', e);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [user?.id]);

  // Handle re-scan action
  const handleReScan = async () => {
    if (!user?.id || !scanData?.image) {
      Alert.alert('Error', 'Missing user or image data for re-scan.');
      return;
    }
    setRescanning(true);
    try {
      const response = await reScanBusinessCard(user.id, scanData.image);
      if (response.status) {
        const fields = response.data?.data?.fields || response.data?.fields || [{}];
        const newContacts = fields.map((f: any, i: number) => ({
          id: Date.now().toString() + i,
          name: f.name || '',
          email: f.email || '',
          companyName: f.company_name || '',
          mobileNumber: f.mobile_number || '',
          address: f.address || '',
        }));
        setContacts(newContacts);
      } else {
        Alert.alert('Failed', response.message || 'Rescan failed');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to rescan');
    } finally {
      setRescanning(false);
    }
  };

  // Handle generating template with AI
  const handleGenerate = async () => {
    if (!user?.id || !aiPrompt.trim()) return;
    setGenerating(true);
    try {
      const response = await generateMailTemplate(user.id, aiPrompt);
      if (response.status) {
        setShowAiModal(false);
        setAiPrompt('');
        loadTemplates(); // Refresh template list
      } else {
        Alert.alert('Failed', response.message || 'Generation failed');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to generate template');
    } finally {
      setGenerating(false);
    }
  };

  const handleAddRow = () => {
    setContacts([
      ...contacts,
      {
        id: Date.now().toString(),
        name: '',
        email: '',
        companyName: '',
        mobileNumber: '',
        address: '',
      }
    ]);
  };

  const handleDeleteRow = (id: string) => {
    if (contacts.length <= 1) return;
    setContacts(contacts.filter(c => c.id !== id));
  };

  const handleUpdateContact = (id: string, field: keyof ContactData, value: string) => {
    setContacts(contacts.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handlePreviewAndSend = async () => {
    if (!user?.id) return;
    if (!selectedTemplate) {
      Alert.alert('Validation Error', 'Please select a mail template from the dropdown.');
      return;
    }
    
    // Validate contacts
    const invalidIndex = contacts.findIndex(c => !c.name.trim() || !c.email.trim());
    if (invalidIndex !== -1) {
      Alert.alert('Validation Error', `Name and Email are mandatory for Scan Data #${invalidIndex + 1}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await storeScanData(user.id, selectedTemplate.id, contacts);
      if (res.status) {
        navigation.navigate('PreviewSend', {
          contacts,
          template: selectedTemplate
        });
      } else {
        Alert.alert('Error', res.message || 'Failed to save scan data.');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to store scan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <AppToolbar title="Preview extracted" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: 100 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {/* Mail Template Section */}
          <View style={styles.headerRow}>
            <CustomText style={styles.headerLabel}>Select Mail Template</CustomText>
            <TouchableOpacity 
              style={styles.aiButton} 
              activeOpacity={0.8}
              onPress={() => setShowAiModal(true)}
            >
              <AiIcon width={16} height={16} color="#fff" />
              <CustomText style={styles.aiButtonText}>Generate with AI</CustomText>
            </TouchableOpacity>
          </View>

          <View style={{ marginBottom: 24 }}>
            <TouchableOpacity 
              style={styles.dropdownContainer} 
              activeOpacity={0.8}
              onPress={() => setShowTemplateModal(!showTemplateModal)}
            >
              <CustomText style={selectedTemplate ? styles.dropdownSelected : styles.dropdownPlaceholder}>
                {selectedTemplate ? selectedTemplate.name : 'Choose from below'}
              </CustomText>
              <CustomText style={styles.dropdownIcon}>˅</CustomText>
            </TouchableOpacity>

            {showTemplateModal && (
              <View style={styles.dropdownList}>
                <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                  {templates.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedTemplate(item);
                        setShowTemplateModal(false);
                      }}
                    >
                      <CustomText style={styles.dropdownItemText}>{item.name}</CustomText>
                    </TouchableOpacity>
                  ))}
                  {templates.length === 0 && (
                    <CustomText style={styles.emptyText}>No templates found.</CustomText>
                  )}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Dynamic Form Fields Mapping */}
          {contacts.map((contact, index) => {
            const isFirst = index === 0;
            return (
              <View key={contact.id} style={isFirst ? styles.fieldContainer : styles.contactCard}>
                {!isFirst && (
                  <View style={styles.contactCardHeader}>
                    <CustomText style={styles.contactCardTitle}>Scan Data #{index + 1}</CustomText>
                    <TouchableOpacity style={styles.trashBtn} onPress={() => handleDeleteRow(contact.id)}>
                      <CustomText style={styles.trashIconText}>🗑</CustomText>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.labelRow}>
                  <CustomText style={styles.fieldLabel}>Name <CustomText style={{color: 'red'}}>*</CustomText></CustomText>
                </View>
                <CustomInput
                  value={contact.name}
                  onChangeText={(val) => handleUpdateContact(contact.id, 'name', val)}
                  inputRowStyle={styles.customInputRow}
                  inputStyle={styles.customInputText}
                  containerStyle={styles.inputContainer}
                />

                <View style={styles.labelRow}>
                  <CustomText style={styles.fieldLabel}>Email <CustomText style={{color: 'red'}}>*</CustomText></CustomText>
                </View>
                <CustomInput
                  value={contact.email}
                  onChangeText={(val) => handleUpdateContact(contact.id, 'email', val)}
                  keyboardType="email-address"
                  inputRowStyle={styles.customInputRow}
                  inputStyle={styles.customInputText}
                  containerStyle={styles.inputContainer}
                />

                <View style={styles.labelRow}>
                  <CustomText style={styles.fieldLabel}>Company Name</CustomText>
                </View>
                <CustomInput
                  value={contact.companyName}
                  onChangeText={(val) => handleUpdateContact(contact.id, 'companyName', val)}
                  inputRowStyle={styles.customInputRow}
                  inputStyle={styles.customInputText}
                  containerStyle={styles.inputContainer}
                />

                <View style={styles.labelRow}>
                  <CustomText style={styles.fieldLabel}>Mobile Number</CustomText>
                </View>
                <CustomInput
                  value={contact.mobileNumber}
                  onChangeText={(val) => handleUpdateContact(contact.id, 'mobileNumber', val)}
                  keyboardType="phone-pad"
                  inputRowStyle={styles.customInputRow}
                  inputStyle={styles.customInputText}
                  containerStyle={styles.inputContainer}
                />

                <View style={styles.labelRow}>
                  <CustomText style={styles.fieldLabel}>Address</CustomText>
                </View>
                <CustomInput
                  value={contact.address}
                  onChangeText={(val) => handleUpdateContact(contact.id, 'address', val)}
                  multiline
                  inputRowStyle={[styles.customInputRow, styles.textAreaRow]}
                  inputStyle={[styles.customInputText, styles.textAreaText]}
                  containerStyle={styles.inputContainer}
                />
              </View>
            );
          })}

          <CustomButton
            title="Add Row"
            variant="outline"
            onPress={handleAddRow}
            style={styles.addRowButton}
            textStyle={styles.addRowText}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <CustomButton
          title={rescanning ? "Rescanning..." : "Re-Scan"}
          variant="outline"
          onPress={handleReScan}
          disabled={rescanning || isSubmitting}
          style={styles.rescanBtn}
          textStyle={styles.rescanBtnText}
        />
        <CustomButton
          title={isSubmitting ? "Sending..." : "Preview & Send"}
          onPress={handlePreviewAndSend}
          disabled={isSubmitting || rescanning}
          style={styles.previewSendBtn}
          textStyle={styles.previewSendText}
        />
      </View>

      {/* AI Generate Modal */}
      <Modal visible={showAiModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.aiModalCard}>
            <View style={styles.aiModalHeader}>
              <CustomText style={styles.aiModalTitle}>generate template with AI</CustomText>
              <TouchableOpacity onPress={() => setShowAiModal(false)} style={styles.aiCloseIconBtn}>
                <CustomText style={styles.aiCloseIconText}>✕</CustomText>
              </TouchableOpacity>
            </View>
            <CustomInput
              value={aiPrompt}
              onChangeText={setAiPrompt}
              placeholder="Write a few lines - we'll turn it into a perfect email"
              multiline
              inputRowStyle={styles.aiInputRow}
              inputStyle={styles.aiInputText}
              containerStyle={{ marginBottom: 40 }}
            />
            <View style={styles.aiModalFooter}>
              <CustomButton
                title="Close"
                variant="outline"
                onPress={() => setShowAiModal(false)}
                style={styles.aiCloseBtn}
                textStyle={styles.aiCloseBtnText}
              />
              <CustomButton
                title={generating ? "Generating..." : "Generate"}
                onPress={handleGenerate}
                disabled={generating || !aiPrompt.trim()}
                style={styles.aiGenerateBtn}
                textStyle={styles.aiGenerateBtnText}
              />
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

export default PreviewExtractedScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    padding: 20,
    paddingBottom: 100,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLabel: {
    fontSize: 14,
    fontFamily: fonts.families.bold,
    color: '#111827',
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#232232',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  aiButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: fonts.families.medium,
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownPlaceholder: {
    color: '#9CA3AF',
    fontSize: 14,
    fontFamily: fonts.families.medium,
  },
  dropdownSelected: {
    color: '#111827',
    fontSize: 14,
    fontFamily: fonts.families.semibold,
  },
  dropdownIcon: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#374151',
    fontFamily: fonts.families.medium,
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  contactCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  contactCardTitle: {
    fontSize: 15,
    fontFamily: fonts.families.bold,
    color: colors.primary.main,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: fonts.families.bold,
    color: '#111827',
  },
  trashBtn: {
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
    padding: 6,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  trashIconText: {
    fontSize: 12,
    color: '#EF4444',
  },
  inputContainer: {
    marginBottom: 16,
  },
  customInputRow: {
    backgroundColor: '#EFFFFF',
    borderColor: '#B0E0E6',
    borderRadius: 12,
    height: 48,
    borderWidth: 1,
  },
  customInputText: {
    color: '#111827',
    fontSize: 13,
  },
  textAreaRow: {
    height: 80,
    alignItems: 'flex-start',
    paddingTop: 12,
  },
  textAreaText: {
    height: 60,
    textAlignVertical: 'top',
  },
  addRowButton: {
    borderRadius: 30,
    borderColor: '#111827',
    height: 50,
    marginBottom: 20,
    borderStyle: 'dashed',
    borderWidth: 2,
  },
  addRowText: {
    color: '#111827',
    fontFamily: fonts.families.bold,
    fontSize: 15,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  rescanBtn: {
    flex: 1,
    height: 54,
    borderRadius: 30,
    borderColor: '#111827',
  },
  rescanBtnText: {
    color: '#111827',
    fontFamily: fonts.families.bold,
    fontSize: 15,
  },
  previewSendBtn: {
    flex: 1,
    height: 54,
    borderRadius: 30,
    backgroundColor: '#232232',
  },
  previewSendText: {
    color: '#FFFFFF',
    fontFamily: fonts.families.bold,
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    marginVertical: 20,
    fontFamily: fonts.families.medium,
  },
  aiModalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
  },
  aiModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  aiModalTitle: {
    fontSize: 16,
    fontFamily: fonts.families.bold,
    color: colors.primary.main,
  },
  aiCloseIconBtn: {
    backgroundColor: '#FEE2E2',
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  aiCloseIconText: {
    color: '#EF4444',
    fontSize: 14,
    fontFamily: fonts.families.bold,
  },
  aiInputRow: {
    backgroundColor: '#F3F4F6',
    borderWidth: 0,
    borderRadius: 12,
    height: 100,
    alignItems: 'flex-start',
    paddingTop: 12,
  },
  aiInputText: {
    height: 80,
    textAlignVertical: 'top',
    fontSize: 13,
  },
  aiModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  aiCloseBtn: {
    flex: 1,
    borderRadius: 30,
    borderColor: '#111827',
  },
  aiCloseBtnText: {
    color: '#111827',
    fontFamily: fonts.families.bold,
  },
  aiGenerateBtn: {
    flex: 1,
    borderRadius: 30,
    backgroundColor: '#232232',
  },
  aiGenerateBtnText: {
    color: '#fff',
    fontFamily: fonts.families.bold,
  },
});
