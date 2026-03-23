import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Modal, Animated, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { datingApi } from '../../services/api';
import { Colors, Typography, Spacing, Radii } from '../../constants/theme';

const STAGE_LABELS: Record<string, { label: string; step: number; total: number }> = {
  MATCHED:        { label: '✨ Matched!',          step: 1, total: 6 },
  TEXT_PHASE:     { label: '💬 Text Phase',         step: 2, total: 6 },
  CHECKPOINT:     { label: '🔒 Checkpoint',         step: 3, total: 6 },
  VOICE_UNLOCKED: { label: '🎙️ Voice Unlocked',    step: 4, total: 6 },
  MEET_SUGGESTED: { label: '📍 Meet Suggested',     step: 5, total: 6 },
  POST_DATE:      { label: '🌟 Post-Date',          step: 6, total: 6 },
  CLOSED:         { label: '✖ Closed',              step: 0, total: 6 },
};

function StageBadge({ stage }: { stage: string }) {
  const info = STAGE_LABELS[stage] ?? { label: stage, step: 1, total: 6 };
  const progress = info.step / info.total;
  return (
    <View style={stageBadge.container}>
      <Text style={stageBadge.label}>{info.label}</Text>
      <View style={stageBadge.track}>
        <View style={[stageBadge.fill, { width: `${progress * 100}%` as any }]} />
      </View>
      <Text style={stageBadge.step}>{info.step}/{info.total}</Text>
    </View>
  );
}

const stageBadge = StyleSheet.create({
  container: { gap: 6 },
  label: { ...Typography.label, color: Colors.accentLight },
  track: {
    height: 6, borderRadius: 3,
    backgroundColor: Colors.bgTertiary,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 3 },
  step: { ...Typography.caption, color: Colors.textMuted },
});

// ── Prompt Card ───────────────────────────────────────────────
function PromptCard({
  prompt, matchId, onResponded,
}: { prompt: any; matchId: string; onResponded: () => void }) {
  const [response, setResponse] = useState('');
  const [saving, setSaving] = useState(false);
  const myReply = prompt.responseA ?? prompt.responseB;

  const submit = async () => {
    if (!response.trim()) return;
    setSaving(true);
    try {
      await datingApi.respondToPrompt(matchId, prompt.id, response.trim());
      onResponded();
    } catch {
      Alert.alert('Error', 'Could not save response. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={promptCard.card}>
      <Text style={promptCard.order}>Prompt {prompt.order}</Text>
      <Text style={promptCard.text}>{prompt.promptText}</Text>

      {myReply ? (
        <View style={promptCard.answered}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          <Text style={promptCard.answeredText}>{myReply}</Text>
        </View>
      ) : (
        <View style={promptCard.inputRow}>
          <TextInput
            style={promptCard.input}
            value={response}
            onChangeText={setResponse}
            placeholder="Your answer…"
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[promptCard.btn, saving && { opacity: 0.5 }]}
            onPress={submit}
            disabled={saving || !response.trim()}
          >
            {saving
              ? <ActivityIndicator color={Colors.white} size="small" />
              : <Text style={promptCard.btnText}>Submit</Text>
            }
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const promptCard = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgTertiary,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  order: { ...Typography.caption, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  text: { ...Typography.body, color: Colors.textPrimary, lineHeight: 22 },
  answered: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  answeredText: { ...Typography.bodySmall, color: Colors.success, flex: 1 },
  inputRow: { gap: Spacing.sm },
  input: {
    backgroundColor: Colors.bg,
    borderRadius: Radii.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    ...Typography.body,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  btn: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  btnText: { ...Typography.label, color: Colors.white },
});

// ── Main Screen ───────────────────────────────────────────────
export default function DatingScreen() {
  const [state, setState] = useState<'idle' | 'loading' | 'match' | 'no-match'>('idle');
  const [match, setMatch] = useState<any>(null);
  const [finding, setFinding] = useState(false);
  const [checkpointSent, setCheckpointSent] = useState(false);

  const loadActiveMatch = useCallback(async () => {
    setState('loading');
    try {
      const res = await datingApi.getActiveMatch();
      if (res.data) {
        setMatch(res.data);
        setState('match');
      } else {
        setState('idle');
      }
    } catch {
      setState('idle');
    }
  }, []);

  useEffect(() => { loadActiveMatch(); }, [loadActiveMatch]);

  const handleFindMatch = async () => {
    setFinding(true);
    try {
      const res = await datingApi.findMatch();
      if (res.data?.match) {
        setMatch(res.data.match);
        setState('match');
      } else {
        setState('no-match');
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Could not find a match right now.';
      Alert.alert('Matchmaking', msg);
    } finally {
      setFinding(false);
    }
  };

  const handleCheckpoint = async () => {
    try {
      const res = await datingApi.approveCheckpoint(match.id);
      setCheckpointSent(true);
      if (res.data?.stage === 'VOICE_UNLOCKED') {
        loadActiveMatch();
      }
    } catch {
      Alert.alert('Error', 'Could not send checkpoint approval.');
    }
  };

  const handleClose = () => {
    Alert.alert(
      'End Match',
      'Are you sure you want to close this match? A 24-hour cooldown will start.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Match', style: 'destructive',
          onPress: async () => {
            await datingApi.closeMatch(match.id);
            setMatch(null);
            setState('idle');
          },
        },
      ],
    );
  };

  // ── IDLE / NO-MATCH ─────────────────────────────────────────
  if (state === 'idle' || state === 'no-match') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Dating</Text>
        </View>
        <View style={styles.centerFull}>
          <View style={styles.heartGlow}>
            <Ionicons name="heart" size={64} color={Colors.accent} />
          </View>
          <Text style={styles.heroTitle}>Find Your Match</Text>
          <Text style={styles.heroSub}>
            BondBridge matches you based on values, interests, and communication style — not just photos.
          </Text>

          {state === 'no-match' && (
            <View style={styles.noMatchBadge}>
              <Ionicons name="time-outline" size={16} color={Colors.warning} />
              <Text style={styles.noMatchText}>No compatible matches right now. Check back later!</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.findBtn, finding && { opacity: 0.6 }]}
            onPress={handleFindMatch}
            disabled={finding}
            activeOpacity={0.85}
          >
            {finding
              ? <ActivityIndicator color={Colors.white} />
              : <>
                  <Ionicons name="sparkles" size={20} color={Colors.white} />
                  <Text style={styles.findBtnText}>Find My Match</Text>
                </>
            }
          </TouchableOpacity>

          <View style={styles.pillRow}>
            {['Interest-based', 'Safe & private', 'Guided pacing'].map((t) => (
              <View key={t} style={styles.pill}>
                <Text style={styles.pillText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (state === 'loading') {
    return (
      <View style={styles.containerCenter}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  // ── ACTIVE MATCH ────────────────────────────────────────────
  const partner = match?.partner ?? {};
  const prompts = match?.prompts ?? [];
  const isCheckpointStage = match?.stage === 'CHECKPOINT';
  const isVoiceStage = match?.stage === 'VOICE_UNLOCKED' || match?.stage === 'MEET_SUGGESTED';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Dating</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
          <Ionicons name="close-circle-outline" size={22} color={Colors.danger} />
          <Text style={styles.closeBtnText}>End</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Match card */}
        <View style={styles.matchCard}>
          <View style={styles.matchAvatarWrap}>
            {partner.avatarUrl ? (
              <View style={styles.matchAvatar}>
                <Ionicons name="person" size={40} color={Colors.textMuted} />
              </View>
            ) : (
              <View style={styles.matchAvatar}>
                <Ionicons name="person" size={40} color={Colors.textMuted} />
              </View>
            )}
          </View>
          <View style={{ gap: 4 }}>
            <Text style={styles.partnerName}>{partner.displayName ?? 'Your Match'}</Text>
            <View style={styles.interestRow}>
              {(partner.interests ?? []).slice(0, 3).map((i: string) => (
                <View key={i} style={styles.interestPill}>
                  <Text style={styles.interestText}>{i}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={{ marginTop: Spacing.sm }}>
            <StageBadge stage={match?.stage ?? 'MATCHED'} />
          </View>
        </View>

        {/* Voice unlocked banner */}
        {isVoiceStage && (
          <View style={styles.voiceBanner}>
            <Ionicons name="mic" size={20} color={Colors.success} />
            <Text style={styles.voiceBannerText}>Voice & video call is now unlocked! Reach out via Messages.</Text>
          </View>
        )}

        {/* Checkpoint */}
        {isCheckpointStage && (
          <View style={styles.checkpointCard}>
            <Ionicons name="shield-checkmark" size={28} color={Colors.warning} />
            <Text style={styles.checkpointTitle}>Comfort Checkpoint</Text>
            <Text style={styles.checkpointSub}>
              Both of you must approve before unlocking voice calls. Take your time!
            </Text>
            {checkpointSent || match?.myCheckpoint ? (
              <View style={styles.waitingBadge}>
                <Ionicons name="hourglass-outline" size={16} color={Colors.accentLight} />
                <Text style={styles.waitingText}>Waiting for your match to approve…</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.approveBtn} onPress={handleCheckpoint}>
                <Ionicons name="thumbs-up" size={16} color={Colors.white} />
                <Text style={styles.approveBtnText}>I'm Comfortable — Approve</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Prompts */}
        {prompts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Conversation Prompts</Text>
            <Text style={styles.sectionSub}>Answer these thoughtfully — your match will see your responses too.</Text>
            <View style={{ gap: Spacing.md, marginTop: Spacing.sm }}>
              {prompts.map((p: any) => (
                <PromptCard key={p.id} prompt={p} matchId={match.id} onResponded={loadActiveMatch} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  containerCenter: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  title: { ...Typography.h2, color: Colors.textPrimary },
  closeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  closeBtnText: { ...Typography.label, color: Colors.danger },
  centerFull: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.lg },
  heartGlow: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: Colors.accentGlow,
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { ...Typography.h2, color: Colors.textPrimary, textAlign: 'center' },
  heroSub: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  noMatchBadge: {
    flexDirection: 'row', gap: 8, alignItems: 'center',
    backgroundColor: Colors.warningLight, borderRadius: Radii.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  noMatchText: { ...Typography.bodySmall, color: Colors.warning, flex: 1 },
  findBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.accent, borderRadius: Radii.xl,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5, shadowRadius: 14, elevation: 10,
  },
  findBtnText: { ...Typography.h4, color: Colors.white },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'center' },
  pill: {
    backgroundColor: Colors.surface, borderRadius: Radii.full,
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  pillText: { ...Typography.caption, color: Colors.textSecondary },
  scroll: { padding: Spacing.md, gap: Spacing.lg, paddingBottom: 40 },
  matchCard: {
    backgroundColor: Colors.bgTertiary, borderRadius: Radii.xl,
    padding: Spacing.lg, gap: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center',
  },
  matchAvatarWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.bgSecondary, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.accent,
  },
  matchAvatar: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  partnerName: { ...Typography.h3, color: Colors.textPrimary, textAlign: 'center' },
  interestRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
  interestPill: {
    backgroundColor: Colors.accentGlow, borderRadius: Radii.full,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  interestText: { ...Typography.caption, color: Colors.accentLight },
  voiceBanner: {
    flexDirection: 'row', gap: Spacing.sm, alignItems: 'center',
    backgroundColor: Colors.successLight, borderRadius: Radii.md,
    padding: Spacing.md,
  },
  voiceBannerText: { ...Typography.bodySmall, color: Colors.success, flex: 1 },
  checkpointCard: {
    backgroundColor: Colors.bgTertiary, borderRadius: Radii.lg,
    padding: Spacing.lg, gap: Spacing.md, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.warning + '40',
  },
  checkpointTitle: { ...Typography.h3, color: Colors.warning },
  checkpointSub: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
  waitingBadge: {
    flexDirection: 'row', gap: 6, alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radii.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  waitingText: { ...Typography.bodySmall, color: Colors.accentLight },
  approveBtn: {
    flexDirection: 'row', gap: 8, alignItems: 'center',
    backgroundColor: Colors.success, borderRadius: Radii.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 2,
  },
  approveBtnText: { ...Typography.label, color: Colors.white },
  section: { gap: Spacing.xs },
  sectionTitle: { ...Typography.h4, color: Colors.textPrimary },
  sectionSub: { ...Typography.bodySmall, color: Colors.textMuted },
});
