import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppToolbar, CustomButton, CustomText } from '../components/common';
import { colors, fonts } from '../theme';
import { useAuth } from '../hooks';
import { useStatusModal } from '../contexts/StatusModalContext';
import { getMailTemplates, MailTemplate } from '../services/click2ConnectService';
import { getContactGroupList, ContactGroup } from '../services/contactGroupService';
import { directSendPost } from '../services/directSendService';
import { actions, RichEditor, RichToolbar } from 'react-native-pell-rich-editor';
import { Dropdown } from 'react-native-element-dropdown';

import CalenderIcon from '../assets/icons/calendericon.svg';
import TickIcon from '../assets/icons/tickicon.svg';
import CloseIcon from '../assets/icons/cancelicon.svg';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const pad = (n: number) => String(n).padStart(2, '0');

const cleanHtml = (html: any): string => {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<span[^>]*style=["'][^"']*display\s*:\s*none[^"']*["'][^>]*>.*?<\/span>/gi, '')
    .replace(/<span[^>]*style=["'][^"']*display:\s*none[^"']*["'][^>]*>\/span>/gi, '')
    .trim();
};

const DirectSendScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { showError } = useStatusModal();

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [scheduling, setScheduling] = useState(false);

  const [templates, setTemplates] = useState<MailTemplate[]>([]);
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  
  const [selectedTemplate, setSelectedTemplate] = useState<MailTemplate | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<ContactGroup | null>(null);
  
  const [sendType, setSendType] = useState<'direct' | 'individual'>('direct');
  const [individualEmails, setIndividualEmails] = useState('');

  const [templateName, setTemplateName] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('Hello {{name}},');
  
  const richTextRef = useRef<RichEditor>(null);
  const scrollRef = useRef<ScrollView>(null);
  
  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showScheduledSuccess, setShowScheduledSuccess] = useState(false);
  const [showSendSuccess, setShowSendSuccess] = useState(false);

  // Schedule Calendar State
  const [displayDate, setDisplayDate] = useState('');
  const now = new Date();
  const [viewDate, setViewDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [selDay, setSelDay] = useState(now.getDate());
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1);
  const [selYear, setSelYear] = useState(now.getFullYear());
  
  let currentHour = now.getHours();
  const [isPM, setIsPM] = useState(currentHour >= 12);
  const [selHour12, setSelHour12] = useState(currentHour % 12 || 12);
  const [selMinute, setSelMinute] = useState(now.getMinutes());

  const successTimeoutRef = useRef<NodeJS.Timeout>();


  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        if (!user?.id) return;
        try {
          setLoading(true);
          const [tempRes, groupRes] = await Promise.all([
            getMailTemplates(user.id),
            getContactGroupList(user.id)
          ]);
          
          if (tempRes.status && tempRes.data?.templates) {
            setTemplates(tempRes.data.templates);
          }
          if (groupRes.status && groupRes.data) {
            setGroups(groupRes.data);
          }
        } catch (e: any) {
          showError(e?.message || 'Failed to load initial data');
        } finally {
          setLoading(false);
        }
      };

      loadData();

      // Reset form state when the screen comes into focus
      setSelectedTemplate(null);
      setSelectedGroup(null);
      setSendType('direct');
      setIndividualEmails('');
      setTemplateName('');
      setSubject('');
      setMessage('Hello {{name}},');
      // Small timeout to ensure the ref is ready
      setTimeout(() => {
        richTextRef.current?.setContentHTML('Hello {{name}},');
      }, 100);
    }, [user?.id])
  );

  const SEND_TYPE_OPTIONS = [
    { label: 'Direct Send', value: 'direct' },
    { label: 'Individual Send', value: 'individual' },
  ];

  const handleTemplateSelect = (t: MailTemplate) => {
    setSelectedTemplate(t);
    setTemplateName(t.name);
    setSubject(t.subject);
    const cleanedHtml = cleanHtml(t.content);
    setMessage(cleanedHtml);
    richTextRef.current?.setContentHTML(cleanedHtml);
  };

  const validateForm = () => {
    if (sendType === 'direct' && !selectedGroup) return 'Please select a contact group.';
    if (sendType === 'individual' && !individualEmails.trim()) return 'Please enter at least one email address.';
    if (!templateName.trim()) return 'Please enter a template name.';
    if (!subject.trim()) return 'Please enter a subject.';
    if (!message.trim()) return 'Please enter a message.';
    return null;
  };

  const handleSendNow = async () => {
    const error = validateForm();
    if (error) return showError(error);
    if (!user?.id) return;

    setSending(true);
    try {
      const res = await directSendPost({
        clientId: user.id,
        type: sendType,
        cgId: sendType === 'direct' ? selectedGroup!.id : 0,
        name: templateName,
        subject,
        content: message,
        mailCount: 1,
        isScheduled: 0,
        ...(sendType === 'individual' && { individualMails: individualEmails }),
      });

      if (res.status) {
        setShowSendSuccess(true);
        successTimeoutRef.current = setTimeout(() => {
          setShowSendSuccess(false);
          navigation.navigate('Home' as any);
        }, 4000);
      } else {
        showError(res.message || 'Failed to send campaign');
      }
    } catch (e: any) {
      showError(e?.message || 'Error sending campaign');
    } finally {
      setSending(false);
    }
  };

  // ── Calendar Helpers ────────────────────────────────────────────────────────
  const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month - 1, 1).getDay();

  const generateCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth() + 1;
    const daysInCurrentMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const daysInPrevMonth = getDaysInMonth(year, month - 1 === 0 ? 12 : month - 1);

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: daysInPrevMonth - firstDay + i + 1, type: 'prev' });
    }
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      days.push({ day: i, type: 'current' });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, type: 'next' });
    }
    return days;
  };

  const calendarDays = generateCalendarDays();

  const handleDaySelect = (d: any) => {
    if (d.type === 'prev') {
      const prevMonthDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
      setViewDate(prevMonthDate);
      setSelMonth(prevMonthDate.getMonth() + 1);
      setSelYear(prevMonthDate.getFullYear());
    } else if (d.type === 'next') {
      const nextMonthDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
      setViewDate(nextMonthDate);
      setSelMonth(nextMonthDate.getMonth() + 1);
      setSelYear(nextMonthDate.getFullYear());
    } else {
      setSelMonth(viewDate.getMonth() + 1);
      setSelYear(viewDate.getFullYear());
    }
    setSelDay(d.day);
  };

  const adjHour = (dir: number) => {
    let newH = selHour12 + dir;
    if (newH > 12) newH = 1;
    if (newH < 1) newH = 12;
    setSelHour12(newH);
  };
  const adjMin = (dir: number) => {
    let newM = selMinute + dir;
    if (newM > 59) newM = 0;
    if (newM < 0) newM = 59;
    setSelMinute(newM);
  };

  const handleCalendarConfirm = () => {
    setDisplayDate(`${pad(selDay)}-${pad(selMonth)}-${selYear} ${selHour12}:${pad(selMinute)} ${isPM ? 'PM' : 'AM'}`);
    setShowCalendarModal(false);
  };

  const handleScheduleAction = async () => {
    const error = validateForm();
    if (error) return showError(error);
    if (!displayDate) return showError('Please select a date and time.', 'Validation');
    if (!user?.id) return;

    let hour24 = selHour12;
    if (isPM && hour24 !== 12) hour24 += 12;
    if (!isPM && hour24 === 12) hour24 = 0;
    const scheduledAt = `${selYear}-${pad(selMonth)}-${pad(selDay)} ${pad(hour24)}:${pad(selMinute)}:00`;

    setScheduling(true);
    try {
      const res = await directSendPost({
        clientId: user.id,
        type: sendType,
        cgId: sendType === 'direct' ? selectedGroup!.id : 0,
        name: templateName,
        subject,
        content: message,
        mailCount: 1,
        isScheduled: 1,
        scheduledAt,
        ...(sendType === 'individual' && { individualMails: individualEmails }),
      });

      if (res.status) {
        setShowScheduleModal(false);
        setShowScheduledSuccess(true);
        successTimeoutRef.current = setTimeout(() => {
          setShowScheduledSuccess(false);
          navigation.navigate('Home' as any);
        }, 4000);
      } else {
        showError(res.message || 'Failed to schedule campaign');
      }
    } catch (e: any) {
      showError(e?.message || 'Error scheduling campaign');
    } finally {
      setScheduling(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppToolbar title="Direct Send" />

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
            keyboardShouldPersistTaps="handled"
          >
            {/* Send Type */}
            <CustomText style={styles.label}>Send Type</CustomText>
            <Dropdown
              style={styles.dropdown}
              containerStyle={styles.dropdownContainer}
              placeholderStyle={styles.dropdownPlaceholder}
              selectedTextStyle={styles.dropdownSelected}
              itemTextStyle={styles.dropdownItemText}
              activeColor={colors.background.inputBg}
              data={SEND_TYPE_OPTIONS}
              labelField="label"
              valueField="value"
              placeholder="Choose send type"
              value={sendType}
              onChange={item => {
                setSendType(item.value as 'direct' | 'individual');
                setSelectedGroup(null);
                setIndividualEmails('');
              }}
              maxHeight={120}
            />

            {/* Select Mail Template */}
            <CustomText style={styles.label}>Select Mail Template</CustomText>
            <Dropdown
              style={styles.dropdown}
              containerStyle={styles.dropdownContainer}
              placeholderStyle={styles.dropdownPlaceholder}
              selectedTextStyle={styles.dropdownSelected}
              itemTextStyle={styles.dropdownItemText}
              activeColor={colors.background.inputBg}
              data={templates.map(t => ({ label: t.name, value: t.id, raw: t }))}
              labelField="label"
              valueField="value"
              placeholder="Choose from below"
              value={selectedTemplate?.id ?? null}
              onChange={item => handleTemplateSelect(item.raw)}
              maxHeight={220}
            />

            {/* Select Contact Group — Direct Send only */}
            {sendType === 'direct' && (
              <>
                <CustomText style={styles.label}>Select contact group</CustomText>
                <Dropdown
                  style={styles.dropdown}
                  containerStyle={styles.dropdownContainer}
                  placeholderStyle={styles.dropdownPlaceholder}
                  selectedTextStyle={styles.dropdownSelected}
                  itemTextStyle={styles.dropdownItemText}
                  activeColor={colors.background.inputBg}
                  data={groups.map(g => ({ label: g.name, value: g.id, raw: g }))}
                  labelField="label"
                  valueField="value"
                  placeholder="Choose from below"
                  value={selectedGroup?.id ?? null}
                  onChange={item => setSelectedGroup(item.raw)}
                  maxHeight={220}
                />
              </>
            )}

            {/* Email Recipients — Individual Send only */}
            {sendType === 'individual' && (
              <>
                <CustomText style={styles.label}>Email Recipients</CustomText>
                <TextInput
                  style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 14 }]}
                  placeholder={`Enter emails separated by commas\ne.g. a@example.com, b@example.com`}
                  placeholderTextColor={colors.text.muted}
                  value={individualEmails}
                  onChangeText={setIndividualEmails}
                  multiline
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </>
            )}

            {/* Template Name */}
            <CustomText style={styles.label}>Template Name</CustomText>
            <TextInput
              style={styles.input}
              placeholder="Enter Template Name"
              placeholderTextColor={colors.text.muted}
              value={templateName}
              onChangeText={setTemplateName}
            />

            {/* Subject */}
            <CustomText style={styles.label}>Subject</CustomText>
            <TextInput
              style={styles.input}
              placeholder="Enter Subject"
              placeholderTextColor={colors.text.muted}
              value={subject}
              onChangeText={setSubject}
            />

            {/* Message Rich Text */}
            <View style={styles.messageCard}>
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
                    initialContentHTML={message}
                    onChange={setMessage}
                    placeholder="Type your message here..."
                    initialHeight={200}
                    useContainer={true}
                    editorStyle={{
                      backgroundColor: colors.background.inputBg,
                      color: colors.text.primary,
                    }}
                    onFocus={() => {
                      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
                    }}
                  />
                </ScrollView>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* Footer Buttons */}
      {!loading && (
        <View style={[styles.footer, { paddingBottom: insets.bottom || 24 }]}>
          <CustomButton
            title="Schedule Send"
            variant="outline"
            onPress={() => setShowScheduleModal(true)}
            disabled={sending || scheduling}
            style={styles.outlineBtn}
            textStyle={styles.outlineBtnText}
          />
          <CustomButton
            title={sending ? "Sending..." : "Send Now"}
            onPress={handleSendNow}
            disabled={sending || scheduling}
            style={styles.solidBtn}
          />
        </View>
      )}

      {/* ── Schedule Email Modal (with Input) ────────────────────────────────── */}
      <Modal visible={showScheduleModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.scheduleModalCard}>
            {/* Header */}
            <View style={styles.scheduleModalHeader}>
              <CustomText style={styles.scheduleModalTitle}>Schedule Email</CustomText>
              <TouchableOpacity onPress={() => setShowScheduleModal(false)}>
                <CloseIcon width={34} height={34} />
              </TouchableOpacity>
            </View>

            <CustomText style={styles.scheduleModalSubtitle}>Select date & time</CustomText>

            {/* Mock Text Input launching Calendar */}
            <TouchableOpacity style={styles.dateInputRow} onPress={() => setShowCalendarModal(true)}>
              <TextInput
                style={styles.dateInput}
                placeholder="DD-MM-YY  HH:MM AM/PM"
                placeholderTextColor="#9CA3AF"
                value={displayDate}
                editable={false}
                pointerEvents="none"
              />
              <CalenderIcon width={20} height={19} />
            </TouchableOpacity>

            <View style={styles.scheduleFooter}>
              <CustomButton
                title="Cancel"
                variant="outline"
                onPress={() => setShowScheduleModal(false)}
                style={styles.cancelBtn}
                textStyle={styles.cancelBtnText}
              />
              <CustomButton
                title={scheduling ? 'Scheduling...' : 'Schedule'}
                onPress={handleScheduleAction}
                disabled={scheduling}
                style={styles.confirmScheduleBtn}
                textStyle={styles.confirmScheduleBtnText}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Custom Calendar Picker Modal ─────────────────────────────────────── */}
      <Modal visible={showCalendarModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.calCard}>
            {/* Calendar Header */}
            <View style={styles.calHeader}>
              <TouchableOpacity onPress={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}>
                <CustomText style={styles.calArrow}>‹</CustomText>
              </TouchableOpacity>
              <CustomText style={styles.calMonthText}>
                {MONTHS[viewDate.getMonth()]}  {viewDate.getFullYear()}
              </CustomText>
              <TouchableOpacity onPress={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}>
                <CustomText style={styles.calArrow}>›</CustomText>
              </TouchableOpacity>
            </View>

            {/* Weekdays */}
            <View style={styles.calWeekRow}>
              {WEEKDAYS.map(d => (
                <CustomText key={d} style={styles.calWeekText}>{d}</CustomText>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.calGrid}>
              {calendarDays.map((d, i) => {
                const isSelected = d.type === 'current' && d.day === selDay && viewDate.getMonth() + 1 === selMonth && viewDate.getFullYear() === selYear;
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.calDayCell, isSelected && styles.calDayCellSelected]}
                    onPress={() => handleDaySelect(d)}>
                    <CustomText style={[
                      styles.calDayText,
                      d.type !== 'current' && styles.calDayTextMuted,
                      isSelected && styles.calDayTextSelected
                    ]}>
                      {d.day}
                    </CustomText>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.calDivider} />

            {/* Time Spinner */}
            <View style={styles.timeContainer}>
              <View style={styles.spinnerCol}>
                <TouchableOpacity onPress={() => adjHour(1)}><CustomText style={styles.spinArr}>^</CustomText></TouchableOpacity>
                <CustomText style={styles.spinVal}>{selHour12}</CustomText>
                <TouchableOpacity onPress={() => adjHour(-1)}><CustomText style={styles.spinArr}>v</CustomText></TouchableOpacity>
              </View>

              <View style={styles.spinnerCol}>
                <TouchableOpacity onPress={() => adjMin(1)}><CustomText style={styles.spinArr}>^</CustomText></TouchableOpacity>
                <CustomText style={styles.spinVal}>{pad(selMinute)}</CustomText>
                <TouchableOpacity onPress={() => adjMin(-1)}><CustomText style={styles.spinArr}>v</CustomText></TouchableOpacity>
              </View>

              <View style={styles.ampmToggle}>
                <TouchableOpacity
                  style={[styles.ampmBtn, !isPM && styles.ampmBtnActive]}
                  onPress={() => setIsPM(false)}>
                  <CustomText style={[styles.ampmText, !isPM && styles.ampmTextActive]}>AM</CustomText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ampmBtn, isPM && styles.ampmBtnActive]}
                  onPress={() => setIsPM(true)}>
                  <CustomText style={[styles.ampmText, isPM && styles.ampmTextActive]}>PM</CustomText>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.calDivider} />

            {/* Actions */}
            <View style={styles.calActions}>
              <TouchableOpacity onPress={() => setShowCalendarModal(false)}>
                <CustomText style={styles.calClearText}>Clear</CustomText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.calConfirmBtn} onPress={handleCalendarConfirm}>
                <CustomText style={styles.calConfirmText}>Confirm</CustomText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Scheduled Success Modal ─────────────────────────────────────────── */}
      <Modal visible={showScheduledSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIconWrapper}>
              <TickIcon width={86} height={84} />
            </View>
            <CustomText style={styles.successTitle}>Scheduled!</CustomText>
            <CustomText style={styles.successSubtitle}>
              your email scheduled successfully!
            </CustomText>
          </View>
        </View>
      </Modal>

      {/* ── Send Now Success Modal ──────────────────────────────────────────── */}
      <Modal visible={showSendSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIconWrapper}>
              <TickIcon width={86} height={84} />
            </View>
            <CustomText style={styles.successTitle}>Success!</CustomText>
            <CustomText style={styles.successSubtitle}>
              your email campaign is sent successfully.
            </CustomText>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DirectSendScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.paper,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  label: {
    fontSize: 16,
    fontFamily: fonts.families.bold,
    color: colors.text.primary,
    marginBottom: 12,
  },
  input: {
    backgroundColor:colors.background.inputBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    fontSize: 12,
    fontFamily: fonts.families.medium,
    color: colors.text.primary,
    marginBottom: 20,
  },
  dropdown: {
    backgroundColor: colors.background.inputBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dropdownPlaceholder: {
    fontSize: 12,
    fontFamily: fonts.families.medium,
    color: colors.text.muted,
  },
  dropdownSelected: {
    fontSize: 14,
    fontFamily: fonts.families.bold,
    color: colors.text.primary,
  },
  dropdownContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  dropdownItemText: {
    fontSize: 14,
    fontFamily: fonts.families.medium,
    color: colors.text.primary,
  },
  emptyText: {
    padding: 16,
    textAlign: 'center',
    color: colors.text.muted,
    fontFamily: fonts.families.medium,
  },
  messageCard: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
  },
  richTextContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.inputBg,
    overflow: 'hidden',
  },
  richToolbar: {
    backgroundColor: colors.border.light,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.medium,
  },
  richEditorWrapper: {
    minHeight: 200,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: colors.background.paper,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: 12,
  },
  outlineBtn: {
    flex: 1,
    height: 50,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: colors.text.primary,
  },
  outlineBtnText: {
    color: colors.text.primary,
    fontFamily: fonts.families.bold,
  },
  solidBtn: {
    flex: 1,
    height: 50,
    borderRadius: 30,
    backgroundColor: colors.text.primary,
  },

  // Modals Styling (Shared from PreviewSendScreen)
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', padding: 20,
  },
  scheduleModalCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24 },
  scheduleModalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  scheduleModalTitle: { fontSize: 18, fontFamily: fonts.families.bold, color: colors.primary.main },
  scheduleModalSubtitle: {
    fontSize: 14, fontFamily: fonts.families.bold, color: '#111827', marginBottom: 12,
  },
  dateInputRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6',
    borderRadius: 12, paddingHorizontal: 16, height: 50, marginBottom: 32,
  },
  dateInput: { flex: 1, fontFamily: fonts.families.medium, fontSize: 14, color: '#111827' },
  scheduleFooter: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, height: 50, borderRadius: 30, borderColor: '#111827', borderWidth: 1 },
  cancelBtnText: { color: '#000', fontFamily: fonts.families.bold, fontSize: 16, textAlign: 'center' },
  confirmScheduleBtn: { flex: 1, height: 50, borderRadius: 30, backgroundColor: '#232232' },
  confirmScheduleBtnText: { color: '#fff', fontFamily: fonts.families.bold, fontSize: 16, textAlign: 'center' },

  calCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1, shadowRadius: 10, elevation: 5,
  },
  calHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
  },
  calArrow: { fontSize: 24, color: '#374151', paddingHorizontal: 12 },
  calMonthText: { fontSize: 16, fontFamily: fonts.families.bold, color: '#1F2937' },
  calWeekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  calWeekText: { flex: 1, textAlign: 'center', fontSize: 11, color: '#6B7280', fontFamily: fonts.families.medium },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDayCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginVertical: 2 },
  calDayCellSelected: { backgroundColor: colors.primary.main, borderRadius: 8 },
  calDayText: { fontSize: 14, color: '#111827', fontFamily: fonts.families.medium },
  calDayTextMuted: { color: '#D1D5DB' },
  calDayTextSelected: { color: '#fff', fontFamily: fonts.families.bold },
  calDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 16 },
  timeContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 32 },
  spinnerCol: { alignItems: 'center' },
  spinArr: { fontSize: 18, color: '#374151', paddingVertical: 4 },
  spinVal: { fontSize: 16, fontFamily: fonts.families.medium, color: '#111827', marginVertical: 8 },
  ampmToggle: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 8, overflow: 'hidden' },
  ampmBtn: { paddingVertical: 8, paddingHorizontal: 12 },
  ampmBtnActive: { backgroundColor: colors.primary.main },
  ampmText: { fontSize: 12, color: '#9CA3AF', fontFamily: fonts.families.bold },
  ampmTextActive: { color: '#fff' },
  calActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 },
  calClearText: { color: '#6B7280', fontFamily: fonts.families.bold, fontSize: 14 },
  calConfirmBtn: { backgroundColor: colors.primary.main, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  calConfirmText: { color: '#fff', fontFamily: fonts.families.bold, fontSize: 14 },

  successCard: { backgroundColor: '#fff', borderRadius: 24, padding: 32, alignItems: 'center' },
  successIconWrapper: { marginBottom: 24 },
  successTitle: { fontSize: 24, fontFamily: fonts.families.bold, color: '#111827', marginBottom: 12 },
  successSubtitle: { fontSize: 14, fontFamily: fonts.families.medium, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
});
