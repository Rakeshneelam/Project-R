import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, RefreshControl, ScrollView, Animated, Platform, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { friendsApi } from '../../services/api';
import { Colors, Spacing, Radii, Typography } from '../../constants/theme';

const ONBOARDING_KEY = 'bondbridge_interests_v2';
const TOTAL_STEPS = 8;

// ─── Onboarding data ──────────────────────────────────────────────

const INTEREST_SECTIONS = [
  {
    key: 'hobbies', label: '🎯 Hobbies & Activities', max: 5,
    items: ['Gaming','Reading','Cooking','Hiking','Photography','Gardening','DIY','Travelling','Running','Cycling','Fishing','Painting','Rock Climbing','Surfing','Skateboarding','Camping'],
  },
  {
    key: 'music', label: '🎵 Music', max: 3,
    items: ['Pop','Rock','Hip-Hop','Classical','Jazz','Electronic / EDM','R&B / Soul','Indie','Metal','Country','K-Pop','Folk','Reggae','Lo-Fi','Bollywood'],
  },
  {
    key: 'screen', label: '🎬 Movies & TV', max: 3,
    items: ['Action','Comedy','Drama','Sci-Fi','Horror','Romance','Documentary','Anime','K-Drama','Thriller','Fantasy','True Crime','Reality TV','Cartoons / Animation'],
  },
  {
    key: 'sports', label: '⚽ Sports & Fitness', max: 4,
    items: ['Football','Cricket','Basketball','Tennis','Badminton','Swimming','Volleyball','Table Tennis','Gym & Fitness','Martial Arts','Cycling','Yoga','Running','eSports'],
  },
  {
    key: 'gaming', label: '🎮 Gaming', max: 3,
    items: ['PC Gaming','Console Gaming','Mobile Gaming','RPGs','FPS / Shooters','Strategy Games','Board Games','Card Games','MMOs','Indie Games','Simulation'],
  },
  {
    key: 'food', label: '🍽️ Food & Drink', max: 3,
    items: ['Cooking','Baking','Street Food','Fine Dining','Veganism','Coffee','Tea','Cocktails / Mocktails','BBQ','Sushi','World Cuisines','Food Photography'],
  },
  {
    key: 'travel', label: '🌍 Travel & Outdoors', max: 3,
    items: ['Backpacking','Beach Holidays','City Breaks','Hiking Trips','Camping','Road Trips','Solo Travel','Adventure Travel','Wildlife & Nature','Luxury Travel'],
  },
  {
    key: 'learning', label: '💡 Learning & Growth', max: 4,
    items: ['Tech & AI','Science','History','Philosophy','Finance & Investing','Languages','Psychology','Self-improvement','Business','Design','Astronomy','Literature','Law'],
  },
  {
    key: 'arts', label: '🎨 Arts & Creativity', max: 3,
    items: ['Drawing / Illustration','Graphic Design','Writing','Poetry','Music Production','Video Editing','Fashion Design','Sculpture','Street Art','Theatre'],
  },
  {
    key: 'lifestyle', label: '🌿 Lifestyle', max: 3,
    items: ['Sustainability','Minimalism','Spirituality / Meditation','Fashion','Beauty & Skincare','Pets','Parenting','Volunteering','Wellness','Astrology'],
  },
];

const VIBE_TAGS = [
  'Chill 😌','Adventurous 🏔️','Nerdy 🤓','Creative 🎨','Ambitious 🚀',
  'Funny 😂','Deep Thinker 🧠','Outdoorsy 🌲','Foodie 🍕','Night Owl 🦉',
  'Early Bird 🌅','Homebody 🏠','Spontaneous ⚡','Laid-back 🌊','Hustler 💼',
  'Empath 💛','Introvert recharging 🔋','Social butterfly 🦋',
];

const SOCIAL_TYPES = [
  { value: 'INTROVERT', label: 'Introvert',  desc: 'I recharge alone, prefer small groups', icon: '🔋' },
  { value: 'AMBIVERT',  label: 'Ambivert',   desc: 'Depends on the day and the people',     icon: '⚡' },
  { value: 'EXTROVERT', label: 'Extrovert',  desc: 'I gain energy from being around people', icon: '🌟' },
];

const COMM_STYLES = [
  { value: 'TEXT_FIRST',      label: 'Texting first',  desc: 'I prefer getting to know through messages', icon: '💬' },
  { value: 'VOICE_FIRST',     label: 'Voice calls',    desc: 'I love a good voice chat',                  icon: '📞' },
  { value: 'VIDEO_FIRST',     label: 'Video calls',    desc: 'Face to face, even virtually',              icon: '📹' },
  { value: 'IN_PERSON_FIRST', label: 'In person',      desc: 'Real life meetups are my thing',            icon: '🤝' },
];

const LIFE_STAGES = [
  { value: 'student',     label: '🎓 Student',                desc: 'School / College / University' },
  { value: 'working',     label: '💼 Working Professional',   desc: '9-to-5 or corporate life' },
  { value: 'freelancer',  label: '💻 Freelancer / Creator',   desc: 'Self-employed, remote or creative work' },
  { value: 'parent',      label: '👶 Parent',                 desc: 'Raising kids' },
  { value: 'nomad',       label: '✈️ Digital Nomad',          desc: 'Location-independent lifestyle' },
  { value: 'transition',  label: '🔄 Career Transition',      desc: 'Between chapters' },
];

const FRIEND_GOALS = [
  '🎮 Gaming Buddy','📚 Study Partner','🏋️ Gym / Workout Partner',
  '✈️ Travel Companion','💬 Deep Conversations','😂 Laugh & Chat',
  '🎨 Creative Collaborator','🍕 Food Buddy','🎵 Music Buddy',
  '🌿 Hiking / Nature Buddy','💼 Networking / Career Growth','📺 Watch Party Buddy',
  '🎯 Accountability Partner','🧘 Wellness Buddy',
];

const AVAILABILITY = [
  { value: 'morning',   label: '🌅 Mornings',   desc: '6am – 12pm' },
  { value: 'afternoon', label: '☀️ Afternoons',  desc: '12pm – 6pm' },
  { value: 'evening',   label: '🌆 Evenings',    desc: '6pm – 10pm' },
  { value: 'night',     label: '🦉 Night Owl',   desc: '10pm+' },
  { value: 'weekends',  label: '🗓️ Weekends',    desc: 'Saturday & Sunday' },
  { value: 'flexible',  label: '⚡ Flexible',    desc: 'Whenever works' },
];

// ─── Section-limited chip picker ─────────────────────────────────
function SectionChips({
  section, selected, onToggle,
}: { section: typeof INTEREST_SECTIONS[0]; selected: string[]; onToggle: (item: string) => void }) {
  const sectionSelected = section.items.filter((i) => selected.includes(i));
  const atLimit = sectionSelected.length >= section.max;

  return (
    <View style={sStyles.block}>
      <View style={sStyles.header}>
        <Text style={sStyles.label}>{section.label}</Text>
        <Text style={[sStyles.count, atLimit && sStyles.countFull]}>
          {sectionSelected.length}/{section.max}
        </Text>
      </View>
      <View style={sStyles.chips}>
        {section.items.map((item) => {
          const active = selected.includes(item);
          const disabled = !active && atLimit;
          return (
            <TouchableOpacity
              key={item}
              style={[sStyles.chip, active && sStyles.chipActive, disabled && sStyles.chipDisabled]}
              onPress={() => onToggle(item)}
              disabled={disabled}
            >
              <Text style={[sStyles.chipText, active && sStyles.chipTextActive, disabled && sStyles.chipTextDisabled]}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const sStyles = StyleSheet.create({
  block: { marginBottom: Spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { ...Typography.label, color: Colors.textMuted },
  count: { fontSize: 11, fontWeight: '700', color: Colors.textMuted },
  countFull: { color: Colors.accent },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 13, paddingVertical: 7, borderRadius: Radii.full,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderLight,
  },
  chipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipDisabled: { opacity: 0.3 },
  chipText: { fontSize: 12, color: Colors.textSecondary },
  chipTextActive: { color: Colors.white, fontWeight: '600' },
  chipTextDisabled: { color: Colors.textMuted },
});

// ─── Generic option card ──────────────────────────────────────────
function OptionCard({ icon, label, desc, active, onPress }: { icon: string; label: string; desc?: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[optStyles.card, active && optStyles.cardActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={optStyles.icon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[optStyles.label, active && optStyles.labelActive]}>{label}</Text>
        {desc && <Text style={optStyles.desc}>{desc}</Text>}
      </View>
      {active && <Ionicons name="checkmark-circle" size={22} color={Colors.accent} />}
    </TouchableOpacity>
  );
}

const optStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radii.lg,
    borderWidth: 1, borderColor: Colors.borderLight,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  cardActive: { borderColor: Colors.accent, backgroundColor: Colors.accentGlow },
  icon: { fontSize: 22, width: 30, textAlign: 'center' },
  label: { ...Typography.label, color: Colors.textPrimary },
  labelActive: { color: Colors.accentLight },
  desc: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
});

// ─── Onboarding Wizard ────────────────────────────────────────────
function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // State for each step
  const [interests, setInterests] = useState<string[]>([]);
  const [vibes, setVibes] = useState<string[]>([]);
  const [socialType, setSocialType] = useState('AMBIVERT');
  const [commStyle, setCommStyle] = useState('TEXT_FIRST');
  const [lifeStage, setLifeStage] = useState('');
  const [friendGoals, setFriendGoals] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string[]>([]);
  const [city, setCity] = useState('');
  const [saving, setSaving] = useState(false);

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  const animate = (cb: () => void) => {
    Animated.timing(slideAnim, { toValue: -420, duration: 200, useNativeDriver: true }).start(() => {
      cb();
      slideAnim.setValue(420);
      Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    });
  };

  const toggleInterest = (item: string) => {
    const section = INTEREST_SECTIONS.find((s) => s.items.includes(item))!;
    const sectionSelected = section.items.filter((i) => interests.includes(i));
    if (interests.includes(item)) {
      setInterests((prev) => prev.filter((i) => i !== item));
    } else if (sectionSelected.length < section.max) {
      setInterests((prev) => [...prev, item]);
    }
  };

  const toggleMulti = (val: string, setter: React.Dispatch<React.SetStateAction<string[]>>, max = 99) =>
    setter((prev) => prev.includes(val) ? prev.filter((v) => v !== val) : prev.length < max ? [...prev, val] : prev);

  const canContinue = [
    interests.length >= 5,       // Step 0: picks 5+ interests total
    vibes.length >= 2,            // Step 1: picks 2+ vibes
    !!socialType,                 // Step 2: always has default
    !!commStyle,                  // Step 3: always has default
    !!lifeStage,                  // Step 4: must pick life stage
    friendGoals.length >= 2,      // Step 5: picks 2+ goals
    availability.length >= 1,     // Step 6: picks 1+ availability
    true,                         // Step 7: city optional
  ][step];

  const save = async () => {
    setSaving(true);
    try {
      await friendsApi.saveInterests({
        interests,
        vibeTags: vibes,
        socialType,
        communicationStyle: commStyle,
        city: city.trim() || undefined,
      });
    } catch {}
    await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify({ interests, vibes, socialType, commStyle, lifeStage, friendGoals, availability, city }));
    setSaving(false);
    onComplete();
  };

  const stepTitles = [
    'What are you into?',
    "What's your vibe?",
    'How do you recharge?',
    'How do you like to connect?',
    "What's your life stage?",
    'What kind of friend are you looking for?',
    'When are you usually free?',
    'Almost there!',
  ];
  const stepSubtitles = [
    'Pick up to the limit per section (min 5 total to continue)',
    'Choose words that describe your energy — pick at least 2',
    'This shapes who we pair you with',
    'We match people with the same communication style',
    'Helps us find people in similar situations',
    'Pick at least 2 — we will match you with the right people',
    'We will suggest friends who are active at similar times',
    'Add your city to find local matches (optional)',
  ];

  return (
    <View style={wStyles.container}>
      {/* Progress */}
      <View style={wStyles.progressTrack}>
        <Animated.View style={[wStyles.progressFill, { width: `${progress}%` as any }]} />
      </View>
      <Text style={wStyles.stepLabel}>Step {step + 1} of {TOTAL_STEPS}</Text>

      <Animated.View style={{ flex: 1, transform: [{ translateX: slideAnim }] }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={wStyles.scroll}>
          <Text style={wStyles.title}>{stepTitles[step]}</Text>
          <Text style={wStyles.subtitle}>{stepSubtitles[step]}</Text>

          {/* Step 0: Interests by section */}
          {step === 0 && INTEREST_SECTIONS.map((section) => (
            <SectionChips key={section.key} section={section} selected={interests} onToggle={toggleInterest} />
          ))}

          {/* Step 1: Vibes */}
          {step === 1 && (
            <View style={sStyles.chips}>
              {VIBE_TAGS.map((v) => {
                const active = vibes.includes(v);
                return (
                  <TouchableOpacity
                    key={v}
                    style={[sStyles.chip, active && sStyles.chipActive, { marginBottom: 10 }]}
                    onPress={() => toggleMulti(v, setVibes, 4)}
                  >
                    <Text style={[sStyles.chipText, active && sStyles.chipTextActive]}>{v}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Step 2: Social type */}
          {step === 2 && SOCIAL_TYPES.map((s) => (
            <OptionCard key={s.value} icon={s.icon} label={s.label} desc={s.desc}
              active={socialType === s.value} onPress={() => setSocialType(s.value)} />
          ))}

          {/* Step 3: Communication style */}
          {step === 3 && COMM_STYLES.map((c) => (
            <OptionCard key={c.value} icon={c.icon} label={c.label} desc={c.desc}
              active={commStyle === c.value} onPress={() => setCommStyle(c.value)} />
          ))}

          {/* Step 4: Life stage */}
          {step === 4 && LIFE_STAGES.map((s) => (
            <OptionCard key={s.value} icon={s.label.split(' ')[0]} label={s.label.split(' ').slice(1).join(' ')} desc={s.desc}
              active={lifeStage === s.value} onPress={() => setLifeStage(s.value)} />
          ))}

          {/* Step 5: Friend goals */}
          {step === 5 && (
            <>
              <Text style={wStyles.limitHint}>Pick at least 2 · up to 5</Text>
              <View style={sStyles.chips}>
                {FRIEND_GOALS.map((g) => {
                  const active = friendGoals.includes(g);
                  const disabled = !active && friendGoals.length >= 5;
                  return (
                    <TouchableOpacity
                      key={g}
                      style={[sStyles.chip, active && sStyles.chipActive, disabled && sStyles.chipDisabled, { marginBottom: 10 }]}
                      onPress={() => toggleMulti(g, setFriendGoals, 5)}
                      disabled={disabled}
                    >
                      <Text style={[sStyles.chipText, active && sStyles.chipTextActive]}>{g}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* Step 6: Availability */}
          {step === 6 && AVAILABILITY.map((a) => {
            const active = availability.includes(a.value);
            return (
              <TouchableOpacity
                key={a.value}
                style={[optStyles.card, active && optStyles.cardActive]}
                onPress={() => toggleMulti(a.value, setAvailability)}
              >
                <Text style={optStyles.icon}>{a.label.split(' ')[0]}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[optStyles.label, active && optStyles.labelActive]}>{a.label.split(' ').slice(1).join(' ')}</Text>
                  <Text style={optStyles.desc}>{a.desc}</Text>
                </View>
                {active && <Ionicons name="checkmark-circle" size={22} color={Colors.accent} />}
              </TouchableOpacity>
            );
          })}

          {/* Step 7: City + summary */}
          {step === 7 && (
            <>
              <View style={wStyles.cityInput}>
                <Ionicons name="location-outline" size={20} color={Colors.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={wStyles.cityField}
                  value={city}
                  onChangeText={setCity}
                  placeholder="e.g. Mumbai, London, New York…"
                  placeholderTextColor={Colors.textMuted}
                  autoCorrect={false}
                />
              </View>
              <Text style={wStyles.skipNote}>City is optional — we will still match you globally</Text>

              {/* Summary card */}
              <View style={wStyles.summaryBox}>
                <Text style={wStyles.sumTitle}>Your matching profile 🎯</Text>
                <Text style={wStyles.sumRow}>🌟 {interests.length} interests across {INTEREST_SECTIONS.filter(s => s.items.some(i => interests.includes(i))).length} categories</Text>
                <Text style={wStyles.sumRow}>✨ Vibes: {vibes.slice(0, 3).map(v => v.split(' ')[0]).join(' ')}</Text>
                <Text style={wStyles.sumRow}>🧠 {SOCIAL_TYPES.find(s => s.value === socialType)?.label}</Text>
                <Text style={wStyles.sumRow}>💬 {COMM_STYLES.find(c => c.value === commStyle)?.label}</Text>
                <Text style={wStyles.sumRow}>🎯 {friendGoals.length} friend goals</Text>
                <Text style={wStyles.sumRow}>⏰ {availability.length} time slots</Text>
              </View>
            </>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </Animated.View>

      {/* Footer */}
      <View style={wStyles.footer}>
        <TouchableOpacity
          style={[wStyles.nextBtn, !canContinue && wStyles.nextBtnDisabled]}
          onPress={step < TOTAL_STEPS - 1 ? () => animate(() => setStep(s => s + 1)) : save}
          disabled={!canContinue || saving}
        >
          {saving
            ? <ActivityIndicator color={Colors.white} />
            : <>
                <Text style={wStyles.nextText}>
                  {step < TOTAL_STEPS - 1 ? 'Continue' : 'Find My Matches 🎯'}
                </Text>
                {step < TOTAL_STEPS - 1 && <Ionicons name="arrow-forward" size={16} color={Colors.white} />}
              </>
          }
        </TouchableOpacity>
        {!canContinue && (
          <Text style={wStyles.hintText}>
            {[
              `Select at least ${Math.max(0, 5 - interests.length)} more interest${5 - interests.length !== 1 ? 's' : ''}`,
              `Pick at least ${Math.max(0, 2 - vibes.length)} more vibe${2 - vibes.length !== 1 ? 's' : ''}`,
              '', '', 'Choose your life stage to continue',
              `Pick ${Math.max(0, 2 - friendGoals.length)} more goal${2 - friendGoals.length !== 1 ? 's' : ''}`,
              'Pick at least one time slot', '',
            ][step]}
          </Text>
        )}
        {step > 0 && (
          <TouchableOpacity style={wStyles.backBtn} onPress={() => animate(() => setStep(s => s - 1))}>
            <Ionicons name="arrow-back" size={14} color={Colors.textMuted} />
            <Text style={wStyles.backText}>Back</Text>
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
  stepLabel: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center', marginTop: 6, marginBottom: 2 },
  scroll: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  title: { ...Typography.h2, color: Colors.textPrimary, marginBottom: 4, marginTop: Spacing.md },
  subtitle: { ...Typography.body, color: Colors.textMuted, marginBottom: Spacing.lg },
  limitHint: { ...Typography.caption, color: Colors.accentLight, marginBottom: Spacing.sm },
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
    padding: Spacing.md, gap: 8,
  },
  sumTitle: { ...Typography.label, color: Colors.accentLight, marginBottom: 4 },
  sumRow: { ...Typography.body, color: Colors.textSecondary },
  footer: { padding: Spacing.md, gap: 6, paddingBottom: Platform.OS === 'ios' ? 30 : Spacing.md },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.accent, borderRadius: Radii.lg, height: 52,
  },
  nextBtnDisabled: { opacity: 0.35 },
  nextText: { ...Typography.label, color: Colors.white, fontSize: 15 },
  hintText: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center' },
  backBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  backText: { ...Typography.caption, color: Colors.textMuted },
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
    <View style={mcStyles.card}>
      <View style={mcStyles.top}>
        <LinearGradient colors={[Colors.accent, Colors.accentLight]} style={mcStyles.avatar}>
          <Text style={mcStyles.initials}>{initials}</Text>
        </LinearGradient>
        <View style={mcStyles.info}>
          <Text style={mcStyles.name}>{name}</Text>
          {city && <Text style={mcStyles.city}><Ionicons name="location-outline" size={11} color={Colors.textMuted} /> {city}</Text>}
          {vibes.length > 0 && <Text style={mcStyles.vibe}>{vibes.join(' · ')}</Text>}
        </View>
        <View style={mcStyles.scoreWrap}>
          <Text style={[mcStyles.scoreNum, { color: scoreColor }]}>{score}%</Text>
          <Text style={mcStyles.scoreLabel}>match</Text>
        </View>
      </View>
      {interests.length > 0 && (
        <View style={mcStyles.tags}>
          {interests.map((t: string) => (
            <View key={t} style={mcStyles.tag}><Text style={mcStyles.tagText}>{t}</Text></View>
          ))}
        </View>
      )}
      <TouchableOpacity
        style={[mcStyles.btn, u.isConnected && mcStyles.btnDone]}
        onPress={() => onConnect(u.id ?? match.id)}
        disabled={u.isConnected}
      >
        <Ionicons name={u.isConnected ? 'checkmark-circle' : 'person-add-outline'} size={16}
          color={u.isConnected ? Colors.textMuted : Colors.white} />
        <Text style={[mcStyles.btnText, u.isConnected && mcStyles.btnTextDone]}>
          {u.isConnected ? 'Request Sent' : 'Connect'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const mcStyles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.borderLight, padding: Spacing.md, marginBottom: Spacing.md },
  top: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: 20, fontWeight: '700', color: Colors.white },
  info: { flex: 1 },
  name: { ...Typography.label, color: Colors.textPrimary, fontSize: 15 },
  city: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  vibe: { ...Typography.caption, color: Colors.accentLight, marginTop: 2 },
  scoreWrap: { alignItems: 'center' },
  scoreNum: { fontSize: 22, fontWeight: '800' },
  scoreLabel: { ...Typography.caption, color: Colors.textMuted },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: Spacing.sm },
  tag: { backgroundColor: Colors.accentGlow, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radii.full, borderWidth: 1, borderColor: Colors.accent + '33' },
  tagText: { fontSize: 11, color: Colors.accentLight },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.accent, borderRadius: Radii.full, paddingVertical: 9, marginTop: 4 },
  btnDone: { backgroundColor: Colors.bgTertiary },
  btnText: { fontSize: 13, fontWeight: '700', color: Colors.white },
  btnTextDone: { color: Colors.textMuted },
});

// ─── Empty / No Match State ───────────────────────────────────────
function NoMatchesState({ onRedo }: { onRedo: () => void }) {
  return (
    <View style={emStyles.container}>
      <Text style={emStyles.emoji}>🌌</Text>
      <Text style={emStyles.title}>No matches yet</Text>
      <Text style={emStyles.subtitle}>
        We will let you know the moment someone who matches your vibe joins BondBridge.
      </Text>
      <View style={emStyles.notifBox}>
        <Ionicons name="notifications" size={20} color={Colors.accentLight} />
        <Text style={emStyles.notifText}>You're on our matching radar 🔔</Text>
      </View>
      <Text style={emStyles.tip}>
        💡 Joining more communities boosts your chances — people in shared communities get weighted higher in matches.
      </Text>
      <TouchableOpacity style={emStyles.redoBtn} onPress={onRedo}>
        <Ionicons name="options-outline" size={16} color={Colors.accentLight} />
        <Text style={emStyles.redoBtnText}>Update my interests</Text>
      </TouchableOpacity>
    </View>
  );
}

const emStyles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, paddingTop: 40, gap: Spacing.md },
  emoji: { fontSize: 62 },
  title: { ...Typography.h2, color: Colors.textPrimary, textAlign: 'center' },
  subtitle: { ...Typography.body, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
  notifBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.accentGlow, paddingHorizontal: Spacing.md, paddingVertical: 10,
    borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.accent + '44',
  },
  notifText: { ...Typography.label, color: Colors.accentLight },
  tip: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  redoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    borderRadius: Radii.full,
  },
  redoBtnText: { ...Typography.label, color: Colors.accentLight, fontSize: 13 },
});

// ─── Main Screen ──────────────────────────────────────────────────
export default function FindFriendsScreen() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => setShowOnboarding(!val));
  }, []);

  const loadMatches = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await friendsApi.discover();
      setMatches(data.data ?? data.items ?? data ?? []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { if (showOnboarding === false) loadMatches(); }, [showOnboarding]);

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await friendsApi.search(search);
        setSearchResults(data.users ?? data ?? []);
      } catch {}
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const handleConnect = async (userId: string) => {
    const upd = (list: any[]) => list.map((m) => {
      const id = m.user?.id ?? m.id;
      return id === userId ? { ...m, user: { ...(m.user ?? m), isConnected: true } } : m;
    });
    setMatches(upd); setSearchResults((p) => p.map((u) => u.id === userId ? { ...u, isConnected: true } : u));
    try { await friendsApi.sendRequest(userId, 'Hey! Found you on BondBridge 👋'); } catch {}
  };

  const resetOnboarding = async () => {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    setShowOnboarding(true);
  };

  if (showOnboarding === null) {
    return <SafeAreaView style={mainStyles.container} edges={['top']}><View style={mainStyles.center}><ActivityIndicator color={Colors.accent} size="large" /></View></SafeAreaView>;
  }

  if (showOnboarding) {
    return (
      <SafeAreaView style={mainStyles.container} edges={['top']}>
        <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
      </SafeAreaView>
    );
  }

  const searchMode = search.trim().length > 0;
  const displayData = searchMode ? searchResults : matches;

  return (
    <SafeAreaView style={mainStyles.container} edges={['top']}>
      <View style={mainStyles.header}>
        <View>
          <Text style={mainStyles.title}>Find Friends</Text>
          {!searchMode && matches.length > 0 && <Text style={mainStyles.subtitle}>{matches.length} matched for you</Text>}
        </View>
        <TouchableOpacity style={mainStyles.iconBtn} onPress={resetOnboarding}>
          <Ionicons name="options-outline" size={20} color={Colors.accentLight} />
        </TouchableOpacity>
      </View>

      <View style={mainStyles.searchBar}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput style={mainStyles.searchInput} value={search} onChangeText={setSearch}
          placeholder="Search by name…" placeholderTextColor={Colors.textMuted} autoCorrect={false} />
        {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={18} color={Colors.textMuted} /></TouchableOpacity>}
      </View>

      {!searchMode && matches.length > 0 && <Text style={mainStyles.sectionLabel}>✨ Matched for you</Text>}

      {loading ? (
        <View style={mainStyles.center}><ActivityIndicator color={Colors.accent} size="large" /></View>
      ) : displayData.length === 0 && !searchMode ? (
        <NoMatchesState onRedo={resetOnboarding} />
      ) : (
        <FlatList
          data={displayData}
          keyExtractor={(item, i) => (item.user?.id ?? item.id ?? String(i))}
          contentContainerStyle={mainStyles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={!searchMode ? <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadMatches(); }} tintColor={Colors.accent} /> : undefined}
          renderItem={({ item }) => (
            <MatchCard match={searchMode ? { user: item, matchScore: 0 } : item} onConnect={handleConnect} />
          )}
          ListEmptyComponent={
            <View style={mainStyles.center}>
              <Ionicons name="search-outline" size={44} color={Colors.textMuted} />
              <Text style={mainStyles.emptyText}>No users found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const mainStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  title: { ...Typography.h2, color: Colors.textPrimary },
  subtitle: { ...Typography.caption, color: Colors.accentLight, marginTop: 2 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.accentGlow, borderWidth: 1, borderColor: Colors.accent + '44' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: Radii.lg, marginHorizontal: Spacing.md, marginTop: Spacing.md, marginBottom: Spacing.sm, paddingHorizontal: Spacing.md, height: 46 },
  searchInput: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
  sectionLabel: { ...Typography.label, color: Colors.textMuted, paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
  list: { paddingHorizontal: Spacing.md, paddingBottom: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingTop: 40 },
  emptyText: { ...Typography.h4, color: Colors.textSecondary },
});
