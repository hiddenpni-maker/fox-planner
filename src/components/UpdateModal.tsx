import React from 'react';
import { Linking, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from './FoxText';
import { Ionicons } from '@expo/vector-icons';
import { FoxMascot } from './FoxMascot';
import { localizeDigits } from '../i18n/translations';
import { useFoxStore } from '../store/FoxStoreContext';
import { isSafeHttpsUrl, type UpdateManifest } from '../utils/updater';

interface UpdateModalProps {
  visible: boolean;
  manifest: UpdateManifest | null;
  currentVersion: string;
  onClose: () => void;
}

export function UpdateModal({ visible, manifest, currentVersion, onClose }: UpdateModalProps) {
  const { theme, strings, state, isRTL } = useFoxStore();
  const lang = state.language;

  if (!manifest) return null;

  const openUrl = (url?: string) => {
    if (!url || !isSafeHttpsUrl(url)) return;
    void Linking.openURL(url).catch(() => {});
  };

  const notes = lang === 'fa' ? manifest.notesFa || manifest.notesEn : manifest.notesEn || manifest.notesFa;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.topCenter}>
            <FoxMascot mood="celebrate" size={74} theme={theme} />
            <Text style={[styles.title, { color: theme.text }]}>{strings.updates.modalTitle}</Text>
            <View style={[styles.versionBadge, { backgroundColor: theme.primarySoft }]}>
              <Text style={{ color: theme.primary, fontWeight: '800', fontSize: 13 }}>
                v{localizeDigits(currentVersion, lang)} ➔ v{localizeDigits(manifest.version, lang)}
              </Text>
            </View>
          </View>

          {notes ? (
            <ScrollView
              style={[styles.notesBox, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
            >
              <Text style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 20, textAlign: isRTL ? 'right' : 'left' }}>
                {notes}
              </Text>
            </ScrollView>
          ) : null}

          <View style={{ gap: 8, marginTop: 12 }}>
            {manifest.apkUrls.universal ? (
              <TouchableOpacity
                onPress={() => openUrl(manifest.apkUrls.universal)}
                style={[styles.dlBtn, { backgroundColor: theme.primary }]}
              >
                <Ionicons name="download-outline" size={18} color="#FFFFFF" />
                <Text style={styles.dlBtnText}>{strings.updates.downloadUniversal}</Text>
              </TouchableOpacity>
            ) : null}

            <View style={{ flexDirection: 'row', gap: 8 }}>
              {manifest.apkUrls.arm64 ? (
                <TouchableOpacity
                  onPress={() => openUrl(manifest.apkUrls.arm64)}
                  style={[styles.subDlBtn, { backgroundColor: theme.infoSoft, borderColor: theme.info }]}
                >
                  <Text style={{ color: theme.info, fontWeight: '800', fontSize: 12 }}>ARM64 (جدید)</Text>
                </TouchableOpacity>
              ) : null}
              {manifest.apkUrls.armv7 ? (
                <TouchableOpacity
                  onPress={() => openUrl(manifest.apkUrls.armv7)}
                  style={[styles.subDlBtn, { backgroundColor: theme.successSoft, borderColor: theme.success }]}
                >
                  <Text style={{ color: theme.success, fontWeight: '800', fontSize: 12 }}>ARMv7 (قدیمی)</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <TouchableOpacity
              onPress={() => openUrl(manifest.downloadPageUrl)}
              style={[styles.releaseBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
            >
              <Ionicons name="logo-github" size={17} color={theme.text} />
              <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>
                {strings.updates.openGitHubRelease}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} style={styles.laterBtn}>
              <Text style={{ color: theme.textMuted, fontWeight: '700', fontSize: 13 }}>
                {strings.updates.later}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.68)',
    justifyContent: 'center',
    padding: 18,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
  },
  topCenter: { alignItems: 'center', gap: 8 },
  title: { fontSize: 18, fontWeight: '900', textAlign: 'center' },
  versionBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14 },
  notesBox: {
    marginTop: 12,
    maxHeight: 140,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  dlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
  },
  dlBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  subDlBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  releaseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
  },
  laterBtn: { alignItems: 'center', paddingVertical: 8 },
});
