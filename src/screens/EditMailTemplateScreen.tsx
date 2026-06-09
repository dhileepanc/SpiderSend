import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppToolbar, CustomText, CustomInput, CustomButton } from '../components/common';
import { colors, fonts, spacing } from '../theme';
import { useAuth } from '../hooks';
import { useStatusModal } from '../contexts/StatusModalContext';
import { getMailTemplateDetails, updateMailTemplate } from '../services/click2ConnectService';
import { AppStackParamList } from '../navigation/types';
import { actions, RichEditor, RichToolbar } from 'react-native-pell-rich-editor';

const EditMailTemplateScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AppStackParamList, 'EditMailTemplate'>>();
  const templateId = route.params?.id;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showError, showSuccess } = useStatusModal();

  const [templateName, setTemplateName] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const richTextRef = useRef<RichEditor>(null);

  useEffect(() => {
    const fetchTemplateDetails = async () => {
      if (!user?.id || !templateId) return;
      try {
        const response = await getMailTemplateDetails(user.id, templateId);
        if (response.status) {
          const template = response.data?.template || response.data || response;
          setTemplateName(template.name || template.template_name || '');
          setSubject(template.subject || '');
          setMessage(template.content || '');
          setTimeout(() => {
            richTextRef.current?.setContentHTML(template.content || '');
          }, 100);
        } else {
          showError(response.message || 'Failed to fetch template details.');
          navigation.goBack();
        }
      } catch (e: any) {
        showError(e?.message || 'Error fetching template details.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    fetchTemplateDetails();
  }, [user?.id, templateId]);

  const handleUpdate = async () => {
    if (!templateName.trim() || !subject.trim() || !message.trim()) {
      showError('Please fill out all fields.');
      return;
    }

    if (!user?.id || !templateId) return;

    setIsSubmitting(true);
    try {
      const response = await updateMailTemplate(
        user.id,
        templateId,
        templateName,
        subject,
        message
      );

      if (response.status) {
        showSuccess('Template updated successfully!');
        navigation.goBack();
      } else {
        showError(response.message || 'Failed to update template.');
      }
    } catch (e: any) {
      showError(e?.message || 'Failed to update template.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppToolbar title="Edit Mail Template" onBackPress={() => navigation.goBack()} />
        <View style={styles.loaderContainer}>
          <CustomText style={styles.loadingText}>Loading...</CustomText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppToolbar title="Edit Mail Template" onBackPress={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Template Name */}
          <View style={styles.inputGroup}>
            <CustomText style={styles.label}>Mail Template</CustomText>
            <CustomInput
              value={templateName}
              onChangeText={setTemplateName}
              placeholder="Enter Template Name"
              inputRowStyle={styles.inputRow}
              inputStyle={styles.inputText}
              placeholderTextColor="#A0A0A0"
            />
          </View>

          {/* Subject */}
          <View style={styles.inputGroup}>
            <CustomText style={styles.label}>Subject</CustomText>
            <CustomInput
              value={subject}
              onChangeText={setSubject}
              placeholder="Enter Subject"
              inputRowStyle={styles.inputRow}
              inputStyle={styles.inputText}
              placeholderTextColor="#A0A0A0"
            />
          </View>

          {/* Message */}
          <View style={styles.inputGroup}>
            <CustomText style={styles.label}>Message</CustomText>
            <View style={styles.richTextContainer}>
              <RichToolbar
                editor={richTextRef}
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
                  ref={richTextRef}
                  initialContentHTML={message || ''}
                  onChange={(val) => setMessage(val)}
                  placeholder="Hello {{name}},"
                  initialHeight={200}
                  useContainer={true}
                  editorStyle={{
                    backgroundColor: '#F5F5F5',
                    color: '#111827',
                  }}
                />
              </ScrollView>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Save Button */}
      <View style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <CustomButton
          title={isSubmitting ? 'Updating...' : 'Update'}
          onPress={handleUpdate}
          disabled={isSubmitting}
          style={styles.saveBtn}
          textStyle={styles.saveBtnText}
        />
      </View>
    </View>
  );
};

export default EditMailTemplateScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: fonts.families.regular,
    fontSize: 16,
    color: colors.text.secondary,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontFamily: fonts.families.bold,
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  inputRow: {
    backgroundColor: '#F5F5F5',
    borderWidth: 0,
    borderRadius: 8,
    height: 52,
  },
  inputText: {
    fontFamily: fonts.families.regular,
    fontSize: 14,
    color: colors.text.primary,
  },
  richTextContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  richToolbar: {
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  richEditorWrapper: {
    minHeight: 200,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.background.default,
  },
  saveBtn: {
    backgroundColor: '#1C1C28',
    borderRadius: 30,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    fontFamily: fonts.families.bold,
    fontSize: 16,
    color: colors.neutral.white,
  },
});
