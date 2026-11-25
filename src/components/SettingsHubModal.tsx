import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Text as RNText,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RELEASE_CONFIG } from '../config/releaseConfig';
import { localizeDigits } from '../i18n/translations';
import { useFoxStore } from '../store/FoxStoreContext';
import { THEME_PRESETS } from '../theme/tokens';
import { FONT_PRESETS, FONT_SCALE_PRESETS, resolveFontFamilyForWeight } from '../theme/typography';
import type { FontFamilyPreset, FontScalePreset, ThemePresetId } from '../types/planner';
import { isValidPinFormat } from '../utils/security';
import { playSoundByStyle, SOUND_STYLES } from '../utils/soundEffects';
import { checkForGitHubUpdate, isSafeHttpsUrl, type UpdateManifest } from '../utils/updater';
import { FoxMascot } from './FoxMascot';
import { Text, TextInput } from './FoxText';
import { UpdateModal } from './UpdateModal';

type SettingsSection = 'menu' | 'themes' | 'fonts' | 'audio' | 'security' | 'system' | 'creator';

/** Multi-panel corner Settings Drawer triggered from the top-right 3-line / gear icon. */
export function SettingsHubModal() {
  const {
    state,
    theme,
    strings,
    isRTL,
    fontsReady,
    settingsMenuOpen,
    setSettingsMenuOpen,
    setThemePreset,
    setFontFamilyPreset,
    setFontScalePreset,
    setSoundStyle,
    toggleCelebrationSounds,
    reopenOnboarding,
    setLanguage,
    configurePin,
    disablePin,
    lockNow,
    exportBackupJson,
    importBackupJson,
  } = useFoxStore();

  const lang = state.language;
  const [section, setSection] = useState<SettingsSection>('menu');

  // Security states
  const [pinInput, setPinInput] = useState('');
  const [pinStatusMsg, setPinStatusMsg] = useState('');
  const [backupText, setBackupText] = useState('');
  const [backupFeedback, setBackupFeedback] = useState('');

  // Updates
  const [updateStatusMsg, setUpdateStatusMsg] = useState('');
  const [foundUpdate, setFoundUpdate] = useState<UpdateManifest | null>(null);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);

  const closeModal = () => {
    setSection('menu');
    setSettingsMenuOpen(false);
  };

  const handleOpenExternalUrl = async (rawUrl: string) => {
    if (!isSafeHttpsUrl(rawUrl)) return;
    try {
      await Linking.openURL(rawUrl);
    } catch {
      Alert.alert(
        'Fox Planner',
        lang === 'fa' ? 'امکان باز کردن لینک در این دستگاه وجود ندارد.' : 'Cannot open link on this device.'
      );
    }
  };

  const handleSavePin = async () => {
    if (!isValidPinFormat(pinInput)) {
      setPinStatusMsg(strings.security.pinPlaceholder);
      return;
    }
    await configurePin(pinInput);
    setPinInput('');
    setPinStatusMsg(strings.security.pinSaved);
  };

  const handleRestoreBackup = () => {
    const ok = importBackupJson(backupText);
    setBackupFeedback(
      ok
        ? lang === 'fa'
          ? 'بازیابی اطلاعات با موفقیت انجام شد!'
          : 'Backup restored successfully!'
        : lang === 'fa'
        ? 'فرمت فایل JSON نامعتبر است.'
        : 'Invalid Fox Planner JSON backup.'
    );
  };

  const minimalThemes = (Object.keys(THEME_PRESETS) as ThemePresetId[]).filter(
    (k) => THEME_PRESETS[k].category === 'minimal'
  );
  const patternedThemes = (Object.keys(THEME_PRESETS) as ThemePresetId[]).filter(
    (k) => THEME_PRESETS[k].category === 'patterned'
  );

  const activeFontMeta = FONT_PRESETS[state.fontFamilyPreset] ?? FONT_PRESETS.vazirmatn;
  const activeScaleMeta = FONT_SCALE_PRESETS[state.fontScalePreset] ?? FONT_SCALE_PRESETS.md;
  const activeSoundMeta = SOUND_STYLES.find((s) => s.id === state.soundStyle) ?? SOUND_STYLES[0];

  const menuCards: Array<{
    key: Exclude<SettingsSection, 'menu'>;
    icon: string;
    color: string;
    titleFa: string;
    titleEn: string;
    subFa: string;
    subEn: string;
  }> = [
    {
      key: 'themes',
      icon: 'color-palette-outline',
      color: theme.primary,
      titleFa: 'تم‌ها و طرح‌های پس‌زمینه',
      titleEn: 'Themes & Decorative Patterns',
      subFa: `${theme.emoji} ${theme.nameFa}`,
      subEn: `${theme.emoji} ${theme.nameEn}`,
    },
    {
      key: 'fonts',
      icon: 'text-outline',
      color: theme.accent,
      titleFa: 'فونت فارسی و اندازه متن',
      titleEn: 'Persian Fonts & Text Size',
      subFa: `${activeFontMeta.nameFa} • اندازه ${activeScaleMeta.labelFa}`,
      subEn: `${activeFontMeta.nameEn} • Size ${activeScaleMeta.labelEn}`,
    },
    {
      key: 'audio',
      icon: 'musical-notes-outline',
      color: theme.success,
      titleFa: 'افکت‌های صوتی و تور روباه',
      titleEn: 'Sound Effects & Live Tour',
      subFa: state.celebrationSoundsEnabled
        ? `${activeSoundMeta.emoji} ${activeSoundMeta.nameFa}`
        : 'صدا خاموش • بازپخش تور زنده',
      subEn: state.celebrationSoundsEnabled
        ? `${activeSoundMeta.emoji} ${activeSoundMeta.nameEn}`
        : 'Audio muted • Replay live tour',
    },
    {
      key: 'security',
      icon: 'shield-checkmark-outline',
      color: theme.info,
      titleFa: 'امنیت، قفل PIN و بکاپ',
      titleEn: 'Security PIN & Backup',
      subFa: state.security.pinEnabled ? 'قفل برنامه فعال است' : 'قفل غیرفعال • خروجی/بازیابی JSON',
      subEn: state.security.pinEnabled ? 'PIN active' : 'No PIN • JSON export/import',
    },
    {
      key: 'system',
      icon: 'globe-outline',
      color: theme.warning,
      titleFa: 'زبان برنامه و آپدیت نسخه',
      titleEn: 'Language & Updates',
      subFa:
        lang === 'fa'
          ? `فارسی • نسخه ${localizeDigits(RELEASE_CONFIG.appVersion, 'fa')}`
          : `English • v${RELEASE_CONFIG.appVersion}`,
      subEn: lang === 'fa' ? `Persian • v${RELEASE_CONFIG.appVersion}` : `English • v${RELEASE_CONFIG.appVersion}`,
    },
    {
      key: 'creator',
      icon: 'paper-plane-outline',
      color: theme.info,
      titleFa: 'کانال تلگرام و ارتباط با سازنده',
      titleEn: 'Telegram Channel & Creator',
      subFa: '@otaqe_pni  •  @p_n_i_7',
      subEn: '@otaqe_pni  •  @p_n_i_7',
    },
  ];

  const sectionTitle = () => {
    if (section === 'menu') return lang === 'fa' ? 'منو و تنظیمات فاکس پلنر ⚙️' : 'Settings & Menu ⚙️';
    const found = menuCards.find((m) => m.key === section);
    return found ? (lang === 'fa' ? found.titleFa : found.titleEn) : '';
  };

  return (
    <Modal visible={settingsMenuOpen} animationType="slide" onRequestClose={closeModal}>
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        {/* Top Drawer Bar */}
        <View
          style={[
            styles.header,
            { backgroundColor: theme.surface, borderBottomColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' },
          ]}
        >
          {section !== 'menu' ? (
            <TouchableOpacity
              onPress={() => setSection('menu')}
              style={[
                styles.backBtn,
                { backgroundColor: theme.surfaceElevated, borderColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' },
              ]}
            >
              <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={18} color={theme.primary} />
              <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '800' }}>
                {lang === 'fa' ? 'منو' : 'Menu'}
              </Text>
            </TouchableOpacity>
          ) : (
            <FoxMascot mood="study" size={38} theme={theme} />
          )}

          <Text numberOfLines={1} style={[styles.headerTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
            {sectionTitle()}
          </Text>

          <TouchableOpacity
            onPress={closeModal}
            style={[styles.closeBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
          >
            <Ionicons name="close" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* PANEL 0: Clean Categorized Menu */}
          {section === 'menu' ? (
            <View style={{ gap: 10 }}>
              {menuCards.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => {
                    if (item.key === 'security') {
                      setBackupText(exportBackupJson());
                      setBackupFeedback('');
                      setPinStatusMsg('');
                    }
                    setSection(item.key);
                  }}
                  style={[
                    styles.menuCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                    },
                  ]}
                >
                  <View style={[styles.menuIconWrap, { backgroundColor: `${item.color}1F` }]}>
                    <Ionicons name={item.icon as never} size={22} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontSize: 14.5, fontWeight: '900', textAlign: isRTL ? 'right' : 'left' }}>
                      {lang === 'fa' ? item.titleFa : item.titleEn}
                    </Text>
                    <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2, textAlign: isRTL ? 'right' : 'left' }}>
                      {lang === 'fa' ? item.subFa : item.subEn}
                    </Text>
                  </View>
                  <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={theme.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          {/* PANEL 1: Themes & Patterns Gallery */}
          {section === 'themes' ? (
            <View style={{ gap: 14 }}>
              <Text style={[styles.groupHeading, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                {lang === 'fa' ? '۱. تم‌های ساده و مینیمال (بدون شلوغی)' : '1. Simple & Minimalist'}
              </Text>
              {minimalThemes.map((pid) => {
                const preset = THEME_PRESETS[pid];
                const active = state.theme === pid;
                return (
                  <TouchableOpacity
                    key={pid}
                    onPress={() => setThemePreset(pid)}
                    style={[
                      styles.themeRow,
                      {
                        backgroundColor: preset.surface,
                        borderColor: active ? theme.primary : preset.border,
                        borderWidth: active ? 2 : 1,
                        flexDirection: isRTL ? 'row-reverse' : 'row',
                      },
                    ]}
                  >
                    <View style={[styles.themeIconCircle, { backgroundColor: preset.primarySoft }]}>
                      <Text style={{ fontSize: 18 }}>{preset.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: preset.text, fontSize: 14, fontWeight: '900', textAlign: isRTL ? 'right' : 'left' }}>
                        {lang === 'fa' ? preset.nameFa : preset.nameEn}
                      </Text>
                      <Text style={{ color: preset.textMuted, fontSize: 11.5, marginTop: 2, textAlign: isRTL ? 'right' : 'left' }}>
                        {lang === 'fa' ? preset.taglineFa : preset.taglineEn}
                      </Text>
                    </View>
                    {active ? <Ionicons name="checkmark-circle" size={22} color={theme.primary} /> : null}
                  </TouchableOpacity>
                );
              })}

              <Text style={[styles.groupHeading, { color: theme.textSecondary, marginTop: 6, textAlign: isRTL ? 'right' : 'left' }]}>
                {lang === 'fa' ? '۲. تم‌های طرح‌دار و فانتزی با شکلک ✨' : '2. Patterned & Illustrated ✨'}
              </Text>
              {patternedThemes.map((pid) => {
                const preset = THEME_PRESETS[pid];
                const active = state.theme === pid;
                return (
                  <TouchableOpacity
                    key={pid}
                    onPress={() => setThemePreset(pid)}
                    style={[
                      styles.themeRow,
                      {
                        backgroundColor: preset.surface,
                        borderColor: active ? theme.primary : preset.border,
                        borderWidth: active ? 2 : 1,
                        flexDirection: isRTL ? 'row-reverse' : 'row',
                      },
                    ]}
                  >
                    <View style={[styles.themeIconCircle, { backgroundColor: preset.primarySoft }]}>
                      <Text style={{ fontSize: 17 }}>{preset.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: preset.text, fontSize: 14, fontWeight: '900', textAlign: isRTL ? 'right' : 'left' }}>
                        {lang === 'fa' ? preset.nameFa : preset.nameEn}
                      </Text>
                      <Text style={{ color: preset.textMuted, fontSize: 11.5, marginTop: 2, textAlign: isRTL ? 'right' : 'left' }}>
                        {lang === 'fa' ? preset.taglineFa : preset.taglineEn}
                      </Text>
                    </View>
                    {active ? <Ionicons name="checkmark-circle" size={22} color={theme.primary} /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}

          {/* PANEL 2: Persian Font Family & Live Text Size Controller */}
          {section === 'fonts' ? (
            <View style={{ gap: 14 }}>
              {/* Live Sample Preview Card */}
              <View style={[styles.panelBox, { backgroundColor: theme.surface, borderColor: theme.primary }]}>
                <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '900', textAlign: isRTL ? 'right' : 'left' }}>
                  {lang === 'fa' ? 'پیش‌نمایش زنده فونت و اندازه متن 🦊' : 'Live Font & Scale Preview 🦊'}
                </Text>
                <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800', marginTop: 4, textAlign: isRTL ? 'right' : 'left' }}>
                  {lang === 'fa'
                    ? 'برنامه‌ریزی با آرامش، موفقیت بدون استرس!'
                    : 'Calm planning, focused study, brighter progress!'}
                </Text>
                <Text style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 20, textAlign: isRTL ? 'right' : 'left' }}>
                  {lang === 'fa'
                    ? 'هر تغییر در فونت یا سایز بلافاصله در تمام صفحات فاکس پلنر اعمال می‌شود.'
                    : 'Every font style and size adjustment applies instantly across the whole app.'}
                </Text>
              </View>

              {/* Font Scale Selector */}
              <View style={[styles.panelBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.panelTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
                  {lang === 'fa' ? 'اندازه نوشته‌های داخل برنامه 🔍' : 'App Text Size 🔍'}
                </Text>
                <View style={[styles.scaleGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  {(['sm', 'md', 'lg', 'xl'] as FontScalePreset[]).map((scKey) => {
                    const sc = FONT_SCALE_PRESETS[scKey];
                    const active = state.fontScalePreset === scKey;
                    return (
                      <TouchableOpacity
                        key={scKey}
                        onPress={() => setFontScalePreset(scKey)}
                        style={[
                          styles.scalePill,
                          {
                            backgroundColor: active ? theme.primarySoft : theme.surfaceElevated,
                            borderColor: active ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <Text style={{ color: active ? theme.primary : theme.text, fontSize: 12.5, fontWeight: '900' }}>
                          {lang === 'fa' ? sc.labelFa : sc.labelEn}
                        </Text>
                        <Text style={{ color: theme.textMuted, fontSize: 10.5, marginTop: 2 }}>
                          {localizeDigits(Math.round(sc.multiplier * 100), lang)}%
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Persian Font Family Cards (rendered using their own actual TTF font!) */}
              <Text style={[styles.groupHeading, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                {lang === 'fa' ? 'انتخاب قلم (فونت) فارسی ✍️' : 'Select Font Family ✍️'}
              </Text>
              {(Object.keys(FONT_PRESETS) as FontFamilyPreset[]).map((fKey) => {
                const fMeta = FONT_PRESETS[fKey];
                const active = state.fontFamilyPreset === fKey;
                const ownBold = fontsReady ? resolveFontFamilyForWeight(fKey, '800') : undefined;
                const ownRegular = fontsReady ? resolveFontFamilyForWeight(fKey, '400') : undefined;

                return (
                  <TouchableOpacity
                    key={fKey}
                    onPress={() => setFontFamilyPreset(fKey)}
                    style={[
                      styles.themeRow,
                      {
                        backgroundColor: theme.surface,
                        borderColor: active ? theme.primary : theme.border,
                        borderWidth: active ? 2 : 1,
                        flexDirection: isRTL ? 'row-reverse' : 'row',
                      },
                    ]}
                  >
                    <View style={[styles.fontBadge, { backgroundColor: active ? theme.primarySoft : theme.surfaceElevated }]}>
                      <RNText
                        style={{
                          color: active ? theme.primary : theme.text,
                          fontSize: 18,
                          ...(ownBold ? { fontFamily: ownBold } : { fontWeight: '900' }),
                        }}
                      >
                        آ ب
                      </RNText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <RNText
                        style={{
                          color: theme.text,
                          fontSize: 15,
                          textAlign: isRTL ? 'right' : 'left',
                          ...(ownBold ? { fontFamily: ownBold } : { fontWeight: '800' }),
                        }}
                      >
                        {lang === 'fa' ? fMeta.nameFa : fMeta.nameEn}
                      </RNText>
                      <RNText
                        style={{
                          color: theme.textSecondary,
                          fontSize: 12.5,
                          marginTop: 2,
                          textAlign: isRTL ? 'right' : 'left',
                          ...(ownRegular ? { fontFamily: ownRegular } : {}),
                        }}
                      >
                        {lang === 'fa' ? `${fMeta.sampleFa} — ${fMeta.descFa}` : fMeta.descEn}
                      </RNText>
                    </View>
                    {active ? <Ionicons name="checkmark-circle" size={22} color={theme.primary} /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}

          {/* PANEL 3: Studio Sound Effects Gallery & Live Tour */}
          {section === 'audio' ? (
            <View style={{ gap: 12 }}>
              <View style={[styles.panelBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.panelTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
                  {lang === 'fa' ? 'افکت‌های صوتی متنوع روباه 🎵✨' : 'Fox Studio Sound Effects 🎵✨'}
                </Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12.5, lineHeight: 20, textAlign: isRTL ? 'right' : 'left' }}>
                  {lang === 'fa'
                    ? 'صدای مورد علاقه‌ات را انتخاب کن تا هنگام انجام کارها و تشویق‌ها پخش شود. روی هر صدا بزن تا بشنوی:'
                    : 'Choose your preferred celebratory chime and tap play to audition each effect:'}
                </Text>

                <TouchableOpacity
                  onPress={() => {
                    const next = !state.celebrationSoundsEnabled;
                    toggleCelebrationSounds();
                    if (next) playSoundByStyle(state.soundStyle, true);
                  }}
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: state.celebrationSoundsEnabled ? theme.successSoft : theme.surfaceElevated,
                      borderColor: state.celebrationSoundsEnabled ? theme.success : theme.border,
                    },
                  ]}
                >
                  <Text style={{ color: state.celebrationSoundsEnabled ? theme.success : theme.text, fontWeight: '900' }}>
                    {state.celebrationSoundsEnabled
                      ? lang === 'fa'
                        ? '🔊 افکت‌های صوتی روشن است (برای تغییر بزن)'
                        : '🔊 Audio Effects: ON'
                      : lang === 'fa'
                      ? '🔇 افکت‌های صوتی خاموش است (برای روشن شدن بزن)'
                      : '🔇 Audio Effects: OFF'}
                  </Text>
                </TouchableOpacity>

                <View style={{ gap: 8, marginTop: 4 }}>
                  {SOUND_STYLES.map((sItem) => {
                    const selected = state.soundStyle === sItem.id;
                    return (
                      <TouchableOpacity
                        key={sItem.id}
                        onPress={() => {
                          setSoundStyle(sItem.id);
                          playSoundByStyle(sItem.id, true);
                        }}
                        style={[
                          styles.soundRow,
                          {
                            backgroundColor: selected ? theme.primarySoft : theme.surfaceElevated,
                            borderColor: selected ? theme.primary : theme.border,
                            flexDirection: isRTL ? 'row-reverse' : 'row',
                          },
                        ]}
                      >
                        <Text style={{ fontSize: 20 }}>{sItem.emoji}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: theme.text, fontSize: 13.5, fontWeight: '900', textAlign: isRTL ? 'right' : 'left' }}>
                            {lang === 'fa' ? sItem.nameFa : sItem.nameEn}
                          </Text>
                          <Text style={{ color: theme.textMuted, fontSize: 11.5, textAlign: isRTL ? 'right' : 'left' }}>
                            {lang === 'fa' ? sItem.descFa : sItem.descEn}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => playSoundByStyle(sItem.id, true)}
                          style={[styles.playMiniBtn, { backgroundColor: theme.surface }]}
                        >
                          <Ionicons name="play" size={14} color={theme.primary} />
                        </TouchableOpacity>
                        {selected ? <Ionicons name="checkmark-circle" size={19} color={theme.primary} /> : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={[styles.panelBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.panelTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
                  {lang === 'fa' ? 'تور تعاملی قدم‌به‌قدم با روباه 🦊💬' : 'Interactive Step-by-Step Fox Tour 🦊💬'}
                </Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12.5, lineHeight: 20, textAlign: isRTL ? 'right' : 'left' }}>
                  {lang === 'fa'
                    ? 'روباه شخصاً تو را به داخل تک‌تک بخش‌های برنامه می‌برد و با حباب گفتگو قسمت‌های هر بخش را توضیح می‌دهد.'
                    : 'Let Fox walk you directly through every real tab and explain each feature with speech bubbles.'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    closeModal();
                    reopenOnboarding();
                  }}
                  style={[styles.actionBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}
                >
                  <Text style={{ color: '#FFF', fontWeight: '900' }}>
                    {lang === 'fa' ? 'شروع تور زنده روی بخش‌های برنامه 🦊' : 'Start Live Guided Tour 🦊'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {/* PANEL 4: Security PIN & Backup */}
          {section === 'security' ? (
            <View style={{ gap: 12 }}>
              <View style={[styles.panelBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.panelTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
                  🔐 {strings.security.setPinTitle}
                </Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12.5, textAlign: isRTL ? 'right' : 'left' }}>
                  {state.security.pinEnabled ? strings.wellness.pinStatusOn : strings.wellness.pinStatusOff}
                </Text>
                <TextInput
                  value={pinInput}
                  onChangeText={(t) => setPinInput(t.replace(/[^\d]/g, '').slice(0, 6))}
                  keyboardType="numeric"
                  secureTextEntry
                  placeholder={strings.security.pinPlaceholder}
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.input,
                    { backgroundColor: theme.surfaceElevated, borderColor: theme.border, color: theme.text },
                  ]}
                />
                {pinStatusMsg ? <Text style={{ color: theme.info, fontSize: 12 }}>{pinStatusMsg}</Text> : null}

                <View style={[styles.rowWrap, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <TouchableOpacity
                    onPress={() => void handleSavePin()}
                    style={[styles.miniTestBtn, { backgroundColor: theme.primary }]}
                  >
                    <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 12 }}>{strings.planner.save}</Text>
                  </TouchableOpacity>
                  {state.security.pinEnabled ? (
                    <>
                      <TouchableOpacity
                        onPress={() => {
                          closeModal();
                          lockNow();
                        }}
                        style={[styles.miniTestBtn, { backgroundColor: theme.infoSoft }]}
                      >
                        <Text style={{ color: theme.info, fontWeight: '800', fontSize: 12 }}>
                          {lang === 'fa' ? 'قفل همین الان' : 'Lock Now'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          disablePin();
                          setPinStatusMsg(lang === 'fa' ? 'قفل غیرفعال شد.' : 'PIN disabled.');
                        }}
                        style={[styles.miniTestBtn, { backgroundColor: theme.dangerSoft }]}
                      >
                        <Text style={{ color: theme.danger, fontWeight: '800', fontSize: 12 }}>
                          {strings.wellness.disablePinBtn}
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : null}
                </View>
              </View>

              <View style={[styles.panelBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.panelTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
                  💾 {strings.wellness.exportBackup} / {strings.wellness.importBackup}
                </Text>
                <TextInput
                  value={backupText}
                  onChangeText={setBackupText}
                  multiline
                  style={[
                    styles.backupInput,
                    { backgroundColor: theme.surfaceElevated, borderColor: theme.border, color: theme.text },
                  ]}
                />
                {backupFeedback ? <Text style={{ color: theme.success, fontSize: 12 }}>{backupFeedback}</Text> : null}
                <View style={[styles.rowWrap, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <TouchableOpacity
                    onPress={() => {
                      setBackupText(exportBackupJson());
                      setBackupFeedback(lang === 'fa' ? 'بکاپ تازه ساخته شد.' : 'Backup refreshed.');
                    }}
                    style={[
                      styles.miniTestBtn,
                      { backgroundColor: theme.surfaceElevated, borderWidth: 1, borderColor: theme.border },
                    ]}
                  >
                    <Text style={{ color: theme.text, fontWeight: '800', fontSize: 12 }}>{strings.wellness.exportBackup}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleRestoreBackup}
                    style={[styles.miniTestBtn, { backgroundColor: theme.info }]}
                  >
                    <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 12 }}>{strings.wellness.importBackup}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : null}

          {/* PANEL 5: Language & App Updates */}
          {section === 'system' ? (
            <View style={{ gap: 12 }}>
              <View style={[styles.panelBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.panelTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
                  🌐 {lang === 'fa' ? 'انتخاب زبان برنامه' : 'App Language'}
                </Text>
                <View style={[styles.rowWrap, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <TouchableOpacity
                    onPress={() => setLanguage('fa')}
                    style={[
                      styles.langPill,
                      {
                        backgroundColor: lang === 'fa' ? theme.primarySoft : theme.surfaceElevated,
                        borderColor: lang === 'fa' ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text style={{ color: lang === 'fa' ? theme.primary : theme.text, fontWeight: '900' }}>🇮🇷 فارسی</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setLanguage('en')}
                    style={[
                      styles.langPill,
                      {
                        backgroundColor: lang === 'en' ? theme.primarySoft : theme.surfaceElevated,
                        borderColor: lang === 'en' ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text style={{ color: lang === 'en' ? theme.primary : theme.text, fontWeight: '900' }}>🇬🇧 English</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.panelBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.panelTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
                  🔄 {strings.updates.checkUpdateBtn}
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 12, textAlign: isRTL ? 'right' : 'left' }}>
                  {strings.updates.versionLabel}: v{localizeDigits(RELEASE_CONFIG.appVersion, lang)}
                  {updateStatusMsg ? `  •  ${updateStatusMsg}` : ''}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setUpdateStatusMsg('...');
                    void checkForGitHubUpdate(RELEASE_CONFIG).then((res) => {
                      if (res.status === 'update_available') {
                        setFoundUpdate(res.latest);
                        setUpdateModalOpen(true);
                        setUpdateStatusMsg(`v${res.latest.version}`);
                      } else if (res.status === 'up_to_date') {
                        setUpdateStatusMsg(strings.updates.upToDateMsg);
                      } else if (res.status === 'not_configured') {
                        setUpdateStatusMsg(strings.updates.notConfiguredMsg);
                      } else {
                        setUpdateStatusMsg(strings.updates.errorMsg);
                      }
                    });
                  }}
                  style={[styles.actionBtn, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}
                >
                  <Text style={{ color: theme.primary, fontWeight: '900' }}>
                    {strings.updates.checkUpdateBtn}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {/* PANEL 6: Creator & Telegram Community */}
          {section === 'creator' ? (
            <View style={[styles.panelBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.panelTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
                🦊 {lang === 'fa' ? 'کانال تلگرام و ارتباط با سازنده' : 'Official Telegram & Creator'}
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12.5, lineHeight: 20, textAlign: isRTL ? 'right' : 'left' }}>
                {lang === 'fa'
                  ? 'برای دنبال کردن آپدیت‌ها، ارسال پیشنهاد و ارتباط مستقیم با سازنده فاکس پلنر:'
                  : 'Follow updates, study notes, and message the Fox Planner creator directly:'}
              </Text>

              <TouchableOpacity
                onPress={() => void handleOpenExternalUrl('https://t.me/otaqe_pni')}
                style={[styles.tgCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.info, flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              >
                <View style={[styles.tgIcon, { backgroundColor: theme.infoSoft }]}>
                  <Ionicons name="megaphone-outline" size={20} color={theme.info} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontSize: 14, fontWeight: '900', textAlign: isRTL ? 'right' : 'left' }}>
                    {lang === 'fa' ? 'کانال تلگرامی سازنده (اتاق PNI)' : 'Telegram Channel (@otaqe_pni)'}
                  </Text>
                  <Text style={{ color: theme.info, fontSize: 12, textAlign: isRTL ? 'right' : 'left' }}>
                    https://t.me/otaqe_pni
                  </Text>
                </View>
                <Ionicons name="open-outline" size={18} color={theme.info} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => void handleOpenExternalUrl('https://t.me/p_n_i_7')}
                style={[styles.tgCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.primary, flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              >
                <View style={[styles.tgIcon, { backgroundColor: theme.primarySoft }]}>
                  <Ionicons name="person-circle-outline" size={21} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontSize: 14, fontWeight: '900', textAlign: isRTL ? 'right' : 'left' }}>
                    {lang === 'fa' ? 'آیدی مالک و سازنده' : 'Creator Contact (@p_n_i_7)'}
                  </Text>
                  <Text style={{ color: theme.primary, fontSize: 12, textAlign: isRTL ? 'right' : 'left' }}>
                    https://t.me/p_n_i_7
                  </Text>
                </View>
                <Ionicons name="open-outline" size={18} color={theme.primary} />
              </TouchableOpacity>
            </View>
          ) : null}
        </ScrollView>

        <UpdateModal
          visible={updateModalOpen}
          manifest={foundUpdate}
          currentVersion={RELEASE_CONFIG.appVersion}
          onClose={() => setUpdateModalOpen(false)}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 10,
  },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '900' },
  backBtn: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 42 },
  menuCard: {
    alignItems: 'center',
    gap: 12,
    padding: 15,
    borderRadius: 22,
    borderWidth: 1,
  },
  menuIconWrap: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  groupHeading: { fontSize: 13, fontWeight: '900' },
  themeRow: { alignItems: 'center', gap: 12, padding: 13, borderRadius: 20 },
  themeIconCircle: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  fontBadge: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  scaleGrid: { gap: 8 },
  scalePill: { flex: 1, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5, alignItems: 'center' },
  soundRow: { alignItems: 'center', gap: 10, padding: 11, borderRadius: 16, borderWidth: 1 },
  playMiniBtn: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  panelBox: { borderRadius: 22, borderWidth: 1, padding: 16, gap: 10 },
  panelTitle: { fontSize: 15.5, fontWeight: '900' },
  actionBtn: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 15, borderWidth: 1, alignItems: 'center' },
  rowWrap: { flexWrap: 'wrap', gap: 8 },
  miniTestBtn: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 13 },
  input: { borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  backupInput: {
    borderWidth: 1,
    borderRadius: 13,
    padding: 10,
    minHeight: 140,
    maxHeight: 220,
    fontSize: 11,
    textAlignVertical: 'top',
  },
  langPill: { flex: 1, paddingVertical: 12, borderRadius: 15, borderWidth: 1.5, alignItems: 'center' },
  tgCard: { alignItems: 'center', gap: 10, padding: 13, borderRadius: 18, borderWidth: 1 },
  tgIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
