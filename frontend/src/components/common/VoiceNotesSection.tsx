/**
 * Phase 23 — VoiceNotesSection
 * Migrated from expo-av → expo-audio (SDK 54 compatible)
 * + Google Drive upload after recording
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Alert, ActivityIndicator, Platform,
} from 'react-native';
import {
  useAudioRecorder,
  useAudioRecorderState,
  useAudioPlayer,
  useAudioPlayerStatus,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  RecordingPresets,
} from 'expo-audio';
import { Feather } from '@expo/vector-icons';
import { useAppContext } from '../../context/AppContext';
import { useColors, Typography, Spacing, Radius } from '../../theme';
import { VoiceNote } from '../../types';
import { DriveSetupSheet } from './DriveSetupSheet';
import {
  getStoredDriveToken,
  syncVoiceNoteToDrive,
} from '../../services/googleDriveFiles';

interface Props {
  caseId: string;
  caseName: string;
  caseNumber?: string;
  clientName?: string;
}

function fmtDuration(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function VoiceNotesSection({ caseId, caseName, caseNumber = '', clientName }: Props) {
  const c = useColors();
  const {
    voiceNotes, addVoiceNote, deleteVoiceNote,
    isDriveConnected, connectDrive, updateVoiceNoteDriveSync,
  } = useAppContext();

  const caseNotes = voiceNotes.filter(n => n.caseId === caseId);

  // ── Recorder ──────────────────────────────────────────────────────
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder, 500);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState('');

  // ── Player (single shared player, replace source per note) ────────
  const player = useAudioPlayer(null);
  const playerStatus = useAudioPlayerStatus(player);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const prevPlayingRef = useRef(playerStatus.playing);

  // Detect playback end
  useEffect(() => {
    if (prevPlayingRef.current && !playerStatus.playing && playingId !== null) {
      setPlayingId(null);
    }
    prevPlayingRef.current = playerStatus.playing;
  }, [playerStatus.playing]);

  // ── Drive sheet ───────────────────────────────────────────────────
  const [showDriveSheet, setShowDriveSheet] = useState(false);
  const [connectingDrive, setConnectingDrive] = useState(false);

  // ── Upload state ──────────────────────────────────────────────────
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  // ── Start recording ───────────────────────────────────────────────
  const handleStartRecording = async () => {
    if (!isDriveConnected) {
      setShowDriveSheet(true);
      return;
    }
    await startRecordingInternal();
  };

  const startRecordingInternal = async () => {
    setRecordingError('');
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        setRecordingError('Microphone permission denied');
        return;
      }
      await setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);
    } catch (e: any) {
      setRecordingError('Could not start recording');
    }
  };

  // ── Stop recording + upload ───────────────────────────────────────
  const handleStopRecording = async () => {
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) { setIsRecording(false); return; }

      const now = Date.now();
      const durationSecs = Math.round((recState.durationMillis ?? 0) / 1000);
      const fileName = `VoiceNote_${new Date(now).toISOString().slice(0,10)}_${caseId.slice(-4)}.m4a`;

      const note: VoiceNote = {
        id: `vn_${now}`,
        caseId,
        caseName,
        title: fileName,
        uri,
        duration: durationSecs,
        createdAt: now,
        isSynced: false,
      };

      addVoiceNote(note);
      setIsRecording(false);

      // Upload to Drive in background
      uploadNoteToDrive(note, uri, fileName);
    } catch {
      setIsRecording(false);
    }
  };

  const uploadNoteToDrive = async (note: VoiceNote, uri: string, fileName: string) => {
    setUploadingId(note.id);
    try {
      const token = await getStoredDriveToken();
      if (!token) return;
      const result = await syncVoiceNoteToDrive(uri, fileName, caseNumber || caseId, clientName, token);
      updateVoiceNoteDriveSync(note.id, result.fileId, result.fileUrl);
    } catch {
      // Saved locally; user can retry manually
    } finally {
      setUploadingId(null);
    }
  };

  // ── Play / Pause ──────────────────────────────────────────────────
  const handlePlayPause = useCallback(async (note: VoiceNote) => {
    if (playingId === note.id) {
      player.pause();
      setPlayingId(null);
      return;
    }
    // Stop previous
    if (playingId !== null) player.pause();
    player.replace({ uri: note.uri });
    await setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
    player.play();
    setPlayingId(note.id);
  }, [playingId, player]);

  // ── Delete ────────────────────────────────────────────────────────
  const handleDelete = (note: VoiceNote) => {
    Alert.alert('Delete Voice Note', 'Delete this recording?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        if (playingId === note.id) { player.pause(); setPlayingId(null); }
        deleteVoiceNote(note.id);
      }},
    ]);
  };

  // ── Manual Drive sync ─────────────────────────────────────────────
  const handleManualSync = async (note: VoiceNote) => {
    if (!isDriveConnected) { setShowDriveSheet(true); return; }
    await uploadNoteToDrive(note, note.uri, note.title);
  };

  // ── Drive connect ─────────────────────────────────────────────────
  const handleConnectDrive = async () => {
    setConnectingDrive(true);
    const ok = await connectDrive();
    setConnectingDrive(false);
    if (ok) {
      setShowDriveSheet(false);
      // Start recording after connecting
      if (!isRecording) startRecordingInternal();
    } else {
      Alert.alert('Connection Failed', 'Could not connect to Google Drive. Please try again.');
    }
  };

  const styles = makeStyles(c);

  return (
    <View style={styles.container} testID="voice-notes-section">
      {/* Header + Record button */}
      <View style={styles.header}>
        <Text style={styles.title}>Voice Notes</Text>
        <TouchableOpacity
          testID={isRecording ? 'stop-recording-btn' : 'start-recording-btn'}
          style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
          onPress={isRecording ? handleStopRecording : handleStartRecording}
          activeOpacity={0.8}
        >
          <Feather name={isRecording ? 'square' : 'mic'} size={16} color="#fff" />
          <Text style={styles.recordBtnText}>
            {isRecording
              ? `Stop  ${fmtDuration((recState.durationMillis ?? 0) / 1000)}`
              : 'Record'}
          </Text>
        </TouchableOpacity>
      </View>

      {recordingError ? (
        <Text style={styles.errorText}>{recordingError}</Text>
      ) : null}

      {/* Notes list */}
      {caseNotes.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="mic-off" size={24} color={c.textSecondary} />
          <Text style={styles.emptyText}>No voice notes yet</Text>
        </View>
      ) : (
        <FlatList
          data={caseNotes}
          keyExtractor={n => n.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <NoteRow
              note={item}
              isPlaying={playingId === item.id}
              isUploading={uploadingId === item.id}
              onPlayPause={() => handlePlayPause(item)}
              onDelete={() => handleDelete(item)}
              onSync={() => handleManualSync(item)}
              c={c}
              styles={styles}
            />
          )}
        />
      )}

      <DriveSetupSheet
        visible={showDriveSheet}
        connecting={connectingDrive}
        onConnect={handleConnectDrive}
        onDismiss={() => setShowDriveSheet(false)}
      />
    </View>
  );
}

// ── Note row ───────────────────────────────────────────────────────────────
interface NoteRowProps {
  note: VoiceNote;
  isPlaying: boolean;
  isUploading: boolean;
  onPlayPause: () => void;
  onDelete: () => void;
  onSync: () => void;
  c: any;
  styles: any;
}
function NoteRow({ note, isPlaying, isUploading, onPlayPause, onDelete, onSync, c, styles }: NoteRowProps) {
  return (
    <View style={styles.noteRow} testID={`voice-note-${note.id}`}>
      {/* Play button */}
      <TouchableOpacity style={styles.playBtn} onPress={onPlayPause} activeOpacity={0.7}>
        <Feather name={isPlaying ? 'pause-circle' : 'play-circle'} size={32} color={c.primary} />
      </TouchableOpacity>

      {/* Info */}
      <View style={styles.noteInfo}>
        <Text style={styles.noteTitle} numberOfLines={1}>{note.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={styles.noteMeta}>{fmtDuration(note.duration)}</Text>
          <Text style={styles.noteDot}>·</Text>
          <Text style={styles.noteMeta}>{fmtDate(note.createdAt)}</Text>
        </View>
      </View>

      {/* Sync status */}
      <View style={styles.noteActions}>
        {isUploading ? (
          <ActivityIndicator size="small" color={c.primary} />
        ) : note.isSynced ? (
          <Feather name="cloud" size={14} color="#4285F4" />
        ) : (
          <TouchableOpacity onPress={onSync} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="smartphone" size={14} color={c.textSecondary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          testID={`delete-voice-note-${note.id}`}
          onPress={onDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="trash-2" size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const makeStyles = (c: any) => StyleSheet.create({
  container: { marginTop: Spacing.l },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: Spacing.m,
  },
  title: { ...Typography.headline, fontWeight: '700', color: c.textPrimary },
  recordBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: c.primary, borderRadius: Radius.m,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  recordBtnActive: { backgroundColor: '#EF4444' },
  recordBtnText: { ...Typography.subhead, fontWeight: '600', color: '#fff' },
  errorText: { ...Typography.caption1, color: '#EF4444', marginBottom: 8 },
  empty: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText: { ...Typography.subhead, color: c.textSecondary },
  noteRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: c.surface, borderRadius: Radius.m,
    padding: Spacing.m, marginBottom: Spacing.s, gap: 10,
  },
  playBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  noteInfo: { flex: 1, gap: 2 },
  noteTitle: { ...Typography.subhead, fontWeight: '600', color: c.textPrimary },
  noteMeta: { ...Typography.caption1, color: c.textSecondary },
  noteDot: { ...Typography.caption1, color: c.textSecondary },
  noteActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
