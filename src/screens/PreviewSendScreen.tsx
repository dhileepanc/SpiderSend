import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppToolbar, CustomText, CustomButton, CustomInput } from '../components/common';
import { colors, fonts } from '../theme';
import { AppStackParamList, AppNavigationProp } from '../navigation/types';

const PreviewSendScreen = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<RouteProp<AppStackParamList, 'PreviewSend'>>();
  const insets = useSafeAreaInsets();
  
  const { contacts, template } = route.params;

  // Editable states for the template
  const [subject, setSubject] = useState(template?.subject || '');
  const [message, setMessage] = useState(template?.content || '');

  const variables = [
    { label: 'Name', tag: '{{name}}' },
    { label: 'Email', tag: '{{email}}' },
    { label: 'Company', tag: '{{company_name}}' },
    { label: 'Phone', tag: '{{mobile_number}}' },
    { label: 'Address', tag: '{{address}}' },
  ];

  const handleInsertVariable = (tag: string) => {
    // Simply append to the end for now
    setMessage(prev => prev + (prev.length > 0 && !prev.endsWith(' ') ? ' ' : '') + tag);
  };

  const handleSendNow = () => {
    // Placeholder for send action
    console.log('Sending...', { contacts, subject, message });
  };

  const handleScheduleSend = () => {
    // Placeholder for schedule action
    console.log('Scheduling...', { contacts, subject, message });
  };

  return (
    <View style={styles.root}>
      <AppToolbar title="Preview & Send" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: 100 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {/* Render Contacts List */}
          {contacts.map((contact, index) => (
            <View key={contact.id} style={styles.contactCardContainer}>
              <CustomText style={styles.contactTitle}>Scan Data #{index + 1}</CustomText>
              <View style={styles.contactCard}>
                <View style={styles.row}>
                  <CustomText style={styles.label}>Name:</CustomText>
                  <CustomText style={styles.value}>{contact.name}</CustomText>
                </View>
                <View style={styles.divider} />
                <View style={styles.row}>
                  <CustomText style={styles.label}>Email:</CustomText>
                  <CustomText style={styles.value}>{contact.email}</CustomText>
                </View>
                <View style={styles.divider} />
                <View style={styles.row}>
                  <CustomText style={styles.label}>Company:</CustomText>
                  <CustomText style={styles.value}>{contact.companyName}</CustomText>
                </View>
                <View style={styles.divider} />
                <View style={styles.row}>
                  <CustomText style={styles.label}>Mobile:</CustomText>
                  <CustomText style={styles.value}>{contact.mobileNumber}</CustomText>
                </View>
                <View style={styles.divider} />
                <View style={styles.row}>
                  <CustomText style={styles.label}>Address:</CustomText>
                  <CustomText style={styles.value}>{contact.address}</CustomText>
                </View>
              </View>
            </View>
          ))}

          {/* Template Section */}
          <CustomText style={styles.sectionTitle}>Preview Mail Template</CustomText>

          <CustomText style={styles.inputLabel}>Subject</CustomText>
          <CustomInput
            value={subject}
            onChangeText={setSubject}
            placeholder="Enter Subject"
            inputRowStyle={styles.subjectInputRow}
            inputStyle={styles.subjectInputText}
            containerStyle={styles.inputContainer}
          />

          <CustomText style={styles.inputLabel}>Insert Variable:</CustomText>
          <View style={styles.variablesRow}>
            {variables.map((v) => (
              <TouchableOpacity
                key={v.label}
                style={styles.variablePill}
                onPress={() => handleInsertVariable(v.tag)}
              >
                <CustomText style={styles.variableText}>{v.label}</CustomText>
              </TouchableOpacity>
            ))}
          </View>

          <CustomText style={styles.inputLabel}>Message</CustomText>
          <CustomInput
            value={message}
            onChangeText={setMessage}
            multiline
            inputRowStyle={styles.messageInputRow}
            inputStyle={styles.messageInputText}
            containerStyle={styles.inputContainer}
          />

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <CustomButton
          title="Schedule Send"
          variant="outline"
          onPress={handleScheduleSend}
          style={styles.scheduleBtn}
          textStyle={styles.scheduleBtnText}
        />
        <CustomButton
          title="Send Now"
          onPress={handleSendNow}
          style={styles.sendNowBtn}
          textStyle={styles.sendNowBtnText}
        />
      </View>
    </View>
  );
};

export default PreviewSendScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    padding: 20,
    paddingBottom: 120,
  },
  contactCardContainer: {
    marginBottom: 20,
  },
  contactTitle: {
    fontSize: 14,
    fontFamily: fonts.families.bold,
    color: colors.primary.main,
    marginBottom: 8,
  },
  contactCard: {
    backgroundColor: '#EFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B0E0E6',
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  label: {
    width: 80,
    fontSize: 12,
    fontFamily: fonts.families.medium,
    color: '#9CA3AF',
  },
  value: {
    flex: 1,
    fontSize: 12,
    fontFamily: fonts.families.bold,
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#D1D5DB',
    opacity: 0.5,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.families.bold,
    color: colors.primary.main,
    marginBottom: 16,
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: fonts.families.bold,
    color: '#111827',
    marginBottom: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  subjectInputRow: {
    backgroundColor: '#F3F4F6',
    borderWidth: 0,
    borderRadius: 12,
    height: 48,
  },
  subjectInputText: {
    fontSize: 13,
    color: '#111827',
  },
  variablesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  variablePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#EFFFFF',
    borderWidth: 1,
    borderColor: '#B0E0E6',
  },
  variableText: {
    fontSize: 11,
    fontFamily: fonts.families.bold,
    color: '#111827',
  },
  messageInputRow: {
    backgroundColor: '#F3F4F6',
    borderWidth: 0,
    borderRadius: 12,
    height: 300,
    alignItems: 'flex-start',
    paddingTop: 12,
  },
  messageInputText: {
    height: 280,
    textAlignVertical: 'top',
    fontSize: 13,
    color: '#111827',
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
  scheduleBtn: {
    flex: 1,
    height: 54,
    borderRadius: 30,
    borderColor: '#111827',
  },
  scheduleBtnText: {
    color: '#111827',
    fontFamily: fonts.families.bold,
    fontSize: 15,
  },
  sendNowBtn: {
    flex: 1,
    height: 54,
    borderRadius: 30,
    backgroundColor: '#232232',
  },
  sendNowBtnText: {
    color: '#FFFFFF',
    fontFamily: fonts.families.bold,
    fontSize: 15,
  },
});
