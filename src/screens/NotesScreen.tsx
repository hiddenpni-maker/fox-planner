import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text, TextInput } from '../components/FoxText';
import { Ionicons } from '@expo/vector-icons';
import { FoxMascot } from '../components/FoxMascot';
import { MediaBlockViewer } from '../components/MediaBlockViewer';
import { SectionHelpButton } from '../components/SectionHelpButton';
import { localizeDigits } from '../i18n/translations';
import { useFoxStore } from '../store/FoxStoreContext';
import type { NoteBlock, NoteBlockType, NoteItem } from '../types/planner';
import {
  captureMediaWithCamera,
  pickAttachmentDocument,
  pickMediaFromLibrary,
} from '../utils/mediaStorage';

function makeBlockId(): string {
  return `blk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function NotesScreen() {
  const { state, theme, strings, isRTL, upsertNote, togglePinNote, deleteNote } = useFoxStore();
  const lang = state.language;

  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [pinnedOnly, setPinnedOnly] = useState(false);

  // Editor modal state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | undefined>(undefined);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteSubjectId, setNoteSubjectId] = useState(state.subjects[0]?.id ?? 'subj-general');
  const [tagsText, setTagsText] = useState('');
  const [pinned, setPinned] = useState(false);
  const [blocks, setBlocks] = useState<NoteBlock[]>([]);
  const [mediaNotice, setMediaNotice] = useState('');

  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...state.notes]
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      })
      .filter((n) => {
        if (pinnedOnly && !n.pinned) return false;
        if (subjectFilter !== 'all' && n.subjectId !== subjectFilter) return false;
        if (!q) return true;
        const inTitle = n.title.toLowerCase().includes(q);
        const inTags = n.tags.some((t) => t.toLowerCase().includes(q));
        const inBlocks = n.blocks.some(
          (b) =>
            b.content.toLowerCase().includes(q) ||
            (b.caption?.toLowerCase().includes(q) ?? false)
        );
        return inTitle || inTags || inBlocks;
      });
  }, [state.notes, searchQuery, subjectFilter, pinnedOnly]);

  const openCreateNote = () => {
    setEditingNoteId(undefined);
    setNoteTitle('');
    setNoteSubjectId(state.subjects[0]?.id ?? 'subj-general');
    setTagsText('');
    setPinned(false);
    setBlocks([{ id: makeBlockId(), type: 'text', content: '' }]);
    setMediaNotice('');
    setEditorOpen(true);
  };

  const openEditNote = (note: NoteItem) => {
    setEditingNoteId(note.id);
    setNoteTitle(note.title);
    setNoteSubjectId(note.subjectId);
    setTagsText(note.tags.join(', '));
    setPinned(note.pinned);
    setBlocks(note.blocks.length ? note.blocks : [{ id: makeBlockId(), type: 'text', content: '' }]);
    setMediaNotice('');
    setEditorOpen(true);
  };

  const addTextualBlock = (type: Extract<NoteBlockType, 'text' | 'heading' | 'highlight' | 'checklist'>) => {
    setBlocks((prev) => [
      ...prev,
      { id: makeBlockId(), type, content: '', checked: type === 'checklist' ? false : undefined },
    ]);
  };

  const handleImportMedia = async (
    source: 'gallery-image' | 'camera-image' | 'gallery-video' | 'camera-video' | 'file'
  ) => {
    setMediaNotice('');
    try {
      if (source === 'file') {
        const res = await pickAttachmentDocument();
        if (res.status === 'ok') {
          setBlocks((prev) => [
            ...prev,
            {
              id: makeBlockId(),
              type: res.asset.kind,
              content: res.asset.fileName,
              uri: res.asset.uri,
              fileName: res.asset.fileName,
              mimeType: res.asset.mimeType,
              fileSize: res.asset.fileSize,
              caption: '',
            },
          ]);
        }
        return;
      }

      const kind = source.includes('video') ? 'video' : 'image';
      const isCam = source.startsWith('camera');
      const res = isCam ? await captureMediaWithCamera(kind) : await pickMediaFromLibrary(kind);

      if (res.status === 'denied') {
        const msg =
          lang === 'fa'
            ? 'دسترسی به دوربین یا گالری داده نشد.'
            : 'Camera or media library permission was denied.';
        setMediaNotice(msg);
        Alert.alert('Fox Planner', msg);
        return;
      }
      if (res.status === 'ok') {
        setBlocks((prev) => [
          ...prev,
          {
            id: makeBlockId(),
            type: res.asset.kind,
            content: res.asset.fileName,
            uri: res.asset.uri,
            fileName: res.asset.fileName,
            mimeType: res.asset.mimeType,
            fileSize: res.asset.fileSize,
            caption: '',
          },
        ]);
      }
    } catch {
      setMediaNotice(
        lang === 'fa'
          ? 'امکان باز کردن انتخاب‌گر فایل روی این دستگاه نبود.'
          : 'Could not open picker on this device.'
      );
    }
  };

  const updateBlock = (blockId: string, patch: Partial<NoteBlock>) => {
    setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, ...patch } : b)));
  };

  const moveBlock = (index: number, delta: -1 | 1) => {
    const nextIdx = index + delta;
    if (nextIdx < 0 || nextIdx >= blocks.length) return;
    setBlocks((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(nextIdx, 0, item);
      return copy;
    });
  };

  const handleSaveNote = () => {
    const cleanBlocks = blocks.filter((b) => b.uri || b.content.trim().length > 0);
    const derivedTitle =
      noteTitle.trim() ||
      cleanBlocks.find((b) => b.content.trim())?.content.trim().slice(0, 48) ||
      (lang === 'fa' ? 'نوت بدون عنوان' : 'Untitled Note');

    const tags = tagsText
      .split(/[,،]/)
      .map((t) => t.trim())
      .filter(Boolean);

    upsertNote({
      id: editingNoteId,
      title: derivedTitle,
      subjectId: noteSubjectId,
      tags,
      pinned,
      blocks: cleanBlocks,
    });
    setEditorOpen(false);
  };

  const getSubject = (id: string) =>
    state.subjects.find((s) => s.id === id) ?? state.subjects[0];

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Bar */}
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.pageTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
              {strings.notes.title}
            </Text>
            <Text style={[styles.pageSub, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
              {strings.notes.webVideoNotice}
            </Text>
          </View>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
            <SectionHelpButton
              titleFa="راهنمای جزوه‌برداری چندرسانه‌ای"
              titleEn="Rich Media Notes Guide"
              tipsFa={[
                'می‌توانی جزوه را با تیتر، هایلایت طلایی، چک‌لیست مرور، عکس از تخته/کتاب، ویدیوی آموزشی و فایل PDF بسازی.',
                'مهم‌ترین جزوه‌ها را سنجاق (Pin) کن تا همیشه در بالای صفحه بمانند.',
                'ساخت اولین جزوه ۱۰ امتیاز روباه (XP) و پیام تشویقی برایت می‌آورد!',
              ]}
              tipsEn={[
                'Combine headings, golden highlights, checklists, photos, videos & attachments in one note.',
                'Pin key summaries to keep them right at the top.',
                'Creating notes rewards +10 Fox XP points!',
              ]}
              theme={theme}
              lang={lang}
              isRTL={isRTL}
            />
            <TouchableOpacity
              onPress={openCreateNote}
              style={[styles.newNoteBtn, { backgroundColor: theme.primary }]}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.newNoteText}>{strings.notes.newNote}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Input */}
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              flexDirection: isRTL ? 'row-reverse' : 'row',
            },
          ]}
        >
          <Ionicons name="search" size={18} color={theme.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={strings.notes.searchPlaceholder}
            placeholderTextColor={theme.textMuted}
            style={[styles.searchInput, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Subject & Pin Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.filtersRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        >
          <TouchableOpacity
            onPress={() => setPinnedOnly((p) => !p)}
            style={[
              styles.chip,
              {
                backgroundColor: pinnedOnly ? theme.warningSoft : theme.surface,
                borderColor: pinnedOnly ? theme.warning : theme.border,
              },
            ]}
          >
            <Text style={{ color: pinnedOnly ? theme.warning : theme.textSecondary, fontSize: 12, fontWeight: '700' }}>
              📌 {strings.notes.pinnedOnly}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSubjectFilter('all')}
            style={[
              styles.chip,
              {
                backgroundColor: subjectFilter === 'all' ? theme.primarySoft : theme.surface,
                borderColor: subjectFilter === 'all' ? theme.primary : theme.border,
              },
            ]}
          >
            <Text
              style={{
                color: subjectFilter === 'all' ? theme.primary : theme.textSecondary,
                fontSize: 12,
                fontWeight: '700',
              }}
            >
              {strings.notes.allSubjects}
            </Text>
          </TouchableOpacity>

          {state.subjects.map((sub) => {
            const active = subjectFilter === sub.id;
            return (
              <TouchableOpacity
                key={sub.id}
                onPress={() => setSubjectFilter(sub.id)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? `${sub.color}28` : theme.surface,
                    borderColor: active ? sub.color : theme.border,
                  },
                ]}
              >
                <Text style={{ color: active ? sub.color : theme.textSecondary, fontSize: 12, fontWeight: '700' }}>
                  {lang === 'fa' ? sub.nameFa : sub.nameEn}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Notes Feed */}
        {filteredNotes.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <FoxMascot mood="study" size={72} theme={theme} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>{strings.notes.emptyTitle}</Text>
            <Text style={[styles.emptySub, { color: theme.textMuted }]}>{strings.notes.emptySubtitle}</Text>
          </View>
        ) : (
          filteredNotes.map((note) => {
            const sub = getSubject(note.subjectId);
            const imageCount = note.blocks.filter((b) => b.type === 'image').length;
            const videoCount = note.blocks.filter((b) => b.type === 'video').length;
            const fileCount = note.blocks.filter((b) => b.type === 'file').length;
            const firstImage = note.blocks.find((b) => b.type === 'image' && b.uri);
            const snippetBlock = note.blocks.find(
              (b) => b.type === 'highlight' || b.type === 'text' || b.type === 'heading'
            );

            return (
              <TouchableOpacity
                key={note.id}
                activeOpacity={0.85}
                onPress={() => openEditNote(note)}
                style={[styles.noteCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <View style={[styles.noteTop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.subjPill, { backgroundColor: `${sub.color}24` }]}>
                    <Text style={{ color: sub.color, fontSize: 11, fontWeight: '800' }}>
                      {lang === 'fa' ? sub.nameFa : sub.nameEn}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity onPress={() => togglePinNote(note.id)}>
                      <Ionicons
                        name={note.pinned ? 'bookmark' : 'bookmark-outline'}
                        size={18}
                        color={note.pinned ? theme.warning : theme.textMuted}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteNote(note.id)}>
                      <Ionicons name="trash-outline" size={18} color={theme.danger} />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={[styles.noteTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
                  {note.title}
                </Text>

                {snippetBlock ? (
                  <Text
                    numberOfLines={2}
                    style={[styles.noteSnippet, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}
                  >
                    {snippetBlock.content}
                  </Text>
                ) : null}

                {firstImage?.uri ? (
                  <Image source={{ uri: firstImage.uri }} style={styles.cardThumb} resizeMode="cover" />
                ) : null}

                <View style={[styles.noteFooter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.tagsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    {note.tags.slice(0, 3).map((tag) => (
                      <View key={tag} style={[styles.tagChip, { backgroundColor: theme.surfaceMuted }]}>
                        <Text style={{ color: theme.textMuted, fontSize: 11 }}>#{tag}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={[styles.mediaBadges, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    {imageCount > 0 ? (
                      <Text style={{ color: theme.info, fontSize: 11, fontWeight: '700' }}>
                        🖼️ {localizeDigits(imageCount, lang)}
                      </Text>
                    ) : null}
                    {videoCount > 0 ? (
                      <Text style={{ color: theme.primary, fontSize: 11, fontWeight: '700' }}>
                        🎬 {localizeDigits(videoCount, lang)}
                      </Text>
                    ) : null}
                    {fileCount > 0 ? (
                      <Text style={{ color: theme.success, fontSize: 11, fontWeight: '700' }}>
                        📎 {localizeDigits(fileCount, lang)}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Rich Multimedia Block Note Editor */}
      <Modal visible={editorOpen} animationType="slide" onRequestClose={() => setEditorOpen(false)}>
        <View style={[styles.editorRoot, { backgroundColor: theme.bg }]}>
          <View
            style={[
              styles.editorHeader,
              { borderBottomColor: theme.border, backgroundColor: theme.surface, flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            <TouchableOpacity onPress={() => setEditorOpen(false)}>
              <Ionicons name="close" size={26} color={theme.text} />
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity onPress={() => setPinned((p) => !p)}>
                <Ionicons
                  name={pinned ? 'bookmark' : 'bookmark-outline'}
                  size={22}
                  color={pinned ? theme.warning : theme.textMuted}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveNote}
                style={[styles.editorSaveBtn, { backgroundColor: theme.primary }]}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>{strings.planner.save}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.editorBody} showsVerticalScrollIndicator={false}>
            <TextInput
              value={noteTitle}
              onChangeText={setNoteTitle}
              placeholder={strings.notes.noteTitlePlaceholder}
              placeholderTextColor={theme.textMuted}
              style={[styles.editorTitleInput, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}
            />

            {/* Subject & Tags */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.filtersRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            >
              {state.subjects.map((sub) => {
                const active = noteSubjectId === sub.id;
                return (
                  <TouchableOpacity
                    key={sub.id}
                    onPress={() => setNoteSubjectId(sub.id)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? `${sub.color}28` : theme.surface,
                        borderColor: active ? sub.color : theme.border,
                      },
                    ]}
                  >
                    <Text style={{ color: active ? sub.color : theme.textSecondary, fontSize: 12, fontWeight: '700' }}>
                      {lang === 'fa' ? sub.nameFa : sub.nameEn}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TextInput
              value={tagsText}
              onChangeText={setTagsText}
              placeholder={strings.notes.tagsPlaceholder}
              placeholderTextColor={theme.textMuted}
              style={[
                styles.tagsInput,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.text,
                  textAlign: isRTL ? 'right' : 'left',
                },
              ]}
            />

            {mediaNotice ? (
              <Text style={{ color: theme.warning, fontSize: 12, marginBottom: 8 }}>{mediaNotice}</Text>
            ) : null}

            {/* Blocks */}
            {blocks.map((block, idx) => (
              <View
                key={block.id}
                style={[
                  styles.blockCard,
                  {
                    backgroundColor: block.type === 'highlight' ? theme.primarySoft : theme.surface,
                    borderColor: block.type === 'highlight' ? theme.primary : theme.border,
                  },
                ]}
              >
                <View style={[styles.blockToolbar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>
                    {block.type}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity onPress={() => moveBlock(idx, -1)}>
                      <Ionicons name="arrow-up" size={16} color={theme.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => moveBlock(idx, 1)}>
                      <Ionicons name="arrow-down" size={16} color={theme.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setBlocks((prev) => prev.filter((x) => x.id !== block.id))}>
                      <Ionicons name="trash-outline" size={16} color={theme.danger} />
                    </TouchableOpacity>
                  </View>
                </View>

                {block.type === 'image' || block.type === 'video' || block.type === 'file' ? (
                  <>
                    <MediaBlockViewer block={block} theme={theme} isRTL={isRTL} />
                    <TextInput
                      value={block.caption ?? ''}
                      onChangeText={(val) => updateBlock(block.id, { caption: val })}
                      placeholder={strings.notes.captionPlaceholder}
                      placeholderTextColor={theme.textMuted}
                      style={[
                        styles.captionInput,
                        { color: theme.text, borderColor: theme.border, textAlign: isRTL ? 'right' : 'left' },
                      ]}
                    />
                  </>
                ) : block.type === 'checklist' ? (
                  <View style={[styles.checkBlockRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <TouchableOpacity
                      onPress={() => updateBlock(block.id, { checked: !block.checked })}
                      style={{ paddingTop: 4 }}
                    >
                      <Ionicons
                        name={block.checked ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={block.checked ? theme.success : theme.textMuted}
                      />
                    </TouchableOpacity>
                    <TextInput
                      value={block.content}
                      onChangeText={(val) => updateBlock(block.id, { content: val })}
                      multiline
                      placeholder="..."
                      placeholderTextColor={theme.textMuted}
                      style={[
                        styles.blockTextInput,
                        {
                          flex: 1,
                          color: block.checked ? theme.textMuted : theme.text,
                          textDecorationLine: block.checked ? 'line-through' : 'none',
                          textAlign: isRTL ? 'right' : 'left',
                        },
                      ]}
                    />
                  </View>
                ) : (
                  <TextInput
                    value={block.content}
                    onChangeText={(val) => updateBlock(block.id, { content: val })}
                    multiline
                    placeholder="..."
                    placeholderTextColor={theme.textMuted}
                    style={[
                      styles.blockTextInput,
                      block.type === 'heading' ? styles.headingBlockText : null,
                      { color: theme.text, textAlign: isRTL ? 'right' : 'left' },
                    ]}
                  />
                )}
              </View>
            ))}

            {/* Rich Block Insertion Palette */}
            <View style={[styles.paletteCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.paletteRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity onPress={() => addTextualBlock('text')} style={[styles.palBtn, { backgroundColor: theme.surfaceElevated }]}>
                  <Ionicons name="document-text-outline" size={16} color={theme.text} />
                  <Text style={[styles.palBtnText, { color: theme.text }]}>{strings.notes.addTextBlock}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => addTextualBlock('heading')} style={[styles.palBtn, { backgroundColor: theme.surfaceElevated }]}>
                  <Ionicons name="text-outline" size={16} color={theme.info} />
                  <Text style={[styles.palBtnText, { color: theme.text }]}>{strings.notes.addHeadingBlock}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => addTextualBlock('highlight')} style={[styles.palBtn, { backgroundColor: theme.surfaceElevated }]}>
                  <Ionicons name="sparkles-outline" size={16} color={theme.primary} />
                  <Text style={[styles.palBtnText, { color: theme.text }]}>{strings.notes.addHighlightBlock}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => addTextualBlock('checklist')} style={[styles.palBtn, { backgroundColor: theme.surfaceElevated }]}>
                  <Ionicons name="checkbox-outline" size={16} color={theme.success} />
                  <Text style={[styles.palBtnText, { color: theme.text }]}>{strings.notes.addChecklistBlock}</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.paletteRow, { flexDirection: isRTL ? 'row-reverse' : 'row', marginTop: 8 }]}>
                <TouchableOpacity onPress={() => void handleImportMedia('gallery-image')} style={[styles.palBtn, { backgroundColor: theme.infoSoft }]}>
                  <Ionicons name="image-outline" size={16} color={theme.info} />
                  <Text style={[styles.palBtnText, { color: theme.info }]}>{strings.notes.addPhotoGallery}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => void handleImportMedia('camera-image')} style={[styles.palBtn, { backgroundColor: theme.infoSoft }]}>
                  <Ionicons name="camera-outline" size={16} color={theme.info} />
                  <Text style={[styles.palBtnText, { color: theme.info }]}>{strings.notes.takePhoto}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => void handleImportMedia('gallery-video')} style={[styles.palBtn, { backgroundColor: theme.primarySoft }]}>
                  <Ionicons name="videocam-outline" size={16} color={theme.primary} />
                  <Text style={[styles.palBtnText, { color: theme.primary }]}>{strings.notes.addVideoGallery}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => void handleImportMedia('camera-video')} style={[styles.palBtn, { backgroundColor: theme.primarySoft }]}>
                  <Ionicons name="radio-button-on-outline" size={16} color={theme.primary} />
                  <Text style={[styles.palBtnText, { color: theme.primary }]}>{strings.notes.recordVideo}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => void handleImportMedia('file')} style={[styles.palBtn, { backgroundColor: theme.successSoft }]}>
                  <Ionicons name="attach-outline" size={16} color={theme.success} />
                  <Text style={[styles.palBtnText, { color: theme.success }]}>{strings.notes.addFile}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: { padding: 16, paddingBottom: 110 },
  headerRow: { alignItems: 'center', gap: 12, marginBottom: 12 },
  pageTitle: { fontSize: 21, fontWeight: '900' },
  pageSub: { fontSize: 11, marginTop: 2 },
  newNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  newNoteText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  searchBox: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 2 },
  filtersRow: { gap: 8, paddingBottom: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  emptyBox: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    marginTop: 10,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', marginTop: 10, textAlign: 'center' },
  emptySub: { fontSize: 13, marginTop: 6, textAlign: 'center', lineHeight: 20 },
  noteCard: { borderRadius: 22, borderWidth: 1, padding: 15, marginBottom: 12 },
  noteTop: { justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subjPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  noteTitle: { fontSize: 16, fontWeight: '800', lineHeight: 23 },
  noteSnippet: { fontSize: 13, marginTop: 5, lineHeight: 19 },
  cardThumb: { width: '100%', height: 130, borderRadius: 12, marginTop: 10 },
  noteFooter: { justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  tagsRow: { gap: 6, flexWrap: 'wrap' },
  tagChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  mediaBadges: { gap: 8, alignItems: 'center' },
  editorRoot: { flex: 1 },
  editorHeader: {
    paddingTop: 46,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editorSaveBtn: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 12 },
  editorBody: { padding: 16, paddingBottom: 60 },
  editorTitleInput: { fontSize: 22, fontWeight: '900', marginBottom: 10 },
  tagsInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    marginBottom: 14,
  },
  blockCard: { borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 10 },
  blockToolbar: { justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  blockTextInput: { fontSize: 14, lineHeight: 22, minHeight: 34 },
  headingBlockText: { fontSize: 17, fontWeight: '800' },
  checkBlockRow: { alignItems: 'flex-start', gap: 8 },
  captionInput: {
    borderTopWidth: 1,
    marginTop: 8,
    paddingTop: 8,
    fontSize: 12,
  },
  paletteCard: { borderRadius: 18, borderWidth: 1, padding: 12, marginTop: 8 },
  paletteRow: { flexWrap: 'wrap', gap: 8 },
  palBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },
  palBtnText: { fontSize: 12, fontWeight: '700' },
});
