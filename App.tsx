import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Animated, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from './src/components/FoxText';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DailyMoodPrompt } from './src/components/DailyMoodPrompt';
import { FoxCelebrationToast } from './src/components/FoxCelebrationToast';
import { FoxLoader } from './src/components/FoxLoader';
import { FoxSplashIntro } from './src/components/FoxSplashIntro';
import { LockScreen } from './src/components/LockScreen';
import { OnboardingModal } from './src/components/OnboardingModal';
import { ReminderAlertModal } from './src/components/ReminderAlertModal';
import { SettingsHubModal } from './src/components/SettingsHubModal';
import { ThemeBackdrop } from './src/components/ThemeBackdrop';
import { UpdateModal } from './src/components/UpdateModal';
import { RELEASE_CONFIG } from './src/config/releaseConfig';
import { localizeDigits } from './src/i18n/translations';
import { NotesScreen } from './src/screens/NotesScreen';
import { PlannerScreen } from './src/screens/PlannerScreen';
import { PomodoroScreen } from './src/screens/PomodoroScreen';
import { ProgressScreen } from './src/screens/ProgressScreen';
import { WellnessScreen } from './src/screens/WellnessScreen';
import { FoxStoreProvider, useFoxStore } from './src/store/FoxStoreContext';
import type { TabKey } from './src/types/planner';
import { checkForGitHubUpdate, type UpdateManifest } from './src/utils/updater';

const TAB_ICONS: Record<TabKey, { active: string; inactive: string }> = {
  planner: { active: 'calendar', inactive: 'calendar-outline' },
  pomodoro: { active: 'timer', inactive: 'timer-outline' },
  notes: { active: 'journal', inactive: 'journal-outline' },
  progress: { active: 'bar-chart', inactive: 'bar-chart-outline' },
  wellness: { active: 'sparkles', inactive: 'sparkles-outline' },
};

function FoxPlannerShell() {
  const {
    hydrated,
    locked,
    activeTab,
    setActiveTab,
    setSettingsMenuOpen,
    state,
    theme,
    strings,
    isRTL,
    pomodoro,
    celebration,
    dismissCelebration,
  } = useFoxStore();

  const [showSplash, setShowSplash] = useState(true);
  const [availableUpdate, setAvailableUpdate] = useState<UpdateManifest | null>(null);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);

  // Smooth fade & lift transition whenever switching tabs
  const screenFade = useRef(new Animated.Value(1)).current;
  const screenLift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    screenFade.setValue(0.35);
    screenLift.setValue(8);
    Animated.parallel([
      Animated.timing(screenFade, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(screenLift, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [activeTab, screenFade, screenLift]);

  useEffect(() => {
    if (!hydrated || locked) return;
    let active = true;
    void checkForGitHubUpdate(RELEASE_CONFIG).then((res) => {
      if (active && res.status === 'update_available') {
        setAvailableUpdate(res.latest);
        setUpdateModalOpen(true);
      }
    });
    return () => {
      active = false;
    };
  }, [hydrated, locked]);

  if (!hydrated) {
    return <FoxLoader theme={theme} lang={state.language} />;
  }

  if (showSplash) {
    return <FoxSplashIntro theme={theme} lang={state.language} onFinish={() => setShowSplash(false)} />;
  }

  if (locked) {
    return <LockScreen />;
  }

  const tabOrder: TabKey[] = isRTL
    ? ['wellness', 'progress', 'notes', 'pomodoro', 'planner']
    : ['planner', 'pomodoro', 'notes', 'progress', 'wellness'];

  const mins = Math.floor(pomodoro.secondsLeft / 60);
  const secs = pomodoro.secondsLeft % 60;
  const miniTimer = localizeDigits(
    `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
    state.language
  );

  return (
    <SafeAreaView style={[styles.safeRoot, { backgroundColor: theme.bg }]} edges={['top', 'left', 'right']}>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />

      <View style={[styles.appFrame, { backgroundColor: theme.bg }]}>
        {/* Custom SVG Decorative Backdrop Layer matched to active Theme */}
        <ThemeBackdrop theme={theme} />

        {/* Uncluttered Top Bar: Brand on left, 3-line + Gear Menu strictly at top-right */}
        <View
          style={[
            styles.topBar,
            { backgroundColor: theme.tabBarBg, borderBottomColor: theme.border },
          ]}
        >
          <View style={styles.topLeftGroup}>
            <View style={styles.brandCluster}>
              <Text style={styles.brandEmoji}>🦊</Text>
              <Text style={[styles.brandTitle, { color: theme.text }]}>{strings.appName}</Text>
            </View>

            {pomodoro.isRunning && activeTab !== 'pomodoro' ? (
              <TouchableOpacity
                onPress={() => setActiveTab('pomodoro')}
                style={[styles.livePill, { backgroundColor: theme.primarySoft }]}
              >
                <Ionicons name="timer" size={13} color={theme.primary} />
                <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '800' }}>{miniTimer}</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            onPress={() => setSettingsMenuOpen(true)}
            activeOpacity={0.8}
            style={[
              styles.cornerMenuBtn,
              { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
            ]}
          >
            <Ionicons name="menu" size={18} color={theme.text} />
            <Ionicons name="settings-outline" size={16} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Active Animated Screen */}
        <Animated.View
          style={{
            flex: 1,
            opacity: screenFade,
            transform: [{ translateY: screenLift }],
          }}
        >
          {activeTab === 'planner' ? <PlannerScreen /> : null}
          {activeTab === 'pomodoro' ? <PomodoroScreen /> : null}
          {activeTab === 'notes' ? <NotesScreen /> : null}
          {activeTab === 'progress' ? <ProgressScreen /> : null}
          {activeTab === 'wellness' ? <WellnessScreen /> : null}
        </Animated.View>

        {/* Bottom Navigation Bar */}
        <SafeAreaView
          edges={['bottom']}
          style={[
            styles.bottomBarSafe,
            { backgroundColor: theme.tabBarBg, borderTopColor: theme.border },
          ]}
        >
          <View style={styles.bottomBar}>
            {tabOrder.map((tab) => {
              const active = activeTab === tab;
              const icons = TAB_ICONS[tab];
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={styles.tabBtn}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.tabIconWrap,
                      active ? { backgroundColor: theme.primarySoft } : null,
                    ]}
                  >
                    <Ionicons
                      name={(active ? icons.active : icons.inactive) as never}
                      size={20}
                      color={active ? theme.primary : theme.textMuted}
                    />
                  </View>
                  <Text
                    style={[
                      styles.tabLabel,
                      { color: active ? theme.primary : theme.textMuted, fontWeight: active ? '800' : '600' },
                    ]}
                  >
                    {strings.tabs[tab]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>
      </View>

      <FoxCelebrationToast
        data={celebration}
        theme={theme}
        lang={state.language}
        isRTL={isRTL}
        onDismiss={dismissCelebration}
      />

      <OnboardingModal />
      <DailyMoodPrompt />
      <ReminderAlertModal />
      <SettingsHubModal />

      <UpdateModal
        visible={updateModalOpen}
        manifest={availableUpdate}
        currentVersion={RELEASE_CONFIG.appVersion}
        onClose={() => setUpdateModalOpen(false)}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <FoxStoreProvider>
        <FoxPlannerShell />
      </FoxStoreProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeRoot: { flex: 1, alignItems: 'center' },
  appFrame: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 520 : undefined,
    overflow: 'hidden',
  },
  topBar: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topLeftGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandCluster: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  brandEmoji: { fontSize: 20 },
  brandTitle: { fontSize: 16, fontWeight: '900' },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
  },
  cornerMenuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 13,
    borderWidth: 1,
  },
  bottomBarSafe: {
    borderTopWidth: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingTop: 6,
    paddingBottom: 6,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabIconWrap: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 14,
  },
  tabLabel: { fontSize: 10.5 },
});
