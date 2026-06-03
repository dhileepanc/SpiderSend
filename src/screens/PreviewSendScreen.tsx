import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  ActivityIndicator,
  TextInput,
  Keyboard,
  KeyboardEvent,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppToolbar, CustomText, CustomButton, CustomInput } from '../components/common';
import { colors, fonts } from '../theme';
import { AppStackParamList, AppNavigationProp } from '../navigation/types';
import { useAuth } from '../hooks';
import { sendMailCampaign, getClickToConnectPreview } from '../services/click2ConnectService';

import { actions, RichEditor, RichToolbar } from 'react-native-pell-rich-editor';
import { useWindowDimensions } from 'react-native';

import TickIcon from '../assets/icons/tickicon.svg';
import CloseIcon from '../assets/icons/cancelicon.svg';
import CalenderIcon from '../assets/icons/calendericon.svg';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const pad = (n: number) => String(n).padStart(2, '0');

// Remove <span style="display: none;"> tags that break bold/italic rendering
const cleanHtml = (html: any): string => {
  if (!html || typeof html !== 'string') return '';
  // Remove empty display:none spans (injected by some email editors)
  return html
    .replace(/<span[^>]*style=["'][^"']*display\s*:\s*none[^"']*["'][^>]*>.*?<\/span>/gi, '')
    .replace(/<span[^>]*style=["'][^"']*display:\s*none[^"']*["'][^>]*>\/span>/gi, '')
    .trim();
};

const PreviewSendScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<RouteProp<AppStackParamList, 'PreviewSend'>>();
  const insets = useSafeAreaInsets();

  const { contacts, template, clickToConnectId } = route.params;

  // Preview data from API
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [messageHtml, setMessageHtml] = useState('');
  const [templateName, setTemplateName] = useState(template?.name || '');

  // Selection tracking for variable insertion (legacy, keeping activeChip)
  const [activeChip, setActiveChip] = useState<string | null>(null);

  const richTextRef = useRef<RichEditor>(null);

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showScheduledSuccess, setShowScheduledSuccess] = useState(false);
  const [showSendSuccess, setShowSendSuccess] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // The formatted date string shown in the text input inside the Schedule Modal
  const [displayDate, setDisplayDate] = useState('');

  // Custom Calendar State
  const now = new Date();
  const [viewDate, setViewDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [selDay, setSelDay] = useState(now.getDate());
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1); // 1-12
  const [selYear, setSelYear] = useState(now.getFullYear());

  let currentHour = now.getHours();
  const [isPM, setIsPM] = useState(currentHour >= 12);
  const [selHour12, setSelHour12] = useState(currentHour % 12 || 12);
  const [selMinute, setSelMinute] = useState(now.getMinutes());

  // Loading states
  const [sending, setSending] = useState(false);
  const [scheduling, setScheduling] = useState(false);

  // Success auto-close timer
  const successTimeoutRef = useRef<NodeJS.Timeout>();

  // Fetch preview data on mount
  useEffect(() => {
    const load = async () => {
      if (!user?.id || !clickToConnectId) {
        setLoading(false);
        const fallbackContent = template?.content || '';
        setSubject(template?.subject || '');
        setMessageHtml(cleanHtml(fallbackContent));
        return;
      }
      try {
        const res = await getClickToConnectPreview(user.id, clickToConnectId);
        if (res.status && res.data) {
          setSubject(res.data.subject || template?.subject || '');
          const htmlContent = res.data.content || template?.content || '';
          setMessageHtml(cleanHtml(htmlContent));
          setTemplateName(res.data.name || template?.name || '');
        } else {
          const fallbackContent = template?.content || '';
          setSubject(template?.subject || '');
          setMessageHtml(cleanHtml(fallbackContent));
        }
      } catch {
        const fallbackContent = template?.content || '';
        setSubject(template?.subject || '');
        setMessageHtml(cleanHtml(fallbackContent));
      } finally {
        setLoading(false);
      }
    };
    load();

    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e: KeyboardEvent) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const variables = [
    { label: 'Name', tag: '{{name}}' },
    { label: 'Email', tag: '{{email}}' },
    { label: 'Company', tag: '{{company_name}}' },
    { label: 'Phone', tag: '{{mobile_number}}' },
    { label: 'Address', tag: '{{address}}' },
  ];

  const handleInsertVariable = (tag: string, label: string) => {
    richTextRef.current?.insertText(tag);
    // Flash chip active then reset
    setActiveChip(label);
    setTimeout(() => setActiveChip(null), 600);
  };

  // ── Send Now (NO schedule params) ──────────────────────────────────────────
  const handleSendNow = async () => {
    if (!user?.id || !clickToConnectId) {
      Alert.alert('Error', 'Missing required data to send.');
      return;
    }
    setSending(true);
    try {
      const res = await sendMailCampaign({
        clientId: user.id,
        clickToConnectId,
        name: templateName,
        subject,
        content: messageHtml,
        mailCount: contacts.length,
      });
      if (res.status) {
        setShowSendSuccess(true);
        successTimeoutRef.current = setTimeout(() => {
          setShowSendSuccess(false);
          navigation.navigate('Home');
        }, 4000);
      } else {
        Alert.alert('Error', res.message || 'Failed to send mail.');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to send mail');
    } finally {
      setSending(false);
    }
  };

  // ── Calendar Confirm ───────────────────────────────────────────────────────
  const handleCalendarConfirm = () => {
    // Set the display string for the input
    setDisplayDate(`${pad(selDay)}-${pad(selMonth)}-${selYear} ${selHour12}:${pad(selMinute)} ${isPM ? 'PM' : 'AM'}`);
    setShowCalendarModal(false);
  };

  // ── Schedule Action ────────────────────────────────────────────────────────
  const handleScheduleAction = async () => {
    if (!displayDate) {
      Alert.alert('Validation', 'Please select a date and time.');
      return;
    }
    if (!user?.id || !clickToConnectId) {
      Alert.alert('Error', 'Missing required data to schedule.');
      return;
    }

    // Convert 12h to 24h for API payload
    let hour24 = selHour12;
    if (isPM && hour24 !== 12) hour24 += 12;
    if (!isPM && hour24 === 12) hour24 = 0;

    // Build datetime string "YYYY-MM-DD HH:MM:00"
    const scheduledAt = `${selYear}-${pad(selMonth)}-${pad(selDay)} ${pad(hour24)}:${pad(selMinute)}:00`;
    const scheduledTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    setScheduling(true);
    try {
      const res = await sendMailCampaign({
        clientId: user.id,
        clickToConnectId,
        name: templateName,
        subject,
        content: messageHtml,
        mailCount: contacts.length,
        isScheduled: 1,
        scheduledAt,
        scheduledTimezone,
      });
      if (res.status) {
        setShowScheduleModal(false);
        setShowScheduledSuccess(true);
        successTimeoutRef.current = setTimeout(() => {
          setShowScheduledSuccess(false);
          navigation.navigate('Home');
        }, 4000);
      } else {
        Alert.alert('Error', res.message || 'Failed to schedule mail.');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to schedule mail');
    } finally {
      setScheduling(false);
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

//   useEffect(() => {
//   const timer = setTimeout(() => {
//     setShowSendSuccess(false);
//     setShowScheduledSuccess(false);
//     navigation.navigate('Home');
//   }, 10000);

//   return () => clearTimeout(timer);
// }, [showSendSuccess, showScheduledSuccess]);

const { width } = useWindowDimensions();
  return (
    <View style={styles.root}>
      <AppToolbar title="Preview & Send" />

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <CustomText style={styles.loaderText}>Loading preview...</CustomText>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[styles.scroll, { paddingBottom: 120 + keyboardHeight + insets.bottom }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">

            {/* Contacts List */}
            {(Array.isArray(contacts) ? contacts : []).map((contact, index) => (
              <View key={contact?.id || index} style={styles.contactCardContainer}>
                <CustomText style={styles.contactTitle}>Scan Data #{index + 1}</CustomText>
                <View style={styles.contactCard}>
                  <View style={styles.row}>
                    <CustomText style={styles.label}>Name:</CustomText>
                    <CustomText style={styles.value}>{String(contact?.name || '')}</CustomText>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.row}>
                    <CustomText style={styles.label}>Email:</CustomText>
                    <CustomText style={styles.value}>{String(contact?.email || '')}</CustomText>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.row}>
                    <CustomText style={styles.label}>Company:</CustomText>
                    <CustomText style={styles.value}>{String(contact?.companyName || '')}</CustomText>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.row}>
                    <CustomText style={styles.label}>Mobile:</CustomText>
                    <CustomText style={styles.value}>{String(contact?.mobileNumber || '')}</CustomText>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.row}>
                    <CustomText style={styles.label}>Address:</CustomText>
                    <CustomText style={styles.value}>{String(contact?.address || '')}</CustomText>
                  </View>
                </View>
              </View>
            ))}

            {/* Template section */}
            <CustomText style={styles.sectionTitle}>Preview Mail Template</CustomText>

            <CustomText style={styles.inputLabel}>Subject</CustomText>
            <CustomInput
              value={subject || ''}
              onChangeText={setSubject}
              placeholder="Enter Subject"
              inputRowStyle={styles.subjectInputRow}
              inputStyle={styles.subjectInputText}
              containerStyle={styles.inputContainer}
            />

            <CustomText style={styles.inputLabel}>Insert Variable:</CustomText>
            <View style={styles.variablesRow}>
              {variables.map((v) => {
                const isActive = activeChip === v.label;
                return (
                  <TouchableOpacity
                    key={v.label}
                    style={[styles.variablePill, isActive && styles.variablePillActive]}
                    onPress={() => handleInsertVariable(v.tag, v.label)}>
                    <CustomText style={[styles.variableText, isActive && styles.variableTextActive]}>
                      {v.label}
                    </CustomText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Message – Rich Text Editor */}
            <View style={styles.messageSectionHeader}>
              <CustomText style={styles.inputLabel}>Message</CustomText>
            </View>

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
                selectedIconTint="#2BA6B5"
                style={styles.richToolbar}
              />
              <ScrollView scrollEnabled={false} style={styles.richEditorWrapper}>
                <RichEditor
                  ref={richTextRef}
                  initialContentHTML={messageHtml}
                  onChange={setMessageHtml}
                  placeholder="Type your message here..."
                  initialHeight={250}
                  useContainer={true}
                  editorStyle={{
                    backgroundColor: '#F3F4F6',
                    color: '#111827',
                  }}
                  onFocus={() => {
                    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
                  }}
                />
              </ScrollView>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* Bottom Bar */}
      {!loading && (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <CustomButton
            title="Schedule Send"
            variant="outline"
            onPress={() => setShowScheduleModal(true)}
            disabled={sending}
            style={styles.scheduleBtn}
            textStyle={styles.scheduleBtnText}
          />
          <CustomButton
            title={sending ? 'Sending...' : 'Send Now'}
            onPress={handleSendNow}
            disabled={sending || scheduling}
            style={styles.sendNowBtn}
            textStyle={styles.sendNowBtnText}
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
              <TouchableOpacity
  onPress={() => setShowScheduleModal(false)}>
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
              {/* Hour Spinner */}
              <View style={styles.spinnerCol}>
                <TouchableOpacity onPress={() => adjHour(1)}><CustomText style={styles.spinArr}>^</CustomText></TouchableOpacity>
                <CustomText style={styles.spinVal}>{selHour12}</CustomText>
                <TouchableOpacity onPress={() => adjHour(-1)}><CustomText style={styles.spinArr}>v</CustomText></TouchableOpacity>
              </View>

              {/* Minute Spinner */}
              <View style={styles.spinnerCol}>
                <TouchableOpacity onPress={() => adjMin(1)}><CustomText style={styles.spinArr}>^</CustomText></TouchableOpacity>
                <CustomText style={styles.spinVal}>{pad(selMinute)}</CustomText>
                <TouchableOpacity onPress={() => adjMin(-1)}><CustomText style={styles.spinArr}>v</CustomText></TouchableOpacity>
              </View>

              {/* AM/PM Toggle */}
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
              your email campaign is scheduled to be sent{'\n'}within the next 5 mins.
            </CustomText>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default PreviewSendScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { padding: 20, paddingBottom: 120 },

  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loaderText: { fontSize: 14, fontFamily: fonts.families.medium, color: '#6B7280' },

  contactCardContainer: { marginBottom: 20 },
  contactTitle: {
    fontSize: 14, fontFamily: fonts.families.bold,
    color: colors.primary.main, marginBottom: 8,
  },
  contactCard: {
    backgroundColor: '#EFFFFF', borderRadius: 12,
    borderWidth: 1, borderColor: '#B0E0E6', padding: 8,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 5 },
  label: { width: 80, fontSize: 12, fontFamily: fonts.families.medium, color: '#9A9A9A' },
  value: { flex: 1, fontSize: 12, fontFamily: fonts.families.bold, color: '#000' },
  divider: { height: 1, backgroundColor: '#DADADA', opacity: 0.5 },

  sectionTitle: {
    fontSize: 16, fontFamily: fonts.families.bold,
    color: colors.primary.main, marginBottom: 16, marginTop: 8,
  },
  inputLabel: { fontSize: 14, fontFamily: fonts.families.bold, color: '#111827', marginBottom: 8 },
  inputContainer: { marginBottom: 16 },
  subjectInputRow: { backgroundColor: '#F3F4F6', borderWidth: 0, borderRadius: 12, height: 48 },
  subjectInputText: { fontSize: 13, color: '#111827' },
  variablesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  variablePill: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#D1D5DB',
  },
  variablePillActive: {
    backgroundColor: '#E9FCFF', borderColor: '#2DADBE',
  },
  variableText: { fontSize: 11, fontFamily: fonts.families.bold, color: '#6B7280' },
  variableTextActive: { color: '#000' },
  messageSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  editToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F3F4F6',
  },
  editToggleBtnActive: {
    borderColor: '#2BA6B5',
    backgroundColor: '#E9FCFF',
  },
  editToggleText: {
    fontSize: 12,
    fontFamily: fonts.families.bold,
    color: '#6B7280',
  },
  editToggleTextActive: {
    color: '#2BA6B5',
  },
  richTextContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
    marginBottom: 16,
  },
  richToolbar: {
    backgroundColor: '#E5E7EB',
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
  },
  richEditorWrapper: {
    minHeight: 250,
  },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24,
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: 12,
  },
  scheduleBtn: { flex: 1, height: 54, borderRadius: 30, borderColor: '#111827', borderWidth: 1, },
  scheduleBtnText: { color: '#111827', fontFamily: fonts.families.bold, fontSize: 16, textAlign: 'center' },
  sendNowBtn: { flex: 1, height: 54, borderRadius: 30, backgroundColor: '#232232' },
  sendNowBtnText: { color: '#FFFFFF', fontFamily: fonts.families.bold, fontSize: 16, textAlign: 'center' },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', padding: 20,
  },

  // ── First Modal: Schedule Email ──
  scheduleModalCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24 },
  scheduleModalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  scheduleModalTitle: { fontSize: 18, fontFamily: fonts.families.bold, color: colors.primary.main },
  closeIconBtn: {
    backgroundColor: '#FEE2E2', padding: 7, borderRadius: 8,
    borderWidth: 1, borderColor: '#FCA5A5',
  },
  closeIconText: { color: '#EF4444', fontSize: 13, fontFamily: fonts.families.bold },
  scheduleModalSubtitle: {
    fontSize: 14, fontFamily: fonts.families.bold, color: '#111827', marginBottom: 12,
  },
  dateInputRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6',
    borderRadius: 12, paddingHorizontal: 16, height: 50, marginBottom: 32,
  },
  dateInput: { flex: 1, fontFamily: fonts.families.medium, fontSize: 14, color: '#111827' },
  calendarIcon: { fontSize: 20 },
  scheduleFooter: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, height: 50, borderRadius: 30, borderColor: '#111827',borderWidth:1 },
  cancelBtnText: { color: '#000', fontFamily: fonts.families.bold, fontSize: 16, textAlign: 'center' },
  confirmScheduleBtn: { flex: 1, height: 50, borderRadius: 30, backgroundColor: '#232232' },
  confirmScheduleBtnText: { color: '#fff', fontFamily: fonts.families.bold, fontSize: 16, textAlign: 'center' },

  // ── Second Modal: Custom Calendar ──
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
  calDayCellSelected: { backgroundColor: '#2BA6B5', borderRadius: 8 },
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
  ampmBtnActive: { backgroundColor: '#2BA6B5' },
  ampmText: { fontSize: 12, color: '#9CA3AF', fontFamily: fonts.families.bold },
  ampmTextActive: { color: '#fff' },

  calActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 },
  calClearText: { fontSize: 15, color: '#111827', paddingHorizontal: 16 },
  calConfirmBtn: { backgroundColor: '#2BA6B5', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 8 },
  calConfirmText: { color: '#fff', fontSize: 15, fontFamily: fonts.families.bold },

  // Success modals
  successCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 32, alignItems: 'center',
  },
  successIconWrapper: { marginBottom: 20 },
  successCircle: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 3,
    borderColor: '#1E2340', backgroundColor: '#E0F7FA',
    justifyContent: 'center', alignItems: 'center',
  },
  checkMark: { fontSize: 38, color: '#6DBD44', lineHeight: 46, fontFamily: fonts.families.bold },
  successTitle: {
    fontSize: 16, fontFamily: fonts.families.bold,
    color: colors.primary.main, marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 12, fontFamily: fonts.families.medium, color: '#000',
    textAlign: 'center', lineHeight: 22,
  },

  htmlPreviewContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    marginBottom: 4,
  },

  messageTextInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 14,
    fontSize: 13,
    fontFamily: fonts.families.regular,
    color: '#111827',
    minHeight: 160,
    textAlignVertical: 'top',
    marginBottom: 16,
  },

});

