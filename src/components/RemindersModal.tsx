import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text, TextInput } from './FoxText';
import { Ionicons } from '@expo/vector-icons';
import { localizeDigits } from '../i18n/translations';
import { useFoxStore } from '../store/FoxStoreContext';
import type { ReminderItem, ReminderRepeat, ReminderTone } from '../types/planner';
import { shiftDateKey, toDateKey } from '../utils/dateUtils';
import { dateKeyToJalali, JALALI_MONTH_NAMES_FA } from '../utils/jalaliCalendar';
import { buildPlayfulReminderCopy } from '../utils/notifications';
import { playCelebrationSound, triggerHaptic } from '../utils/soundEffects';
import { ReminderAlertModal } from './ReminderAlertModal';

interface RemindersModalProps {
  visible?: boolean;
  onClose?: () => void;
  defaultDateKey?: string;
  embedded?: boolean;
}

export function RemindersModal({ visible = true, onClose, defaultDateKey, embedded = false }: RemindersModalProps) {
  const {
    state,
    theme,
    isRTL,
    upsertReminder,
    toggleReminderEnabled,
    deleteReminder,
  } = useFoxStore();
  const lang = state.language;

  const now = new Date();
  const defaultNextHour = (now.getHours() + 1) % 24;

  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [subjectId, setSubjectId] = useState<string | undefined>(state.subjects[0]?.id);
  const [dateKey, setDateKey] = useState(defaultDateKey ?? toDateKey());
  const [hour, setHour] = useState(defaultNextHour);
  const [minute, setMinute] = useState(0);
  const [repeat, setRepeat] = useState<ReminderRepeat>('once');
  const [tone, setTone] = useState<ReminderTone>('playful');
  const [saving, setSaving] = useState(false);
  const [previewAlert, setPreviewAlert] = useState<ReminderItem | null>(null);

  const jDate = dateKeyToJalali(dateKey);

  const resetForm = () => {
    setEditingId(undefined);
    setTitle('');
    setDetails('');
    setDateKey(defaultDateKey ?? toDateKey());
    setHour((new Date().getHours() + 1) % 24);
    setMinute(0);
    setRepeat('once');
    setTone('playful');
  };

  const loadForEdit = (item: ReminderItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setDetails(item.details ?? '');
    setSubjectId(item.subjectId);
    setDateKey(item.dateKey);
    setHour(item.hour);
    setMinute(item.minute);
    setRepeat(item.repeat);
    setTone(item.tone);
  };

  const pad2 = (n: number) => String(n).padStart(2, '0');
  const formattedTime = localizeDigits(`${pad2(hour)}:${pad2(minute)}`, lang);

  const draftPreviewCopy = buildPlayfulReminderCopy(
    {
      title: title.trim() || (lang === 'fa' ? 'مرور جزوه و تست‌زنی' : 'Focus study block'),
      details: details.trim() || undefined,
      tone,
    },
    lang
  );

  const handleSave = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      await upsertReminder({
        id: editingId,
        title: title.trim(),
        details: details.trim() || undefined,
        subjectId,
        dateKey,
        hour,
        minute,
        repeat,
        tone,
        enabled: true,
      });
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleTestPreview = () => {
    void triggerHaptic('success');
    void playCelebrationSound('reminder', state.celebrationSoundsEnabled);
    setPreviewAlert({
      id: 'preview-reminder',
      title: title.trim() || (lang === 'fa' ? 'وقت مطالعه‌ی باحال با روباه!' : 'Playful Fox Study Session!'),
      details: details.trim() || undefined,
      subjectId,
      dateKey,
      hour,
      minute,
      repeat,
      tone,
      enabled: true,
      createdAt: Date.now(),
    });
  };

  const repeatOptions: Array<{ key: ReminderRepeat; fa: string; en: string }> = [
    { key: 'once', fa: 'یک‌بار', en: 'Once' },
    { key: 'daily', fa: 'هر روز', en: 'Daily' },
    { key: 'weekly', fa: 'هفتگی', en: 'Weekly' },
  ];

  const toneOptions: Array<{ key: ReminderTone; fa: string; en: string; emoji: string }> = [
    { key: 'playful', fa: 'روباهی و بامزه', en: 'Playful Fox', emoji: '🦊' },
    { key: 'motivating', fa: 'پرانرژی و انگیزشی', en: 'Energizing', emoji: '🔥' },
    { key: 'calm', fa: 'آرام و مهربان', en: 'Gentle & Calm', emoji: '🌿' },
  ];

  const repeatLabel = (r: ReminderRepeat) => {
    const f = repeatOptions.find((x) => x.key === r);
    return f ? (lang === 'fa' ? f.fa : f.en) : r;
  };

  const bodyContent = (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Creator / Editor Card */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
              {editingId
                ? lang === 'fa'
                  ? 'ویرایش یادآور'
                  : 'Edit Reminder'
                : lang === 'fa'
                ? 'ساخت اعلان جدید با جزئیات'
                : 'New Detailed Reminder'}
            </Text>

            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={lang === 'fa' ? 'چه کاری باید انجام بشه؟ (مثلا: حل تمرین فیزیک)' : 'What should Fox remind you of?'}
              placeholderTextColor={theme.textMuted}
              style={[
                styles.input,
                {
                  backgroundColor: theme.surfaceElevated,
                  borderColor: theme.border,
                  color: theme.text,
                  textAlign: isRTL ? 'right' : 'left',
                },
              ]}
            />

            <TextInput
              value={details}
              onChangeText={setDetails}
              multiline
              placeholder={
                lang === 'fa'
                  ? 'جزئیات دقیق (مثلا: صفحه ۴۲ تا ۵۵، اول فرمول‌ها رو مرور کن بعد ۱۰ تست بزن)...'
                  : 'Detailed instructions or checklist to show inside the alert...'
              }
              placeholderTextColor={theme.textMuted}
              style={[
                styles.input,
                styles.detailsInput,
                {
                  backgroundColor: theme.surfaceElevated,
                  borderColor: theme.border,
                  color: theme.text,
                  textAlign: isRTL ? 'right' : 'left',
                },
              ]}
            />

            {/* Optional Subject Link */}
            <Text style={[styles.label, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
              {lang === 'fa' ? 'درس یا دسته‌بندی مرتبط' : 'Linked Subject'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {state.subjects.map((sub) => {
                const active = subjectId === sub.id;
                return (
                  <TouchableOpacity
                    key={sub.id}
                    onPress={() => setSubjectId(active ? undefined : sub.id)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? `${sub.color}24` : theme.surfaceElevated,
                        borderColor: active ? sub.color : theme.border,
                        flexDirection: isRTL ? 'row-reverse' : 'row',
                      },
                    ]}
                  >
                    <View style={[styles.subDot, { backgroundColor: sub.color }]} />
                    <Text style={{ color: active ? theme.text : theme.textSecondary, fontSize: 12, fontWeight: '700' }}>
                      {lang === 'fa' ? sub.nameFa : sub.nameEn}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Date Picker Strip */}
            <Text style={[styles.label, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
              {lang === 'fa' ? 'تاریخ اعلان' : 'Reminder Date'}
            </Text>
            <View style={[styles.dateRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity
                onPress={() => setDateKey(shiftDateKey(dateKey, -1))}
                style={[styles.stepBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
              >
                <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={16} color={theme.text} />
              </TouchableOpacity>

              <View style={[styles.dateDisplay, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                <Text style={{ color: theme.text, fontSize: 13.5, fontWeight: '800' }}>
                  {localizeDigits(jDate.jd, lang)} {JALALI_MONTH_NAMES_FA[jDate.jm - 1]} {localizeDigits(jDate.jy, lang)}
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 11 }}>{dateKey}</Text>
              </View>

              <TouchableOpacity
                onPress={() => setDateKey(shiftDateKey(dateKey, 1))}
                style={[styles.stepBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
              >
                <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={[styles.quickDates, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity
                onPress={() => setDateKey(toDateKey())}
                style={[styles.quickPill, { backgroundColor: theme.primarySoft }]}
              >
                <Text style={{ color: theme.primary, fontSize: 11.5, fontWeight: '800' }}>
                  {lang === 'fa' ? 'امروز' : 'Today'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setDateKey(shiftDateKey(toDateKey(), 1))}
                style={[styles.quickPill, { backgroundColor: theme.infoSoft }]}
              >
                <Text style={{ color: theme.info, fontSize: 11.5, fontWeight: '800' }}>
                  {lang === 'fa' ? 'فردا' : 'Tomorrow'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Time Stepper (Exact Hour & Minute) */}
            <Text style={[styles.label, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
              {lang === 'fa' ? 'ساعت دقیق اعلان' : 'Exact Time'}
            </Text>
            <View style={[styles.timeBox, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
              <View style={styles.timeUnit}>
                <TouchableOpacity
                  onPress={() => setHour((h) => (h + 1) % 24)}
                  style={[styles.timeArrow, { backgroundColor: theme.surface }]}
                >
                  <Ionicons name="chevron-up" size={18} color={theme.primary} />
                </TouchableOpacity>
                <Text style={[styles.timeDigit, { color: theme.text }]}>{localizeDigits(pad2(hour), lang)}</Text>
                <TouchableOpacity
                  onPress={() => setHour((h) => (h + 23) % 24)}
                  style={[styles.timeArrow, { backgroundColor: theme.surface }]}
                >
                  <Ionicons name="chevron-down" size={18} color={theme.primary} />
                </TouchableOpacity>
                <Text style={{ color: theme.textMuted, fontSize: 10.5 }}>
                  {lang === 'fa' ? 'ساعت' : 'Hour'}
                </Text>
              </View>

              <Text style={[styles.colon, { color: theme.primary }]}>:</Text>

              <View style={styles.timeUnit}>
                <TouchableOpacity
                  onPress={() => setMinute((m) => (m + 5) % 60)}
                  style={[styles.timeArrow, { backgroundColor: theme.surface }]}
                >
                  <Ionicons name="chevron-up" size={18} color={theme.primary} />
                </TouchableOpacity>
                <Text style={[styles.timeDigit, { color: theme.text }]}>{localizeDigits(pad2(minute), lang)}</Text>
                <TouchableOpacity
                  onPress={() => setMinute((m) => (m + 55) % 60)}
                  style={[styles.timeArrow, { backgroundColor: theme.surface }]}
                >
                  <Ionicons name="chevron-down" size={18} color={theme.primary} />
                </TouchableOpacity>
                <Text style={{ color: theme.textMuted, fontSize: 10.5 }}>
                  {lang === 'fa' ? 'دقیقه (±۵)' : 'Min (±5)'}
                </Text>
              </View>

              <View style={{ justifyContent: 'center', gap: 6 }}>
                <TouchableOpacity
                  onPress={() => setMinute((m) => (m + 1) % 60)}
                  style={[styles.minFineBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '800' }}>+۱دقیقه</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setMinute((m) => (m + 59) % 60)}
                  style={[styles.minFineBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '800' }}>-۱دقیقه</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Repeat & Tone */}
            <Text style={[styles.label, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
              {lang === 'fa' ? 'تکرار' : 'Repeat'}
            </Text>
            <View style={[styles.optionsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {repeatOptions.map((opt) => {
                const active = repeat === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setRepeat(opt.key)}
                    style={[
                      styles.chip,
                      {
                        flex: 1,
                        justifyContent: 'center',
                        backgroundColor: active ? theme.primarySoft : theme.surfaceElevated,
                        borderColor: active ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text style={{ color: active ? theme.primary : theme.textSecondary, fontSize: 12, fontWeight: '800' }}>
                      {lang === 'fa' ? opt.fa : opt.en}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.label, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
              {lang === 'fa' ? 'لحن و حال‌وهوای پیام روباه' : 'Alert Personality'}
            </Text>
            <View style={[styles.optionsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {toneOptions.map((opt) => {
                const active = tone === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setTone(opt.key)}
                    style={[
                      styles.chip,
                      {
                        flex: 1,
                        justifyContent: 'center',
                        backgroundColor: active ? theme.accentSoft : theme.surfaceElevated,
                        borderColor: active ? theme.accent : theme.border,
                      },
                    ]}
                  >
                    <Text style={{ color: active ? theme.accent : theme.textSecondary, fontSize: 11.5, fontWeight: '800' }}>
                      {opt.emoji} {lang === 'fa' ? opt.fa : opt.en}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Live Playful Message Preview */}
            <View style={[styles.previewBox, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}>
              <View style={[styles.previewTop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={{ color: theme.primary, fontSize: 11.5, fontWeight: '900' }}>
                  {lang === 'fa' ? `پیش‌نمایش اعلان ساعت ${formattedTime}` : `Preview at ${formattedTime}`}
                </Text>
                <TouchableOpacity onPress={handleTestPreview} style={[styles.testBtn, { backgroundColor: theme.surface }]}>
                  <Ionicons name="volume-high-outline" size={14} color={theme.primary} />
                  <Text style={{ color: theme.primary, fontSize: 11, fontWeight: '800' }}>
                    {lang === 'fa' ? 'تست و پیش‌نمایش' : 'Test Alert'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={{ color: theme.text, fontSize: 13, fontWeight: '800', marginTop: 6, textAlign: isRTL ? 'right' : 'left' }}>
                {draftPreviewCopy.title}
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 3, textAlign: isRTL ? 'right' : 'left' }}>
                {draftPreviewCopy.body}
              </Text>
            </View>

            {/* Save / Cancel Actions */}
            <View style={[styles.formActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {editingId ? (
                <TouchableOpacity
                  onPress={resetForm}
                  style={[styles.cancelBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
                >
                  <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: '800' }}>
                    {lang === 'fa' ? 'انصراف' : 'Cancel'}
                  </Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                onPress={handleSave}
                style={[styles.saveBtn, { backgroundColor: title.trim() ? theme.primary : theme.surfaceMuted }]}
              >
                <Ionicons name="alarm-outline" size={18} color="#FFF" />
                <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '900' }}>
                  {saving
                    ? lang === 'fa'
                      ? 'در حال ثبت...'
                      : 'Saving...'
                    : editingId
                    ? lang === 'fa'
                      ? 'ذخیره تغییرات یادآور'
                      : 'Save Changes'
                    : lang === 'fa'
                    ? 'تنظیم و فعال‌سازی اعلان 🦊'
                    : 'Schedule Reminder 🦊'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Saved Reminders List */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
              {lang === 'fa'
                ? `یادآورهای ثبت‌شده (${localizeDigits(state.reminders.length, lang)})`
                : `Your Reminders (${state.reminders.length})`}
            </Text>

            {state.reminders.length === 0 ? (
              <Text style={{ color: theme.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 14 }}>
                {lang === 'fa'
                  ? 'هنوز یادآوری نساختی! از فرم بالا اولین اعلان باحالت رو بساز 🦊'
                  : 'No reminders yet! Create your first playful Fox alert above 🦊'}
              </Text>
            ) : (
              <View style={{ gap: 10 }}>
                {state.reminders.map((rem) => {
                  const rJalali = dateKeyToJalali(rem.dateKey);
                  const subj = state.subjects.find((s) => s.id === rem.subjectId);
                  return (
                    <View
                      key={rem.id}
                      style={[
                        styles.remRow,
                        {
                          backgroundColor: theme.surfaceElevated,
                          borderColor: rem.enabled ? theme.border : theme.surfaceMuted,
                          opacity: rem.enabled ? 1 : 0.65,
                          flexDirection: isRTL ? 'row-reverse' : 'row',
                        },
                      ]}
                    >
                      <TouchableOpacity
                        onPress={() => void toggleReminderEnabled(rem.id)}
                        style={[
                          styles.toggleCircle,
                          {
                            backgroundColor: rem.enabled ? theme.successSoft : theme.surface,
                            borderColor: rem.enabled ? theme.success : theme.border,
                          },
                        ]}
                      >
                        <Ionicons
                          name={rem.enabled ? 'notifications' : 'notifications-off-outline'}
                          size={18}
                          color={rem.enabled ? theme.success : theme.textMuted}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity onPress={() => loadForEdit(rem)} style={{ flex: 1 }}>
                        <Text style={{ color: theme.text, fontSize: 14, fontWeight: '800', textAlign: isRTL ? 'right' : 'left' }}>
                          {rem.title}
                        </Text>
                        {rem.details ? (
                          <Text
                            numberOfLines={2}
                            style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2, textAlign: isRTL ? 'right' : 'left' }}
                          >
                            {rem.details}
                          </Text>
                        ) : null}
                        <View style={[styles.remMetaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                          <Text style={{ color: theme.primary, fontSize: 11.5, fontWeight: '900' }}>
                            ⏰ {localizeDigits(`${pad2(rem.hour)}:${pad2(rem.minute)}`, lang)}
                          </Text>
                          <Text style={{ color: theme.textMuted, fontSize: 11 }}>
                            📅 {localizeDigits(rJalali.jd, lang)} {JALALI_MONTH_NAMES_FA[rJalali.jm - 1]}
                          </Text>
                          <Text style={{ color: theme.info, fontSize: 11, fontWeight: '700' }}>
                            🔁 {repeatLabel(rem.repeat)}
                          </Text>
                          {subj ? (
                            <Text style={{ color: subj.color, fontSize: 11, fontWeight: '800' }}>
                              • {lang === 'fa' ? subj.nameFa : subj.nameEn}
                            </Text>
                          ) : null}
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity onPress={() => void deleteReminder(rem.id)} style={{ padding: 6 }}>
                        <Ionicons name="trash-outline" size={17} color={theme.danger} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
  );

  if (embedded) {
    return (
      <View style={styles.embeddedWrap}>
        {bodyContent}
        <ReminderAlertModal
          reminderOverride={previewAlert}
          onCloseOverride={() => setPreviewAlert(null)}
        />
      </View>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <View
          style={[
            styles.header,
            { borderBottomColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
              {lang === 'fa' ? 'یادآورها و اعلان‌های بامزه ⏰🦊' : 'Smart Playful Reminders ⏰🦊'}
            </Text>
            <Text style={{ color: theme.textMuted, fontSize: 12, textAlign: isRTL ? 'right' : 'left' }}>
              {lang === 'fa'
                ? 'زمان، جزئیات دقیق کار و لحن روباه را تنظیم کن تا سر وقت صدا بزنه'
                : 'Set exact timing, custom task details & playful Fox alert tone'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
          >
            <Ionicons name="close" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>

        {bodyContent}

        <ReminderAlertModal
          reminderOverride={previewAlert}
          onCloseOverride={() => setPreviewAlert(null)}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  embeddedWrap: { flex: 1 },
  container: { flex: 1 },
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 10,
  },
  headerTitle: { fontSize: 17, fontWeight: '900' },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 42 },
  card: { borderRadius: 24, borderWidth: 1, padding: 16, gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '900', marginBottom: 4 },
  input: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 10, fontSize: 13.5 },
  detailsInput: { minHeight: 74, textAlignVertical: 'top' },
  label: { fontSize: 12, fontWeight: '800', marginTop: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 13,
    borderWidth: 1,
  },
  subDot: { width: 8, height: 8, borderRadius: 4 },
  dateRow: { alignItems: 'center', gap: 8 },
  stepBtn: { width: 40, height: 42, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dateDisplay: {
    flex: 1,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickDates: { gap: 8 },
  quickPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  timeUnit: { alignItems: 'center', gap: 4 },
  timeArrow: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 10 },
  timeDigit: { fontSize: 28, fontWeight: '900', fontVariant: ['tabular-nums'] },
  colon: { fontSize: 28, fontWeight: '900', marginBottom: 14 },
  minFineBtn: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 9, borderWidth: 1 },
  optionsRow: { gap: 8 },
  previewBox: { borderRadius: 16, borderWidth: 1, padding: 12, marginTop: 4 },
  previewTop: { alignItems: 'center', justifyContent: 'space-between' },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },
  formActions: { gap: 8, marginTop: 4 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 13, borderRadius: 14, borderWidth: 1, justifyContent: 'center' },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 15,
  },
  remRow: { alignItems: 'center', gap: 10, padding: 12, borderRadius: 18, borderWidth: 1 },
  toggleCircle: { width: 40, height: 40, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  remMetaRow: { gap: 10, flexWrap: 'wrap', marginTop: 5 },
});
