import React, { useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from './FoxText';
import { Ionicons } from '@expo/vector-icons';
import { FoxMascot } from './FoxMascot';
import type { FoxTheme } from '../theme/tokens';
import type { LanguageCode } from '../types/planner';

interface SectionHelpButtonProps {
  titleFa: string;
  titleEn: string;
  tipsFa: string[];
  tipsEn: string[];
  theme: FoxTheme;
  lang: LanguageCode;
  isRTL: boolean;
}

/** Compact "?" help trigger opening an approachable Fox guide for the current screen. */
export function SectionHelpButton({
  titleFa,
  titleEn,
  tipsFa,
  tipsEn,
  theme,
  lang,
  isRTL,
}: SectionHelpButtonProps) {
  const [open, setOpen] = useState(false);
  const tips = lang === 'fa' ? tipsFa : tipsEn;

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={[
          styles.helpBtn,
          { backgroundColor: theme.infoSoft, borderColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' },
        ]}
      >
        <Ionicons name="help-circle-outline" size={16} color={theme.info} />
        <Text style={{ color: theme.info, fontSize: 11.5, fontWeight: '800' }}>
          {lang === 'fa' ? 'راهنما' : 'Guide'}
        </Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <FoxMascot mood="study" size={56} theme={theme} />
              <Text style={[styles.title, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
                {lang === 'fa' ? titleFa : titleEn}
              </Text>
            </View>

            <View style={{ gap: 10, marginTop: 12 }}>
              {tips.map((tip, idx) => (
                <View key={idx} style={[styles.tipRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.bullet, { backgroundColor: theme.primarySoft }]}>
                    <Ionicons name="checkmark" size={13} color={theme.primary} />
                  </View>
                  <Text style={[styles.tipText, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                    {tip}
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity onPress={() => setOpen(false)} style={[styles.okBtn, { backgroundColor: theme.primary }]}>
              <Text style={styles.okText}>{lang === 'fa' ? 'متوجه شدم!' : 'Got it!'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  helpBtn: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 10, 18, 0.72)',
    justifyContent: 'center',
    padding: 20,
  },
  card: { borderRadius: 24, borderWidth: 1, padding: 18 },
  header: { alignItems: 'center', gap: 12 },
  title: { flex: 1, fontSize: 16, fontWeight: '900', lineHeight: 24 },
  tipRow: { alignItems: 'flex-start', gap: 8 },
  bullet: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  tipText: { flex: 1, fontSize: 13, lineHeight: 20 },
  okBtn: { marginTop: 18, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  okText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
});
