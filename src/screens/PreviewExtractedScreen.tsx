import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Animated,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppToolbar, CustomText, CustomButton, CustomInput } from '../components/common';
import { colors, fonts } from '../theme';
import { AppStackParamList, AppNavigationProp } from '../navigation/types';
import { useAuth } from '../hooks';
import { useStatusModal } from '../contexts/StatusModalContext';
import { Dropdown } from 'react-native-element-dropdown';
import {
  reScanBusinessCard,
  getMailTemplates,
  generateMailTemplate,
  storeScanData,
  storeMailTemplate,
  MailTemplate,
  ContactData
} from '../services/click2ConnectService';
import { actions, RichEditor, RichToolbar } from 'react-native-pell-rich-editor';

import AiIcon from '../assets/icons/thundericon.svg';
import ScanningIcon from '../assets/icons/scanningIcon.svg';
import DownArrowIcon from '../assets/icons/downarrow.svg';
import DeleteIcon from '../assets/icons/delete.svg';
import CloseIcon from '../assets/icons/cancelicon.svg';

const PreviewExtractedScreen = () => {
  const { user } = useAuth();
  const { showError, showSuccess } = useStatusModal();
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

  const [showGeneratedModal, setShowGeneratedModal] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState({
    template_name: '',
    subject: '',
    content: '',
  });
  const [savingTemplate, setSavingTemplate] = useState(false);

  const aiPromptRef = useRef('');
  const generatedRichTextRef = useRef<RichEditor>(null);

  // Animations
  const spinAnim1 = useRef(new Animated.Value(0)).current;
  const spinAnim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (generating) {
      Animated.loop(
        Animated.timing(spinAnim1, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        })
      ).start();
      Animated.loop(
        Animated.timing(spinAnim2, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinAnim1.stopAnimation();
      spinAnim2.stopAnimation();
      spinAnim1.setValue(0);
      spinAnim2.setValue(0);
    }
  }, [generating]);

  const spin1 = spinAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const spin2 = spinAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  // Fetch mail templates on mount
  const loadTemplates = async () => {
    if (!user?.id) return;
    try {
      const response = await getMailTemplates(user.id);
      if (response.status && response.data?.templates) {
        setTemplates(response.data.templates);
      }
    } catch (e: any) {
      if (e?.response?.status !== 401) {
        console.error('Failed to load templates', e);
      }
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [user?.id]);

  const lineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (rescanning) {
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
  }, [rescanning]);

  // Handle re-scan action
  const handleReScan = async () => {
    if (!user?.id || !scanData?.image) {
      showError('Missing user or image data for re-scan.');
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
        showError(response.message || 'Rescan failed');
      }
    } catch (e: any) {
      showError(e?.message || 'Failed to rescan');
    } finally {
      setRescanning(false);
    }
  };

  // Handle generating template with AI
  const handleGenerate = async () => {
    if (!user?.id || !aiPrompt.trim()) return;

    setShowAiModal(false);
    setShowGeneratedModal(false);

    setGenerating(true);
    try {
      const response = await generateMailTemplate(user.id, aiPrompt);
      if (response.status) {
        setGeneratedTemplate({
          template_name: response.data.template_name || '',
          subject: response.data.subject || '',
          content: response.data.content || '',
        });
        setTimeout(() => {
          generatedRichTextRef.current?.setContentHTML(response.data.content || '');
        }, 100);
        setShowGeneratedModal(true);
      } else {
        showError(response.message || 'Generation failed');
      }
    } catch (e: any) {
      showError(e?.message || 'Failed to generate template');
    } finally {
      setGenerating(false);
    }
  };

  const handleReGenerate = async () => {
    const currentPrompt = aiPromptRef.current;
    if (!user?.id || !currentPrompt.trim()) return;

    setTimeout(async () => {
      setGenerating(true);
      try {
        const response = await generateMailTemplate(user.id, currentPrompt);
        if (response.status) {
          setGeneratedTemplate({
            template_name: response.data.template_name || '',
            subject: response.data.subject || '',
            content: response.data.content || '',
          });
          setTimeout(() => {
            generatedRichTextRef.current?.setContentHTML(response.data.content || '');
          }, 100);
          setShowGeneratedModal(true);
        } else {
          showError(response.message || 'Generation failed');
        }
      } catch (e: any) {
        showError(e?.message || 'Failed to generate template');
      } finally {
        setGenerating(false);
      }
    }, 300);
  };

  const handleSaveTemplate = async () => {
    if (!user?.id) return;
    setSavingTemplate(true);
    try {
      const response = await storeMailTemplate(
        user.id,
        generatedTemplate.template_name,
        generatedTemplate.subject,
        generatedTemplate.content
      );
      if (response.status) {
        showSuccess('Template saved successfully!');
        setShowGeneratedModal(false);
        loadTemplates(); // Refresh template list
      } else {
        showError(response.message || 'Failed to save template');
      }
    } catch (e: any) {
      showError(e?.message || 'Failed to save template');
    } finally {
      setSavingTemplate(false);
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
      showError('Please select a mail template from the dropdown.');
      return;
    }

    // Validate contacts
    const invalidIndex = contacts.findIndex(c => !c.name.trim() || !c.email.trim());
    if (invalidIndex !== -1) {
      showError(`Name and Email are mandatory for Scan Data #${invalidIndex + 1}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await storeScanData(user.id, selectedTemplate.id, contacts);
      if (res.status) {
        const clickToConnectId = res.click_to_connect_id
        navigation.navigate('PreviewSend', {
          contacts,
          template: selectedTemplate,
          clickToConnectId,
        });
      } else {
        showError(res.message || 'Failed to save scan data.');
      }
    } catch (e: any) {
      console.log('API Error:', e?.response?.data);

      const apiError = e?.response?.data;

      if (apiError?.errors) {
        const firstErrorKey = Object.keys(apiError.errors)[0];
        const firstErrorMessage = apiError.errors[firstErrorKey][0];

        showError(firstErrorMessage);
      } else {
        showError(
          apiError?.message || 'Failed to store scan data'
        );
      }
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
    onPress={() => {
      setAiPrompt('');
      aiPromptRef.current = '';
      setShowAiModal(true);
    }}
  >
    <AiIcon width={16} height={16} color="#fff" />
    <CustomText style={styles.aiButtonText}>Generate with AI</CustomText>
  </TouchableOpacity>
</View>

<Dropdown
  style={styles.dropdown}
  containerStyle={styles.dropdownContainer}
  placeholderStyle={styles.dropdownPlaceholder}
  selectedTextStyle={styles.dropdownSelected}
  itemTextStyle={styles.dropdownItemText}
  activeColor="#F3F4F6"
  data={templates.map(t => ({ label: t.name, value: t.id, raw: t }))}
  labelField="label"
  valueField="value"
  placeholder="Choose from below"
  value={selectedTemplate?.id ?? null}
  onChange={item => setSelectedTemplate(item.raw)}
  maxHeight={220}
/>

          {/* Dynamic Form Fields Mapping */}
          {contacts.map((contact, index) => {
            const isFirst = index === 0;
            return (
              <View key={contact.id} style={isFirst ? styles.fieldContainer : styles.contactCard}>
                {!isFirst && (
                  <View style={styles.contactCardHeader}>
                    <CustomText style={styles.contactCardTitle}>Scan Data #{index + 1}</CustomText>
                    <TouchableOpacity style={styles.trashBtn} onPress={() => handleDeleteRow(contact.id)}>
                      <DeleteIcon width={20} height={20}/>
                    </TouchableOpacity>
                  </View>
                )}
                {isFirst && contacts.length > 1 && (
                  <View style={[styles.contactCardHeader, { marginBottom: 12 }]}>
                    <CustomText style={styles.contactCardTitle}>Scan Data #1</CustomText>
                    <TouchableOpacity style={styles.trashBtn} onPress={() => handleDeleteRow(contact.id)}>
                      <DeleteIcon width={20} height={20}/>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.labelRow}>
                  <CustomText style={styles.fieldLabel}>Name <CustomText style={{ color: 'red' }}>*</CustomText></CustomText>
                </View>
                <CustomInput
                  value={contact.name}
                  onChangeText={(val) => handleUpdateContact(contact.id, 'name', val)}
                  inputRowStyle={styles.customInputRow}
                  inputStyle={styles.customInputText}
                  containerStyle={styles.inputContainer}
                />

                <View style={styles.labelRow}>
                  <CustomText style={styles.fieldLabel}>Email <CustomText style={{ color: 'red' }}>*</CustomText></CustomText>
                </View>
                <CustomInput
                  value={contact.email}
                  onChangeText={(val) => handleUpdateContact(contact.id, 'email', val)}
                  keyboardType="email-address"
                  inputRowStyle={styles.customInputRow}
                  autoCapitalize="none"
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

      <Modal visible={showAiModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.aiModalCard}>
            <View style={styles.aiModalHeader}>
              <CustomText style={styles.aiModalTitle}>Generate template with AI</CustomText>
              <TouchableOpacity onPress={() => setShowAiModal(false)}>
                <CloseIcon width={34} height={34} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalDivider} />
            <CustomInput
              value={aiPrompt}
              onChangeText={(val) => {
                setAiPrompt(val);
                aiPromptRef.current = val;
              }}
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

      {/* Generated Modal */}
      <Modal visible={showGeneratedModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.aiModalCard, { maxHeight: '90%', flexShrink: 1 }]}>
            <View style={styles.aiModalHeader}>
              <CustomText style={styles.aiModalTitle}>Generated Template</CustomText>
              <TouchableOpacity onPress={() => setShowGeneratedModal(false)}>
                <CloseIcon width={34} height={34} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalDivider} />

            <ScrollView style={{ flexShrink: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <CustomText style={styles.fieldLabel}>Template Name</CustomText>
              <CustomInput
                value={generatedTemplate.template_name}
                onChangeText={(val) => setGeneratedTemplate({ ...generatedTemplate, template_name: val })}
                inputRowStyle={styles.customInputRow}
                inputStyle={styles.customInputText}
                containerStyle={styles.inputContainer}
              />

              <CustomText style={styles.fieldLabel}>Subject</CustomText>
              <CustomInput
                value={generatedTemplate.subject}
                onChangeText={(val) => setGeneratedTemplate({ ...generatedTemplate, subject: val })}
                inputRowStyle={styles.customInputRow}
                inputStyle={styles.customInputText}
                containerStyle={styles.inputContainer}
              />

              <View style={styles.messageCard}>
                <View style={{ marginBottom: 8 }}>
                  <CustomText style={styles.fieldLabel}>Message</CustomText>
                </View>

                <View style={styles.richTextContainer}>
                  <RichToolbar
                    editor={generatedRichTextRef}
                    actions={[
                      actions.setBold,
                      actions.setItalic,
                      actions.setUnderline,
                      actions.heading1,
                      actions.insertBulletsList,
                      actions.insertOrderedList,
                      actions.undo,
                      actions.redo,
                    ]}
                    iconTint="#6B7280"
                    selectedIconTint={colors.primary.main}
                    style={styles.richToolbar}
                  />
                  <ScrollView scrollEnabled={false} style={styles.richEditorWrapper}>
                    <RichEditor
                      ref={generatedRichTextRef}
                      initialContentHTML={generatedTemplate.content || '<p></p>'}
                      onChange={(val) => setGeneratedTemplate({ ...generatedTemplate, content: val })}
                      placeholder="AI generated content..."
                      initialHeight={200}
                      useContainer={true}
                      editorStyle={{
                        backgroundColor: '#F3F4F6',
                        color: '#111827',
                      }}
                    />
                  </ScrollView>
                </View>
              </View>
            </ScrollView>

            <View style={[styles.aiModalFooter, { paddingTop: 10 }]}>
              <CustomButton
                title="Re-Generate"
                variant="outline"
                onPress={handleReGenerate}
                disabled={generating}
                style={styles.aiCloseBtn}
                textStyle={styles.aiCloseBtnText}
              />
              <CustomButton
                title={savingTemplate ? 'Saving...' : 'Save Template'}
                onPress={handleSaveTemplate}
                disabled={savingTemplate}
                style={styles.aiGenerateBtn}
                textStyle={styles.aiGenerateBtnText}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Generating Loader */}
      <Modal visible={generating} transparent animationType="fade">
        <View style={styles.modalOverlay1}>
          <View style={[styles.scanningModalCard, { paddingVertical: 40 }]}>
            <View style={styles.scanningContent}>
              <View style={{ width: 60, height: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
                <Animated.View
                  style={{
                    position: 'absolute',
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    borderWidth: 6,
                    borderColor: 'transparent',
                    borderTopColor: '#171829',
                    borderRightColor: '#171829',
                    transform: [{ rotate: spin1 }],
                  }}
                />
                <Animated.View
                  style={{
                    position: 'absolute',
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    borderWidth: 6,
                    borderColor: 'transparent',
                    borderBottomColor: '#2BA6B5',
                    borderLeftColor: '#2BA6B5',
                    transform: [{ rotate: spin2 }],
                  }}
                />
              </View>
              <CustomText style={styles.scanningTitle}>Generating...!</CustomText>
              <CustomText style={styles.scanningSubTitle}>
                Please wait while AI generate the{'\n'}template
              </CustomText>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rescanning Loader */}
      <Modal visible={rescanning} transparent animationType="fade">
        <View style={styles.modalOverlay1}>
          <View style={styles.scanningModalCard}>
            <View style={styles.scanningContent}>
              <View style={styles.scannerIconWrapper}>
                <ScanningIcon width={100} height={100} />
              </View>

              <CustomText style={styles.scanningTitle}>
                Rescanning Your Card
              </CustomText>

              <CustomText style={styles.scanningSubTitle}>
                Please wait while we extract the information from{'\n'}
                your business card
              </CustomText>

              <View style={styles.lineLoaderContainer}>
                <Animated.View
                  style={[
                    styles.lineLoaderBar,
                    {
                      left: lineAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '70%'],
                      }),
                    },
                  ]}
                />
              </View>

              <CustomText style={styles.extractingText}>
                Extracting Card Details....
              </CustomText>
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
    fontSize: 16,
    fontFamily: fonts.families.bold,
    color: '#000',
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#171829",
    borderRadius: 20,
    gap: 6,
  },
  aiButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: fonts.families.bold,
  },
 dropdown: {
  backgroundColor: '#F3F4F6',
  borderRadius: 12,
  paddingHorizontal: 16,
  height: 48,
  marginBottom: 24,
},
dropdownContainer: {
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
dropdownPlaceholder: {
  fontSize: 12,
  fontFamily: fonts.families.medium,
  color: '#9CA3AF',
},
dropdownSelected: {
  fontSize: 14,
  fontFamily: fonts.families.bold,
  color: '#111827',
},
dropdownItemText: {
  fontSize: 14,
  fontFamily: fonts.families.medium,
  color: '#111827',
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
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  addRowText: {
    color: '#111827',
    fontFamily: fonts.families.bold,
    fontSize: 15,
    textAlign: 'center',
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
    borderWidth: 1,
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
    backgroundColor: '#171829',
  },
  previewSendText: {
    color: '#FFFFFF',
    fontFamily: fonts.families.bold,
    fontSize: 16,
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

  modalOverlay1: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  scanningModalCard: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
  },

  scanningContent: {
    alignItems: 'center',
  },

  scannerIconWrapper: {
    marginBottom: 20,
  },

  scanningTitle: {
    fontSize: 22,
    fontFamily: fonts.families.semibold,
    color: colors.text.primary,
    marginBottom: 8,
  },

  scanningSubTitle: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 24,
  },

  lineLoaderContainer: {
    width: '100%',
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 16,
  },

  lineLoaderBar: {
    position: 'absolute',
    width: '30%',
    height: '100%',
    backgroundColor: colors.primary.main,
    borderRadius: 10,
  },

  extractingText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 10,
  },
  messageCard: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 10,
    marginTop: 4,
  },
  richTextContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  richToolbar: {
    backgroundColor: '#E5E7EB',
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
  },
  richEditorWrapper: {
    minHeight: 200,
  },
});