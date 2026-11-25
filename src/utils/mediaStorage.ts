import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { sanitizeFileName } from './security';

export interface ImportedMediaAsset {
  uri: string;
  fileName: string;
  mimeType: string;
  fileSize?: number;
  kind: 'image' | 'video' | 'file';
}

/** Copies mobile-selected media into sandboxed app document storage so OS cache cleanup cannot break notes. */
async function persistLocallyIfMobile(
  sourceUri: string,
  rawName: string,
  fallbackExt: string
): Promise<string> {
  if (Platform.OS === 'web') {
    return sourceUri;
  }
  try {
    const mediaDir = new Directory(Paths.document, 'fox-media');
    if (!mediaDir.exists) {
      mediaDir.create({ intermediates: true, idempotent: true });
    }
    const safeName = `${Date.now()}_${sanitizeFileName(rawName, fallbackExt)}`;
    const src = new File(sourceUri);
    const dst = new File(mediaDir, safeName);
    await src.copy(dst);
    return dst.uri;
  } catch {
    return sourceUri;
  }
}

/** Picks a photo or video from the device gallery with graceful permission handling. */
export async function pickMediaFromLibrary(
  mediaKind: 'image' | 'video'
): Promise<{ status: 'ok'; asset: ImportedMediaAsset } | { status: 'canceled' } | { status: 'denied' }> {
  if (Platform.OS !== 'web') {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      return { status: 'denied' };
    }
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: [mediaKind === 'image' ? 'images' : 'videos'],
    quality: 0.85,
    base64: Platform.OS === 'web' && mediaKind === 'image',
  });

  if (result.canceled || !result.assets?.length) {
    return { status: 'canceled' };
  }

  const asset = result.assets[0];
  const ext = mediaKind === 'image' ? 'jpg' : 'mp4';
  const rawName = asset.fileName ?? `${mediaKind}_${Date.now()}.${ext}`;
  const webDataUri =
    Platform.OS === 'web' && mediaKind === 'image' && asset.base64
      ? `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`
      : asset.uri;

  const finalUri = await persistLocallyIfMobile(webDataUri, rawName, ext);
  return {
    status: 'ok',
    asset: {
      uri: finalUri,
      fileName: sanitizeFileName(rawName, ext),
      mimeType: asset.mimeType ?? (mediaKind === 'image' ? 'image/jpeg' : 'video/mp4'),
      fileSize: asset.fileSize,
      kind: mediaKind,
    },
  };
}

/** Captures a fresh photo or video directly via the device camera. */
export async function captureMediaWithCamera(
  mediaKind: 'image' | 'video'
): Promise<{ status: 'ok'; asset: ImportedMediaAsset } | { status: 'canceled' } | { status: 'denied' }> {
  if (Platform.OS !== 'web') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      return { status: 'denied' };
    }
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: [mediaKind === 'image' ? 'images' : 'videos'],
    quality: 0.85,
    base64: Platform.OS === 'web' && mediaKind === 'image',
  });

  if (result.canceled || !result.assets?.length) {
    return { status: 'canceled' };
  }

  const asset = result.assets[0];
  const ext = mediaKind === 'image' ? 'jpg' : 'mp4';
  const rawName = asset.fileName ?? `camera_${mediaKind}_${Date.now()}.${ext}`;
  const webDataUri =
    Platform.OS === 'web' && mediaKind === 'image' && asset.base64
      ? `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`
      : asset.uri;

  const finalUri = await persistLocallyIfMobile(webDataUri, rawName, ext);
  return {
    status: 'ok',
    asset: {
      uri: finalUri,
      fileName: sanitizeFileName(rawName, ext),
      mimeType: asset.mimeType ?? (mediaKind === 'image' ? 'image/jpeg' : 'video/mp4'),
      fileSize: asset.fileSize,
      kind: mediaKind,
    },
  };
}

/** Imports any document, PDF, or audio file into note attachments. */
export async function pickAttachmentDocument(): Promise<
  { status: 'ok'; asset: ImportedMediaAsset } | { status: 'canceled' }
> {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
    type: '*/*',
  });

  if (result.canceled || !result.assets?.length) {
    return { status: 'canceled' };
  }

  const asset = result.assets[0];
  const safeName = sanitizeFileName(asset.name, 'pdf');
  const finalUri = await persistLocallyIfMobile(asset.uri, safeName, 'pdf');
  const isImage = asset.mimeType?.startsWith('image/');
  const isVideo = asset.mimeType?.startsWith('video/');

  return {
    status: 'ok',
    asset: {
      uri: finalUri,
      fileName: safeName,
      mimeType: asset.mimeType ?? 'application/octet-stream',
      fileSize: asset.size,
      kind: isImage ? 'image' : isVideo ? 'video' : 'file',
    },
  };
}

/** Formats attachment byte sizes cleanly for display. */
export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
