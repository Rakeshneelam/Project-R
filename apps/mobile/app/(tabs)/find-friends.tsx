import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, RefreshControl, ScrollView, Animated, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { friendsApi } from '../../services/api';
import { Colors, Spacing, Radii, Typography } from '../../constants/theme';

const ONBOARDING_KEY = 'bondbridge_interests_set';

// ─── Interest data (research-backed matching signals) ─────────────
const INTEREST_CATEGORIES = [
  {
    label: '🎯 Hobbies & Activities',
    items: ['Gaming', 'Reading', 'Cooking', 'Hiking', 'Photography', 'Gardening', 'DIY', 'Travelling', 'Running', 'Cycling'],
  },
  {
    label: '🎵 Arts & Entertainment',
    items: ['Music', 'Movies', 'Anime', 'Theatre', 'Podcasts', 'Stand-up Comedy', 'Art', 'Writing', 'Dance', 'K-Drama'],
  },
  {
    label: '⚽ Sports',
    items: ['Football', 'Cricket', 'Basketball', 'Tennis', 'Badminton', 'Gym & Fitness', 'Yoga', 'Swimming', 'Chess', 'eSports'],
  },
  {
    label: '💡 Learning & Growth',
    items: ['Tech', 'Science', 'History', 'Philosophy', 'Finance & Investing', 'Languages', 'Psychology', 'Self-improvement', 'Business', 'Design'],
  },
  {
    label: '🌍 Lifestyle',
    items: ['Food & Dining', 'Fashion', 'Sustainability', 'Spirituality', 'Parenting', 'Pets', 'Cars', 'Real Estate', 'Volunteering', 'Minimalism'],
  },
];

const VIBE_TAGS = ['Chill', 'Adventurous', 'Nerdy', 'Creative', 'Ambitious', 'Funny', 'Deep Thinker', 'Outdoorsy', 'Foodie', 'Night Owl', 'Early Bird', 'Homebody'];

const SOCIAL_TYPES = [
  { value: 'INTROVERT',  label: 'Introvert',  desc: 'I recharge alone', icon: '🔋' },
  { value: 'AMBIVERT',   label: 'Ambivert',   desc: 'Depends on the day', icon: '⚡' },
  { value: 'EXTROVERT',  label: 'Extrovert',  desc: 'Energy from people', icon: '🌟' },
];

const COMM_STYLES = [
  { value: 'TEXT_FIRST',      label: 'Text first',  icon: '💬' },
  { value: 'VOICE_FIRST',     label: 'Voice calls', icon: '📞' },
  { value: 'VIDEO_FIRST',     label: 'Video calls', icon: '📹' },
  { value: 'IN_PERSON_FIRST', label: 'In person',   icon: '🤝' },
];

// ─── Onboarding multi-step wizard ────────────────────────────────
interface OnboardingProps {
  onComplete: () => void;
}

function OnboardingWizard({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);   // interests
  const [vibes, setVibes] = useState<string[]>([]);
  const [socialType, setSocialType] = useState('AMBIVERT');
  const [commStyle, setCommStyle] = useState('TEXT_FIRST');
  const [city, setCity] = useState('');
  const [saving, setSaving] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const TOTAL_STEPS = 5;
  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  const toggleInterest = (item: string) =>
    setSelected((prev) => prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]);

  const toggleVibe = (v: string) =>
    setVibes((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);

  const next = () => {
    Animated.timing(slideAnim, { toValue: -400, duration: 220, useNativeDriver: true }).start(() => {
      setStep((s) => s + 1);
      slideAnim.setValue(400);
      Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await friendsApi.saveInterests({
        interests: selected,
        vibeTags: vibes,
        socialType,
        communicationStyle: commStyle,
        city: city.trim() || undefined,
      });
      await AsyncStorage.setItem(ONBOARDING_KEY, 'done');
      onComplete();
    } catch (e) {
      // Save locally even if API fails, so we don't show the wizard again
      await AsyncStorage.setItem(ONBOARDING_KEY, 'done');
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  const canNext = [
    selected.length >= 3, // at least 3 interests
    vibes.length >= 1,
    true,  // social type always has a default
    true,  // comm style always has a default
    true,  // city is optional
  ][step];

  return (
    <View style={wStyles.container}>
      {/* Progress bar */}
      <View style={wStyles.progressTrack}>
        <View style={[wStyles.progressFill, { width: `${progress}%` as any }]} />
      </View>
      <Text style={wStyles.stepLabel}>Step {step + 1} of {TOTAL_STEPS}</Text>

      <Animated.View style={{ transform: [{ translateX: slideAnim }], flex: 1 }}>
        {/* ── Step 0: Interests ── */}
        {step === 0 && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={wStyles.scroll}>
            <Text style={wStyles.title}>What are you into?</Text>
            <Text style={wStyles.subtitle}>Pick at least 3 — we'll find people who share your passions</Text>
            {INTEREST_CATEGORIES.map((cat) => (
              <View key={cat.label} style={wStyles.catBlock}>
                <Text style={wStyles.catLabel}>{cat.label}</Text>
                <View style={wStyles.chips}>
                  {cat.items.map((item) => {
                    const active = selected.includes(item);
                    return (
                      <TouchableOpacity
                        key={item}
                        style={[wStyles.chip, active && wStyles.chipActive]}
                        onPress={() => toggleInterest(item)}
                      >
                        <Text style={[wStyles.chipText, active && wStyles.chipTextActive]}>{item}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
            <View style={{ height: 80 }} />
          </ScrollView>
        )}

        {/* ── Step 1: Vibe tags ── */}
        {step === 1 && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={wStyles.scroll}>
            <Text style={wStyles.title}>What's your vibe?</Text>
            <Text style={wStyles.subtitle}>Choose words that describe your energy</Text>
            <View style={wStyles.chips}>
              {VIBE_TAGS.map((v) => {
                const active = vibes.includes(v);
                return (
                  <TouchableOpacity
                    key={v}
                    style={[wStyles.chip, active && wStyles.chipActive, { marginBottom: 10 }]}
                    onPress={() => toggleVibe(v)}
                  >
                    <Text style={[wStyles.chipText, active && wStyles.chipTextActive]}>{v}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        )}

        {/* ── Step 2: Social type ── */}
        {step === 2 && (
          <View style={wStyles.scroll}>
            <Text style={wStyles.title}>How do you recharge?</Text>
            <Text style={wStyles.subtitle}>This helps us match your social energy</Text>
            {SOCIAL_TYPES.map((s) => (
              <TouchableOpacity
                key={s.value}
                style={[wStyles.optionCard, socialType === s.value && wStyles.optionCardActive]}
                onPress={() => setSocialType(s.value)}
              >
                <Text style={wStyles.optionIcon}>{s.icon}</Text>
                <View>
                  <Text style={[wStyles.optionLabel, socialType === s.value && wStyles.optionLabelActive]}>{s.label}</Text>
                  <Text style={wStyles.optionDesc}>{s.desc}</Text>
                </View>
                {socialType === s.value && <Ionicons name="checkmark-circle" size={22} color={Colors.accent} style={{ marginLeft: 'auto' }} />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Step 3: Communication style ── */}
        {step === 3 && (
          <View style={wStyles.scroll}>
            <Text style={wStyles.title}>How do you prefer to connect?</Text>
            <Text style={wStyles.subtitle}>We'll match you with people who communicate the same way</Text>
            {COMM_STYLES.map((c) => (
              <TouchableOpacity
                key={c.value}
                style={[wStyles.optionCard, commStyle === c.value && wStyles.optionCardActive]}
                onPress={() => setCommStyle(c.value)}
              >
                <Text style={wStyles.optionIcon}>{c.icon}</Text>
                <Text style={[wStyles.optionLabel, commStyle === c.value && wStyles.optionLabelActive]}>{c.label}</Text>
                {commStyle === c.value && <Ionicons name="checkmark-circle" size={22} color={Colors.accent} style={{ marginLeft: 'auto' }} />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Step 4: City (optional) ── */}
        {step === 4 && (
          <View style={wStyles.scroll}>
            <Text style={wStyles.title}>Where are you based?</Text>
            <Text style={wStyles.subtitle}>Optional — helps find people in your city</Text>
            <View style={wStyles.cityInput}>
              <Ionicons name="location-outline" size={20} color={Colors.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={wStyles.cityField}
                value={city}
                onChangeText={setCity}
                placeholder="e.g. Mumbai, London, New York..."
                placeholderTextColor={Colors.textMuted}
                autoCorrect={false}
              />
            </View>
            <Text style={wStyles.skipNote}>You can skip this — tap Finish below</Text>

            {/* Summary */}
            <View style={wStyles.summaryBox}>
              <Text style={wStyles.summaryTitle}>Your profile summary</Text>
              <Text style={wStyles.summaryRow}>🎯 {selected.length} interests selected</Text>
              <Text style={wStyles.summaryRow}>✨ Vibes: {vibes.join(', ') || 'none'}</Text>
              <Text style={wStyles.summaryRow}>
                🧠 {SOCIAL_TYPES.find((s) => s.value === socialType)?.label} ·{' '}
                {COMM_STYLES.find((c) => c.value === commStyle)?.label}
              </Text>
            </View>
          </View>
        )}
      </Animated.View>

      {/* Footer button */}
      <View style={wStyles.footer}>
        {step < TOTAL_STEPS - 1 ? (
          <TouchableOpacity
            style={[wStyles.nextBtn, !canNext && wStyles.nextBtnDisabled]}
            onPress={next}
            disabled={!canNext}
          >
            <Text style={wStyles.nextText}>Continue</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={wStyles.nextBtn} onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator color={Colors.white} /> : (
              <>
                <Text style={wStyles.nextText}>Find My Matches 🎯</Text>
              </>
            )}
          </TouchableOpacity>
        )}
        {step === TOTAL_STEPS - 1 && (
          <TouchableOpacity onPress={save} style={{ marginTop: 12, alignSelf: 'center' }}>
            <Text style={{ color: Colors.textMuted, fontSize: 13 }}>Skip for now</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const wStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  progressTrack: { height: 3, backgroundColor: Colors.bgTertiary, marginHorizontal: Spacing.md, borderRadius: 2, marginTop: Spacing.sm },
  progressFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 2 },
  stepLabel: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center', marginTop: 6, marginBottom: 4 },
  scroll: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, flex: 1 },
  title: { ...Typography.h2, color: Colors.textPrimary, marginBottom: 6, marginTop: Spacing.md },
  subtitle: { ...Typography.body, color: Colors.textMuted, marginBottom: Spacing.lg },
  catBlock: { marginBottom: Spacing.md },
  catLabel: { ...Typography.label, color: Colors.textMuted, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radii.full,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderLight,
  },
  chipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipText: { fontSize: 13, color: Colors.textSecondary },
  chipTextActive: { color: Colors.white, fontWeight: '600' },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radii.lg,
    borderWidth: 1, borderColor: Colors.borderLight,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  optionCardActive: { borderColor: Colors.accent, backgroundColor: Colors.accentGlow },
  optionIcon: { fontSize: 24 },
  optionLabel: { ...Typography.label, color: Colors.textPrimary },
  optionLabelActive: { color: Colors.accentLight },
  optionDesc: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  cityInput: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radii.lg,
    borderWidth: 1, borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.md, height: 50, marginBottom: Spacing.sm,
  },
  cityField: { flex: 1, ...Typography.body, color: Colors.textPrimary },
  skipNote: { ...Typography.caption, color: Colors.textMuted, marginBottom: Spacing.xl },
  summaryBox: {
    backgroundColor: Colors.surface, borderRadius: Radii.lg,
    borderWidth: 1, borderColor: Colors.borderLight,
    padding: Spacing.md, gap: 8, marginTop: Spacing.md,
  },
  summaryTitle: { ...Typography.label, color: Colors.accentLight, marginBottom: 4 },
  summaryRow: { ...Typography.body, color: Colors.textSecondary },
  footer: { padding: Spacing.md, paddingBottom: Platform.OS === 'ios' ? 36 : Spacing.md },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.accent, borderRadius: Radii.lg,
    height: 52,
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextText: { ...Typography.label, color: Colors.white, fontSize: 15 },
});

// ─── Match Card ───────────────────────────────────────────────────
function MatchCard({ match, onConnect }: { match: any; onConnect: (id: string) => void }) {
  const u = match.user ?? match;
  const name = u.profile?.displayName ?? u.displayName ?? u.name ?? 'User';
  const initials = name[0]?.toUpperCase() ?? '?';
  const score = match.matchScore ?? 0;
  const interests = u.profile?.interests?.slice(0, 4) ?? [];
  const vibes = u.profile?.vibeTags?.slice(0, 2) ?? [];
  const city = u.profile?.city;

  const scoreColor = score >= 70 ? '#4ECDC4' : score >= 40 ? Colors.accentLight : Colors.textMuted;

  return (
    <View style={mStyles.card}>
      <View style={mStyles.top}>
        <LinearGradient colors={[Colors.accent, Colors.accentLight]} style={mStyles.avatar}>
          <Text style={mStyles.initials}>{initials}</Text>
        </LinearGradient>

        <View style={mStyles.info}>
          <Text style={mStyles.name}>{name}</Text>
          {city && (
            <Text style={mStyles.city}>
              <Ionicons name="location-outline" size={11} color={Colors.textMuted} /> {city}
            </Text>
          )}
          {vibes.length > 0 && (
            <Text style={mStyles.vibeText}>{vibes.join(' · ')}</Text>
          )}
        </View>

        {/* Match score */}
        <View style={mStyles.scoreWrap}>
          <Text style={[mStyles.scoreNum, { color: scoreColor }]}>{score}%</Text>
          <Text style={mStyles.scoreLabel}>match</Text>
        </View>
      </View>

      {/* Shared interests */}
      {interests.length > 0 && (
        <View style={mStyles.tags}>
          {interests.map((t: string) => (
            <View key={t} style={mStyles.tag}>
              <Text style={mStyles.tagText}>{t}</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[mStyles.connectBtn, u.isConnected && mStyles.connectBtnDone]}
        onPress={() => onConnect(u.id ?? match.id)}
        disabled={u.isConnected}
      >
        <Ionicons
          name={u.isConnected ? 'checkmark-circle' : 'person-add-outline'}
          size={16}
          color={u.isConnected ? Colors.textMuted : Colors.white}
        />
        <Text style={[mStyles.connectText, u.isConnected && mStyles.connectTextDone]}>
          {u.isConnected ? 'Request Sent' : 'Connect'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const mStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface, borderRadius: Radii.lg,
    borderWidth: 1, borderColor: Colors.borderLight,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: 20, fontWeight: '700', color: Colors.white },
  info: { flex: 1 },
  name: { ...Typography.label, color: Colors.textPrimary, fontSize: 15 },
  city: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  vibeText: { ...Typography.caption, color: Colors.accentLight, marginTop: 2 },
  scoreWrap: { alignItems: 'center' },
  scoreNum: { fontSize: 22, fontWeight: '800' },
  scoreLabel: { ...Typography.caption, color: Colors.textMuted },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: Spacing.sm },
  tag: {
    backgroundColor: Colors.accentGlow, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radii.full, borderWidth: 1, borderColor: Colors.accent + '33',
  },
  tagText: { fontSize: 11, color: Colors.accentLight },
  connectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.accent, borderRadius: Radii.full,
    paddingVertical: 9, marginTop: 4,
  },
  connectBtnDone: { backgroundColor: Colors.bgTertiary },
  connectText: { fontSize: 13, fontWeight: '700', color: Colors.white },
  connectTextDone: { color: Colors.textMuted },
});

// ─── Main screen ──────────────────────────────────────────────────
export default function FindFriendsScreen() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchMode, setSearchMode] = useState(false);

  // Check if onboarding is done
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      setShowOnboarding(!val);
    });
  }, []);

  const loadMatches = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await friendsApi.discover();
      setMatches(data.data ?? data.items ?? data ?? []);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (showOnboarding === false) loadMatches();
  }, [showOnboarding]);

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); setSearchMode(false); return; }
    setSearchMode(true);
    const t = setTimeout(async () => {
      try {
        const { data } = await friendsApi.search(search);
        setSearchResults(data.users ?? data ?? []);
      } catch {}
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const handleConnect = async (userId: string) => {
    // Optimistic update
    const update = (list: any[]) => list.map((m) => {
      const id = m.user?.id ?? m.id;
      return id === userId ? { ...m, user: { ...(m.user ?? m), isConnected: true } } : m;
    });
    setMatches(update);
    setSearchResults((prev) => prev.map((u) => u.id === userId ? { ...u, isConnected: true } : u));
    try {
      await friendsApi.sendRequest(userId, 'Hey! Found you on BondBridge 👋');
    } catch {}
  };

  const onboardingDone = () => {
    setShowOnboarding(false);
    loadMatches();
  };

  // Still checking AsyncStorage
  if (showOnboarding === null) {
    return (
      <SafeAreaView style={mainStyles.container} edges={['top']}>
        <View style={mainStyles.center}><ActivityIndicator color={Colors.accent} size="large" /></View>
      </SafeAreaView>
    );
  }

  // First-time: show onboarding wizard
  if (showOnboarding) {
    return (
      <SafeAreaView style={mainStyles.container} edges={['top']}>
        <OnboardingWizard onComplete={onboardingDone} />
      </SafeAreaView>
    );
  }

  // Main matches screen
  const displayData = searchMode ? searchResults : matches;

  return (
    <SafeAreaView style={mainStyles.container} edges={['top']}>
      {/* Header */}
      <View style={mainStyles.header}>
        <View>
          <Text style={mainStyles.title}>Find Friends</Text>
          {!searchMode && matches.length > 0 && (
            <Text style={mainStyles.subtitle}>{matches.length} people match your interests</Text>
          )}
        </View>
        <TouchableOpacity
          style={mainStyles.resetBtn}
          onPress={async () => {
            await AsyncStorage.removeItem(ONBOARDING_KEY);
            setShowOnboarding(true);
          }}
        >
          <Ionicons name="options-outline" size={20} color={Colors.accentLight} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={mainStyles.searchWrapper}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={mainStyles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name..."
          placeholderTextColor={Colors.textMuted}
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {!searchMode && (
        <Text style={mainStyles.sectionLabel}>✨ Matched for you</Text>
      )}

      {loading ? (
        <View style={mainStyles.center}><ActivityIndicator color={Colors.accent} size="large" /></View>
      ) : (
        <FlatList
          data={displayData}
          keyExtractor={(item, i) => (item.user?.id ?? item.id ?? String(i))}
          contentContainerStyle={mainStyles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            !searchMode
              ? <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadMatches(); }} tintColor={Colors.accent} />
              : undefined
          }
          renderItem={({ item }) =>
            searchMode
              ? (
                <MatchCard
                  match={{ user: item, matchScore: 0 }}
                  onConnect={handleConnect}
                />
              )
              : <MatchCard match={item} onConnect={handleConnect} />
          }
          ListEmptyComponent={
            <View style={mainStyles.center}>
              <Ionicons name="people-outline" size={52} color={Colors.textMuted} />
              <Text style={mainStyles.emptyText}>
                {searchMode ? 'No people found' : 'No matches yet'}
              </Text>
              <Text style={mainStyles.emptySub}>
                {searchMode
                  ? 'Try a different name'
                  : 'Join communities to boost your matches'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const mainStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  title: { ...Typography.h2, color: Colors.textPrimary },
  subtitle: { ...Typography.caption, color: Colors.accentLight, marginTop: 2 },
  resetBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.accentGlow,
    borderWidth: 1, borderColor: Colors.accent + '44',
  },
  searchWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderLight,
    borderRadius: Radii.lg, marginHorizontal: Spacing.md,
    marginTop: Spacing.md, marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md, height: 46,
  },
  searchInput: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
  sectionLabel: {
    ...Typography.label, color: Colors.textMuted,
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm,
  },
  list: { paddingHorizontal: Spacing.md, paddingBottom: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingTop: 60 },
  emptyText: { ...Typography.h4, color: Colors.textSecondary },
  emptySub: {
    ...Typography.caption, color: Colors.textMuted,
    textAlign: 'center', paddingHorizontal: Spacing.xl,
  },
});
