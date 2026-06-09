import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { AppToolbar, CustomText, CustomButton, CustomInput, ConfirmModal } from '../components/common';
import { colors, fonts, spacing } from '../theme';
import { AppNavigationProp } from '../navigation/types';
import { useAuth } from '../hooks';
import { useStatusModal } from '../contexts/StatusModalContext';
import {
  getMailTemplates,
  generateMailTemplate,
  storeMailTemplate,
  deleteMailTemplate,
  MailTemplate,
} from '../services/click2ConnectService';

import { actions, RichEditor, RichToolbar } from 'react-native-pell-rich-editor';

import EditIcon from '../assets/icons/edit.svg';
import DeleteIcon from '../assets/icons/delete.svg';
import AiIcon from '../assets/icons/thundericon.svg';
import CloseIcon from '../assets/icons/cancelicon.svg';

const formatDate = (dateString: string) => {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch (e) {
    return dateString;
  }
};

const MailTemplateScreen = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const { showError, showSuccess } = useStatusModal();

  const [templates, setTemplates] = useState<MailTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  // AI Generation state
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [showGeneratedModal, setShowGeneratedModal] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState({
    template_name: '',
    subject: '',
    content: '',
  });

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

  // Load Templates
  const loadTemplates = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const response = await getMailTemplates(user.id);
      if (response.status && response.data?.templates) {
        setTemplates(response.data.templates);
      } else {
        setTemplates([]);
      }
    } catch (e: any) {
      if (e?.response?.status !== 401) {
        console.error('Failed to load templates', e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadTemplates();
    }
  }, [isFocused, user?.id]);

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) {
      showError('Please enter a prompt to generate a template.');
      return;
    }
    if (!user?.id) return;

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
          Alert.alert('Failed', response.message || 'Generation failed');
        }
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'Failed to generate template');
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
        loadTemplates();
      } else {
        showError(response.message || 'Failed to save template');
      }
    } catch (e: any) {
      showError(e?.message || 'Failed to save template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!user?.id || deletingId === null) return;
    try {
      const res = await deleteMailTemplate(user.id, deletingId);
      if (res.status) {
        showSuccess('Template deleted successfully');
        loadTemplates();
      } else {
        showError(res.message || 'Failed to delete template');
      }
    } catch (e: any) {
      showError(e?.message || 'Error deleting template');
    } finally {
      setDeleteModalVisible(false);
      setDeletingId(null);
    }
  };

  return (
    <View style={styles.container}>
      <AppToolbar title="Mail Template" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <CustomText style={styles.headerTitle}>Mail Templates</CustomText>

          <TouchableOpacity
            style={styles.generateButton}
            onPress={() => {
              setAiPrompt('');
              aiPromptRef.current = '';
              setShowAiModal(true);
            }}
          >
            <CustomText style={styles.generateButtonText}>
              Generate Template With AI
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddMailTemplate')}
          >
            <CustomText style={styles.addButtonText}>Add</CustomText>
          </TouchableOpacity>
        </View>

        {/* Template List */}
        {templates.map((template, index) => (
          <View key={template.id} style={styles.templateCard}>
            <View style={styles.cardHeader}>
              <View style={styles.indexBox}>
                <CustomText style={styles.indexText}>{index + 1}</CustomText>
              </View>
              <CustomText style={styles.dateText}>
                {formatDate(template.created_at)}
              </CustomText>
            </View>

            <CustomText style={styles.templateName}>{template.name}</CustomText>
            <CustomText style={styles.templateMessage} numberOfLines={1}>
              {template.subject}
            </CustomText>

            <View style={styles.cardDivider} />

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => navigation.navigate('EditMailTemplate', { id: template.id })}
              >
                <EditIcon width={16} height={16} />
                <CustomText style={styles.editButtonText}>Edit</CustomText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeleteClick(template.id)}
              >
                <DeleteIcon width={16} height={16} />
                <CustomText style={styles.deleteButtonText}>Delete</CustomText>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {!loading && templates.length === 0 && (
          <CustomText style={styles.emptyText}>No templates found.</CustomText>
        )}
      </ScrollView>

      {/* AI Generate Modal */}
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
                title={generating ? 'Generating...' : 'Generate'}
                onPress={handleGenerate}
                disabled={generating}
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

      <ConfirmModal
        visible={deleteModalVisible}
        title="Delete Template?"
        message="This action cannot be undone. The template will be permanently deleted."
        onCancel={() => setDeleteModalVisible(false)}
        onConfirm={confirmDelete}
        confirmText="Delete"
        loading={loading}
      />
    </View>
  );
};

export default MailTemplateScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    padding: spacing.md,
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: fonts.families.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  generateButton: {
    backgroundColor: '#1C1C28',
    borderRadius: 30,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  generateButtonText: {
    color: colors.neutral.white,
    fontFamily: fonts.families.bold,
    fontSize: 15,
  },
  addButton: {
    backgroundColor: colors.neutral.white,
    borderRadius: 30,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1C1C28',
  },
  addButtonText: {
    color: '#000',
    fontFamily: fonts.families.bold,
    fontSize: 15,
  },
  templateCard: {
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    marginTop: 10
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  indexBox: {
    backgroundColor: '#E5E7FF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#171829',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  indexText: {
    fontFamily: fonts.families.bold,
    fontSize: 12,
    color: '#171829',
  },
  dateText: {
    fontFamily: fonts.families.bold,
    fontSize: 12,
    color: '#9A9A9A',
  },
  templateName: {
    fontFamily: fonts.families.bold,
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: 4,
  },
  templateMessage: {
    fontFamily: fonts.families.regular,
    fontSize: 12,
    color: '#000',
    marginBottom: spacing.sm,
  },
  cardDivider: {
    height: 0.7,
    backgroundColor: '#DADADA',
    marginVertical: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  actionButton: {
    flex: 1,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  editButton: {
    borderColor: '#2DADBE',
    backgroundColor: '#E9FCFF',
    marginRight: spacing.sm,
  },
  editButtonText: {
    fontFamily: fonts.families.bold,
    fontSize: 14,
    color: '#0891B2',
    marginLeft: 6,
  },
  deleteButton: {
    borderColor: '#FF0404',
    backgroundColor: '#FFCCCC',
    marginLeft: spacing.sm,
  },
  deleteButtonText: {
    fontFamily: fonts.families.bold,
    fontSize: 14,
    color: '#FF0404',
    marginLeft: 6,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontFamily: fonts.families.regular,
    color: colors.text.muted,
  },
  // Modal Styles Copied from PreviewExtractedScreen
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
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
    marginBottom: 10,
  },
  aiModalTitle: {
    fontSize: 16,
    fontFamily: fonts.families.bold,
    color: colors.primary.main,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 10,
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
    borderWidth: 1,
  },
  aiCloseBtnText: {
    fontSize: 16,
    color: '#111827',
    fontFamily: fonts.families.bold,
  },
  aiGenerateBtn: {
    fontSize: 16,
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
    fontSize: 16,
    fontFamily: fonts.families.bold,
    color: colors.text.primary,
    marginBottom: 8,
  },

  scanningSubTitle: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: fonts.families.medium,
    color: colors.text.primary,
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
  messageContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
    padding: 16,
    minHeight: 250,
    maxHeight: 320,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 13,
    color: '#111827',
    lineHeight: 20,
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
  fieldLabel: {
    fontSize: 16,
    fontFamily: fonts.families.bold,
    color: '#000',
    marginBottom: 6,
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
});
