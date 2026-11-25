import React, { useEffect, useMemo, useState } from 'react';
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
import type { CalendarEvent } from '../types/planner';
import { formatDateChip, toDateKey } from '../utils/dateUtils';
import {
  buildJalaliMonthGrid,
  dateKeyToJalali,
  JALALI_MONTH_NAMES_FA,
  JALALI_WEEKDAYS_SHORT_FA,
} from '../utils/jalaliCalendar';

interface CalendarOccasionsModalProps {
  visible?: boolean;
  onClose?: () => void;
  selectedDateKey: string;
  onSelectDateKey: (dateKey: string) => void;
  embedded?: boolean;
}

const WEEKDAYS_SHORT_EN = ['Sa', 'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr'];

export function CalendarOccasionsModal({
  visible = true,
  onClose,
  selectedDateKey,
  onSelectDateKey,
  embedded = false,
}: CalendarOccasionsModalProps) {
  const { state, theme, isRTL, addCalendarEvent, deleteCalendarEvent } = useFoxStore();
  const lang = state.language;
  const todayKey = toDateKey();

  const initialJalali = useMemo(() => dateKeyToJalali(selectedDateKey), [selectedDateKey]);
  const [viewYear, setViewYear] = useState(initialJalali.jy);
  const [viewMonth, setViewMonth] = useState(initialJalali.jm);
  const [focusedDateKey, setFocusedDateKey] = useState(selectedDateKey);

  const [showAddForm, setShowAddForm] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventCategory, setEventCategory] = useState<CalendarEvent['category']>('exam');
  const [eventNote, setEventNote] = useState('');

  useEffect(() => {
    if (visible) {
      const j = dateKeyToJalali(selectedDateKey);
      setViewYear(j.jy);
      setViewMonth(j.jm);
      setFocusedDateKey(selectedDateKey);
    }
  }, [visible, selectedDateKey]);

  const monthGrid = useMemo(() => buildJalaliMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const stepMonth = (delta: number) => {
    let nextM = viewMonth + delta;
    let nextY = viewYear;
    if (nextM < 1) {
      nextM = 12;
      nextY -= 1;
    } else if (nextM > 12) {
      nextM = 1;
      nextY += 1;
    }
    setViewYear(nextY);
    setViewMonth(nextM);
  };

  const jumpToToday = () => {
    const jToday = dateKeyToJalali(todayKey);
    setViewYear(jToday.jy);
    setViewMonth(jToday.jm);
    setFocusedDateKey(todayKey);
  };

  const focusedCell = useMemo(
    () => monthGrid.cells.find((c) => c.dateKey === focusedDateKey),
    [monthGrid.cells, focusedDateKey]
  );

  const focusedJalali = useMemo(() => dateKeyToJalali(focusedDateKey), [focusedDateKey]);
  const focusedChip = useMemo(() => formatDateChip(focusedDateKey, lang), [focusedDateKey, lang]);

  const focusedTasks = useMemo(
    () => state.tasks.filter((t) => t.dateKey === focusedDateKey),
    [state.tasks, focusedDateKey]
  );
  const focusedReminders = useMemo(
    () => state.reminders.filter((r) => r.enabled && (r.dateKey === focusedDateKey || r.repeat === 'daily')),
    [state.reminders, focusedDateKey]
  );
  const focusedEvents = useMemo(
    () => state.calendarEvents.filter((e) => e.dateKey === focusedDateKey),
    [state.calendarEvents, focusedDateKey]
  );

  const monthOccasions = useMemo(
    () => monthGrid.cells.filter((c) => c.occasions.length > 0),
    [monthGrid.cells]
  );

  const tagColor = (tag: string) => {
    if (tag === 'holiday' || tag === 'exam') return theme.danger;
    if (tag === 'student' || tag === 'deadline') return theme.info;
    if (tag === 'wellness') return theme.success;
    return theme.warning;
  };

  const categoryLabel = (cat: CalendarEvent['category']) => {
    if (lang === 'fa') {
      return cat === 'exam' ? 'امتحان / آزمون' : cat === 'deadline' ? 'تحویل پروژه' : 'رویداد شخصی';
    }
    return cat === 'exam' ? 'Exam' : cat === 'deadline' ? 'Deadline' : 'Personal';
  };

  const handleSaveEvent = () => {
    if (!eventTitle.trim()) return;
    addCalendarEvent(focusedDateKey, eventTitle.trim(), eventCategory, eventNote.trim() || undefined);
    setEventTitle('');
    setEventNote('');
    setShowAddForm(false);
  };

  const weekdaysHeader = lang === 'fa' ? JALALI_WEEKDAYS_SHORT_FA : WEEKDAYS_SHORT_EN;

  // Build uniform 7-cell rows so layout stays crisp across all mobile/web widths
  const paddedCells: Array<(typeof monthGrid.cells)[number] | null> = [
    ...Array.from({ length: monthGrid.leadingEmpty }, () => null),
    ...monthGrid.cells,
  ];
  while (paddedCells.length % 7 !== 0) {
    paddedCells.push(null);
  }
  const rows: Array<Array<(typeof monthGrid.cells)[number] | null>> = [];
  for (let i = 0; i < paddedCells.length; i += 7) {
    rows.push(paddedCells.slice(i, i + 7));
  }

  const bodyContent = (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Month Navigation Card */}
          <View style={[styles.calendarCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.monthHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity
                onPress={() => stepMonth(-1)}
                style={[styles.navArrow, { backgroundColor: theme.surfaceElevated }]}
              >
                <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={18} color={theme.text} />
              </TouchableOpacity>

              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: theme.text, fontSize: 17, fontWeight: '900' }}>
                  {JALALI_MONTH_NAMES_FA[viewMonth - 1]} {localizeDigits(viewYear, lang)}
                </Text>
                <TouchableOpacity onPress={jumpToToday} style={{ marginTop: 3 }}>
                  <Text style={{ color: theme.primary, fontSize: 11.5, fontWeight: '800' }}>
                    {lang === 'fa' ? 'برو به امروز 🦊' : 'Jump to Today 🦊'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => stepMonth(1)}
                style={[styles.navArrow, { backgroundColor: theme.surfaceElevated }]}
              >
                <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={theme.text} />
              </TouchableOpacity>
            </View>

            {/* Weekday Header */}
            <View style={[styles.weekRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {weekdaysHeader.map((wd, idx) => (
                <Text
                  key={wd}
                  style={[
                    styles.weekdayCell,
                    { color: idx === 6 ? theme.danger : theme.textMuted },
                  ]}
                >
                  {wd}
                </Text>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={{ gap: 6, marginTop: 6 }}>
              {rows.map((row, rIdx) => (
                <View key={rIdx} style={[styles.weekRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  {row.map((cell, cIdx) => {
                    if (!cell) {
                      return <View key={`empty-${rIdx}-${cIdx}`} style={styles.dayCellSpacer} />;
                    }
                    const isToday = cell.dateKey === todayKey;
                    const isFocused = cell.dateKey === focusedDateKey;
                    const hasTaskOrReminder =
                      state.tasks.some((t) => t.dateKey === cell.dateKey) ||
                      state.calendarEvents.some((e) => e.dateKey === cell.dateKey);
                    const hasOccasion = cell.occasions.length > 0;
                    const isFriday = cIdx === 6;

                    return (
                      <TouchableOpacity
                        key={cell.dateKey}
                        onPress={() => setFocusedDateKey(cell.dateKey)}
                        style={[
                          styles.dayCell,
                          {
                            backgroundColor: isFocused
                              ? theme.primary
                              : isToday
                              ? theme.primarySoft
                              : theme.surfaceElevated,
                            borderColor: isToday ? theme.primary : 'transparent',
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: isFocused
                              ? '#FFF'
                              : isFriday || cell.occasions.some((o) => o.tag === 'holiday')
                              ? theme.danger
                              : theme.text,
                            fontSize: 13,
                            fontWeight: isFocused || isToday ? '900' : '700',
                          }}
                        >
                          {localizeDigits(cell.jd, lang)}
                        </Text>

                        {/* Tiny indicator dots */}
                        <View style={styles.dotRow}>
                          {hasOccasion ? (
                            <View
                              style={[
                                styles.dot,
                                { backgroundColor: isFocused ? '#FFF' : theme.warning },
                              ]}
                            />
                          ) : null}
                          {hasTaskOrReminder ? (
                            <View
                              style={[
                                styles.dot,
                                { backgroundColor: isFocused ? '#FFF' : theme.accent },
                              ]}
                            />
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>

            {/* Legend */}
            <View style={[styles.legendRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.legendItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.dot, { backgroundColor: theme.warning }]} />
                <Text style={{ color: theme.textMuted, fontSize: 11 }}>
                  {lang === 'fa' ? 'مناسبت تقویم' : 'Occasion'}
                </Text>
              </View>
              <View style={[styles.legendItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.dot, { backgroundColor: theme.accent }]} />
                <Text style={{ color: theme.textMuted, fontSize: 11 }}>
                  {lang === 'fa' ? 'تسک یا رویداد شخصی' : 'Task / Event'}
                </Text>
              </View>
            </View>
          </View>

          {/* Focused Day Detail Card */}
          <View style={[styles.detailCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.detailHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontSize: 16, fontWeight: '900', textAlign: isRTL ? 'right' : 'left' }}>
                  {localizeDigits(focusedJalali.jd, lang)} {JALALI_MONTH_NAMES_FA[focusedJalali.jm - 1]}{' '}
                  {localizeDigits(focusedJalali.jy, lang)}
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 12, textAlign: isRTL ? 'right' : 'left' }}>
                  {focusedChip.full} ({focusedDateKey})
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  onSelectDateKey(focusedDateKey);
                  onClose?.();
                }}
                style={[styles.openDayBtn, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}
              >
                <Ionicons name="calendar-outline" size={14} color={theme.primary} />
                <Text style={{ color: theme.primary, fontSize: 11.5, fontWeight: '800' }}>
                  {lang === 'fa' ? 'باز کردن در پلنر' : 'Open in Planner'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Occasions on focused day */}
            {focusedCell && focusedCell.occasions.length > 0 ? (
              <View style={{ gap: 8, marginTop: 12 }}>
                {focusedCell.occasions.map((occ, idx) => (
                  <View
                    key={`${occ.jm}-${occ.jd}-${idx}`}
                    style={[
                      styles.eventBadge,
                      {
                        backgroundColor: theme.surfaceElevated,
                        borderColor: tagColor(occ.tag),
                        flexDirection: isRTL ? 'row-reverse' : 'row',
                      },
                    ]}
                  >
                    <Ionicons name="ribbon-outline" size={16} color={tagColor(occ.tag)} />
                    <Text
                      style={{
                        color: theme.text,
                        fontSize: 13,
                        fontWeight: '700',
                        flex: 1,
                        textAlign: isRTL ? 'right' : 'left',
                      }}
                    >
                      {lang === 'fa' ? occ.titleFa : occ.titleEn}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Summary counts of tasks & reminders on that day */}
            <View style={[styles.summaryStrip, { flexDirection: isRTL ? 'row-reverse' : 'row', marginTop: 12 }]}>
              <View style={[styles.miniStat, { backgroundColor: theme.surfaceElevated }]}>
                <Ionicons name="checkbox-outline" size={15} color={theme.primary} />
                <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '700' }}>
                  {localizeDigits(focusedTasks.length, lang)} {lang === 'fa' ? 'تسک' : 'Tasks'}
                </Text>
              </View>
              <View style={[styles.miniStat, { backgroundColor: theme.surfaceElevated }]}>
                <Ionicons name="alarm-outline" size={15} color={theme.info} />
                <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '700' }}>
                  {localizeDigits(focusedReminders.length, lang)} {lang === 'fa' ? 'اعلان' : 'Reminders'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAddForm((v) => !v)}
                style={[styles.miniStat, { backgroundColor: theme.primarySoft, borderWidth: 1, borderColor: theme.primary }]}
              >
                <Ionicons name="add-circle-outline" size={15} color={theme.primary} />
                <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '800' }}>
                  {lang === 'fa' ? 'ثبت رویداد / امتحان' : 'Add Event'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Add Event Inline Form */}
            {showAddForm ? (
              <View style={[styles.addForm, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                <TextInput
                  value={eventTitle}
                  onChangeText={setEventTitle}
                  placeholder={lang === 'fa' ? 'عنوان (مثلا امتحان ریاضی ۲ یا تحویل پروژه)' : 'Event or exam title...'}
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      color: theme.text,
                      textAlign: isRTL ? 'right' : 'left',
                    },
                  ]}
                />
                <View style={[styles.catRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  {(['exam', 'deadline', 'personal'] as const).map((cat) => {
                    const active = eventCategory === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setEventCategory(cat)}
                        style={[
                          styles.catPill,
                          {
                            backgroundColor: active ? theme.primarySoft : theme.surface,
                            borderColor: active ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <Text style={{ color: active ? theme.primary : theme.textSecondary, fontSize: 11.5, fontWeight: '800' }}>
                          {categoryLabel(cat)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <TextInput
                  value={eventNote}
                  onChangeText={setEventNote}
                  placeholder={lang === 'fa' ? 'توضیحات اختیاری (بودجه‌بندی، مکان، ساعت)...' : 'Optional note...'}
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      color: theme.text,
                      textAlign: isRTL ? 'right' : 'left',
                    },
                  ]}
                />
                <TouchableOpacity onPress={handleSaveEvent} style={[styles.saveEventBtn, { backgroundColor: theme.primary }]}>
                  <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '900' }}>
                    {lang === 'fa' ? 'ذخیره در تقویم' : 'Save Calendar Event'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* User Personal Calendar Events on selected day */}
            {focusedEvents.length > 0 ? (
              <View style={{ gap: 8, marginTop: 12 }}>
                {focusedEvents.map((ev) => (
                  <View
                    key={ev.id}
                    style={[
                      styles.personalEventCard,
                      {
                        backgroundColor: theme.surfaceElevated,
                        borderColor: theme.border,
                        flexDirection: isRTL ? 'row-reverse' : 'row',
                      },
                    ]}
                  >
                    <View style={[styles.catDot, { backgroundColor: tagColor(ev.category) }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.text, fontSize: 13.5, fontWeight: '800', textAlign: isRTL ? 'right' : 'left' }}>
                        {ev.title}
                      </Text>
                      <Text style={{ color: theme.textMuted, fontSize: 11, textAlign: isRTL ? 'right' : 'left' }}>
                        {categoryLabel(ev.category)} {ev.note ? `• ${ev.note}` : ''}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => deleteCalendarEvent(ev.id)} style={{ padding: 6 }}>
                      <Ionicons name="trash-outline" size={16} color={theme.danger} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          {/* All Occasions of Current Viewed Month */}
          <View style={[styles.detailCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text
              style={{
                color: theme.text,
                fontSize: 14.5,
                fontWeight: '900',
                marginBottom: 10,
                textAlign: isRTL ? 'right' : 'left',
              }}
            >
              {lang === 'fa'
                ? `مناسبت‌های ${JALALI_MONTH_NAMES_FA[viewMonth - 1]}`
                : `Occasions in ${JALALI_MONTH_NAMES_FA[viewMonth - 1]}`}
            </Text>
            {monthOccasions.length === 0 ? (
              <Text style={{ color: theme.textMuted, fontSize: 12.5, textAlign: isRTL ? 'right' : 'left' }}>
                {lang === 'fa' ? 'در این ماه مناسبت ثابتی ثبت نشده است.' : 'No fixed occasions this month.'}
              </Text>
            ) : (
              <View style={{ gap: 8 }}>
                {monthOccasions.map((c) =>
                  c.occasions.map((occ, idx) => (
                    <TouchableOpacity
                      key={`${c.dateKey}-${idx}`}
                      onPress={() => setFocusedDateKey(c.dateKey)}
                      style={[
                        styles.monthOccRow,
                        {
                          backgroundColor: theme.surfaceElevated,
                          flexDirection: isRTL ? 'row-reverse' : 'row',
                        },
                      ]}
                    >
                      <View style={[styles.occDayPill, { backgroundColor: `${tagColor(occ.tag)}22` }]}>
                        <Text style={{ color: tagColor(occ.tag), fontSize: 12, fontWeight: '900' }}>
                          {localizeDigits(c.jd, lang)}
                        </Text>
                      </View>
                      <Text
                        style={{
                          color: theme.textSecondary,
                          fontSize: 13,
                          fontWeight: '700',
                          flex: 1,
                          textAlign: isRTL ? 'right' : 'left',
                        }}
                      >
                        {lang === 'fa' ? occ.titleFa : occ.titleEn}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </View>
        </ScrollView>
  );

  if (embedded) {
    return <View style={styles.embeddedWrap}>{bodyContent}</View>;
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
              {lang === 'fa' ? 'تقویم شمسی و مناسبت‌ها 📅' : 'Jalali Calendar & Occasions 📅'}
            </Text>
            <Text style={{ color: theme.textMuted, fontSize: 12, textAlign: isRTL ? 'right' : 'left' }}>
              {lang === 'fa'
                ? 'مناسبت‌های دانشجویی، ملی، امتحان‌ها و برنامه‌های هر روز'
                : 'National & student occasions, exams, and daily schedules'}
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
  scrollContent: { padding: 16, gap: 14, paddingBottom: 40 },
  calendarCard: { borderRadius: 24, borderWidth: 1, padding: 14 },
  monthHeader: { alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  navArrow: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  weekRow: { justifyContent: 'space-between', gap: 5 },
  weekdayCell: { flex: 1, textAlign: 'center', fontSize: 11.5, fontWeight: '800', paddingVertical: 4 },
  dayCellSpacer: { flex: 1, height: 42 },
  dayCell: {
    flex: 1,
    height: 44,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  dotRow: { flexDirection: 'row', gap: 3, height: 5 },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  legendRow: { gap: 14, marginTop: 12, justifyContent: 'center' },
  legendItem: { alignItems: 'center', gap: 6 },
  detailCard: { borderRadius: 22, borderWidth: 1, padding: 16 },
  detailHeader: { alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  openDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  eventBadge: { alignItems: 'center', gap: 8, padding: 10, borderRadius: 14, borderWidth: 1 },
  summaryStrip: { gap: 8, flexWrap: 'wrap' },
  miniStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
  },
  addForm: { marginTop: 12, padding: 12, borderRadius: 16, borderWidth: 1, gap: 10 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13.5 },
  catRow: { gap: 8, flexWrap: 'wrap' },
  catPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  saveEventBtn: { paddingVertical: 11, borderRadius: 12, alignItems: 'center' },
  personalEventCard: { alignItems: 'center', gap: 10, padding: 10, borderRadius: 14, borderWidth: 1 },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  monthOccRow: { alignItems: 'center', gap: 10, padding: 9, borderRadius: 13 },
  occDayPill: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
