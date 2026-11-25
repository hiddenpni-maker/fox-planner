import React, { useState } from 'react';
import { Image, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from './FoxText';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import type { FoxTheme } from '../theme/tokens';
import type { NoteBlock } from '../types/planner';
import { formatFileSize } from '../utils/mediaStorage';

interface MediaBlockViewerProps {
  block: NoteBlock;
  theme: FoxTheme;
  isRTL: boolean;
}

function EmbeddedVideo({ uri, theme }: { uri: string; theme: FoxTheme }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });

  return (
    <View style={[styles.videoFrame, { backgroundColor: '#000', borderColor: theme.border }]}>
      <VideoView
        style={styles.videoSurface}
        player={player}
        fullscreenOptions={{ enable: true }}
        allowsPictureInPicture
        nativeControls
        contentFit="contain"
      />
    </View>
  );
}

/** Renders note media blocks (zoomable photos, native expo-video clips, and document attachments). */
export function MediaBlockViewer({ block, theme, isRTL }: MediaBlockViewerProps) {
  const [zoomOpen, setZoomOpen] = useState(false);

  if (block.type === 'image' && block.uri) {
    return (
      <View style={styles.wrapper}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setZoomOpen(true)}
          style={[styles.imageCard, { borderColor: theme.border }]}
        >
          <Image source={{ uri: block.uri }} style={styles.imagePreview} resizeMode="cover" />
          <View style={[styles.zoomBadge, { backgroundColor: 'rgba(15, 23, 42, 0.72)' }]}>
            <Ionicons name="expand-outline" size={14} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        {block.caption ? (
          <Text style={[styles.caption, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
            {block.caption}
          </Text>
        ) : null}

        <Modal visible={zoomOpen} transparent animationType="fade" onRequestClose={() => setZoomOpen(false)}>
          <View style={styles.lightboxBg}>
            <TouchableOpacity style={styles.lightboxClose} onPress={() => setZoomOpen(false)}>
              <Ionicons name="close" size={26} color="#FFFFFF" />
            </TouchableOpacity>
            <Image source={{ uri: block.uri }} style={styles.lightboxImage} resizeMode="contain" />
            {block.caption ? <Text style={styles.lightboxCaption}>{block.caption}</Text> : null}
          </View>
        </Modal>
      </View>
    );
  }

  if (block.type === 'video' && block.uri) {
    return (
      <View style={styles.wrapper}>
        <EmbeddedVideo uri={block.uri} theme={theme} />
        {block.caption ? (
          <Text style={[styles.caption, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
            {block.caption}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.fileCard,
        {
          backgroundColor: theme.surfaceMuted,
          borderColor: theme.border,
          flexDirection: isRTL ? 'row-reverse' : 'row',
        },
      ]}
    >
      <View style={[styles.fileIconBox, { backgroundColor: theme.infoSoft }]}>
        <Ionicons name="document-attach-outline" size={20} color={theme.info} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={1}
          style={[styles.fileName, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}
        >
          {block.fileName || block.content || 'Attachment'}
        </Text>
        <Text style={[styles.fileMeta, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
          {[block.mimeType, formatFileSize(block.fileSize)].filter(Boolean).join(' • ') || 'Local file'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 6,
  },
  imageCard: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 190,
  },
  zoomBadge: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
  },
  videoFrame: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    height: 210,
  },
  videoSurface: {
    width: '100%',
    height: '100%',
  },
  caption: {
    fontSize: 12,
    marginTop: 5,
    fontStyle: 'italic',
  },
  fileCard: {
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  fileIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: {
    fontSize: 13,
    fontWeight: '700',
  },
  fileMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  lightboxBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  lightboxClose: {
    position: 'absolute',
    top: 44,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  lightboxImage: {
    width: '100%',
    height: '78%',
  },
  lightboxCaption: {
    color: '#E2E8F0',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
});
