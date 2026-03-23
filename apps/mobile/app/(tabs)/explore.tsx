import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, RefreshControl, ScrollView, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { communitiesApi, friendsApi } from '../../services/api';
import { Colors, Spacing, Radii, Typography } from '../../constants/theme';
import { useRouter } from 'expo-router';

// ─── Constants ──────────────────────────────────────────────────
const MODES = ['Communities', 'People', 'Trending'] as const;
type Mode = typeof MODES[number];

const CATEGORIES = ['All', 'Fitness', 'Art', 'Tech', 'Music', 'Gaming', 'Food', 'Travel', 'Wellness'];

const ACTIVITY_LABELS: Record<string, { label: string; color: string }> = {
  hot:     { label: '🔥 Hot',     color: '#FF6B6B' },
  growing: { label: '📈 Growing', color: '#4ECDC4' },
  new:     { label: '🌱 New',     color: '#95E77E' },
  chill:   { label: '😌 Chill',   color: Colors.accentLight },
};

function activityLevel(memberCount: number, createdAt?: string) {
  if (memberCount > 500) return 'hot';
  if (memberCount > 100) return 'growing';
  if (createdAt && Date.now() - new Date(createdAt).getTime() < 7 * 86400_000) return 'new';
  return 'chill';
}

// ─── Community Card v2 ───────────────────────────────────────────
function CommunityCardV2({ community, onJoin }: { community: any; onJoin: (id: string) => void }) {
  const level = activityLevel(community.memberCount, community.createdAt);
  const act = ACTIVITY_LABELS[level];
  const typeIcon = community.type === 'ANONYMOUS' ? '🎭' : community.type === 'PRIVATE' ? '🔒' : '🔓';

  return (
    <View style={cardStyles.card}>
      {/* Banner */}
      <LinearGradient
        colors={community.bannerUrl ? ['transparent','transparent'] : [Colors.accent + '55', Colors.accentLight + '22']}
        style={cardStyles.banner}
      >
        <Text style={cardStyles.bannerEmoji}>{typeIcon}</Text>
      </LinearGradient>

      <View style={cardStyles.body}>
        <View style={cardStyles.row}>
          <Text style={cardStyles.name} numberOfLines={1}>{community.name}</Text>
          <View style={[cardStyles.actBadge, { borderColor: act.color + '55' }]}>
            <Text style={[cardStyles.actText, { color: act.color }]}>{act.label}</Text>
          </View>
        </View>

        <Text style={cardStyles.desc} numberOfLines={2}>{community.description ?? 'A great community to explore.'}</Text>

        {/* Tags */}
        {community.interests?.length > 0 && (
          <View style={cardStyles.tags}>
            {community.interests.slice(0, 3).map((t: string) => (
              <View key={t} style={cardStyles.tag}>
                <Text style={cardStyles.tagText}>{t}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={cardStyles.footer}>
          <Text style={cardStyles.members}>
            <Ionicons name="people-outline" size={12} color={Colors.textMuted} /> {community.memberCount?.toLocaleString() ?? 0}
          </Text>
          <TouchableOpacity
            style={[cardStyles.joinBtn, community.isJoined && cardStyles.joinBtnJoined]}
            onPress={() => onJoin(community.id)}
          >
            <Text style={[cardStyles.joinText, community.isJoined && cardStyles.joinTextJoined]}>
              {community.isJoined ? 'Joined' : 'Join'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface, borderRadius: Radii.lg,
    borderWidth: 1, borderColor: Colors.borderLight,
    marginBottom: Spacing.md, overflow: 'hidden',
  },
  banner: { height: 60, alignItems: 'flex-end', justifyContent: 'flex-end', padding: 8 },
  bannerEmoji: { fontSize: 20 },
  body: { padding: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  name: { ...Typography.label, color: Colors.textPrimary, flex: 1, marginRight: 8 },
  actBadge: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radii.full,
    borderWidth: 1, backgroundColor: Colors.bgTertiary,
  },
  actText: { fontSize: 10, fontWeight: '700' },
  desc: { ...Typography.caption, color: Colors.textMuted, marginBottom: 8 },
  tags: { flexDirection: 'row', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  tag: {
    backgroundColor: Colors.accentGlow, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radii.full, borderWidth: 1, borderColor: Colors.accent + '33',
  },
  tagText: { fontSize: 10, color: Colors.accentLight },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  members: { ...Typography.caption, color: Colors.textMuted },
  joinBtn: {
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: Radii.full,
    backgroundColor: Colors.accent,
  },
  joinBtnJoined: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.accent },
  joinText: { fontSize: 12, fontWeight: '700', color: Colors.white },
  joinTextJoined: { color: Colors.accentLight },
});

// ─── People Card ─────────────────────────────────────────────────
function PeopleCard({ user, onConnect }: { user: any; onConnect: (id: string) => void }) {
  const initials = (user.displayName ?? user.name ?? '?')[0]?.toUpperCase();
  return (
    <View style={pStyles.card}>
      <LinearGradient colors={[Colors.accent, Colors.accentLight]} style={pStyles.avatar}>
        <Text style={pStyles.initials}>{initials}</Text>
      </LinearGradient>
      <View style={pStyles.info}>
        <Text style={pStyles.name}>{user.displayName ?? user.name}</Text>
        {user.mutualCommunities > 0 && (
          <Text style={pStyles.mutual}>{user.mutualCommunities} mutual communities</Text>
        )}
        {user.interests?.length > 0 && (
          <Text style={pStyles.interests} numberOfLines={1}>
            {user.interests.slice(0, 3).join(' · ')}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={[pStyles.connectBtn, user.isConnected && pStyles.connectedBtn]}
        onPress={() => onConnect(user.id)}
      >
        <Text style={[pStyles.connectText, user.isConnected && pStyles.connectedText]}>
          {user.isConnected ? 'Friends' : 'Connect'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const pStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radii.lg,
    borderWidth: 1, borderColor: Colors.borderLight,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  initials: { fontSize: 18, fontWeight: '700', color: Colors.white },
  info: { flex: 1 },
  name: { ...Typography.label, color: Colors.textPrimary },
  mutual: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  interests: { ...Typography.caption, color: Colors.accentLight, marginTop: 2 },
  connectBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radii.full,
    backgroundColor: Colors.accent,
  },
  connectedBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.borderLight },
  connectText: { fontSize: 12, fontWeight: '700', color: Colors.white },
  connectedText: { color: Colors.textMuted },
});

// ─── Trending Section ────────────────────────────────────────────
function TrendingSection({ communities }: { communities: any[] }) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: Spacing.md, paddingBottom: 100 }}>
      <Text style={tStyles.sectionTitle}>🔥 Hot Right Now</Text>
      {communities.filter((_, i) => i < 5).map((c) => (
        <View key={c.id} style={tStyles.row}>
          <LinearGradient colors={[Colors.accent + '55', Colors.accentLight + '22']} style={tStyles.icon}>
            <Text style={{ fontSize: 18 }}>#{communities.indexOf(c) + 1}</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={tStyles.name}>{c.name}</Text>
            <Text style={tStyles.sub}>{c.memberCount?.toLocaleString()} members</Text>
          </View>
          <Text style={ACTIVITY_LABELS[activityLevel(c.memberCount, c.createdAt)]?.color
            ? { fontSize: 12, color: ACTIVITY_LABELS[activityLevel(c.memberCount, c.createdAt)].color }
            : {}}>
            {ACTIVITY_LABELS[activityLevel(c.memberCount, c.createdAt)]?.label}
          </Text>
        </View>
      ))}

      <Text style={[tStyles.sectionTitle, { marginTop: Spacing.xl }]}>🌱 New Communities</Text>
      {communities.filter((_, i) => i >= 5).map((c) => (
        <View key={c.id} style={tStyles.row}>
          <LinearGradient colors={['#95E77E44', '#4ECDC422']} style={tStyles.icon}>
            <Text style={{ fontSize: 16 }}>✦</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={tStyles.name}>{c.name}</Text>
            <Text style={tStyles.sub}>{c.memberCount?.toLocaleString()} members</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const tStyles = StyleSheet.create({
  sectionTitle: { ...Typography.h4, color: Colors.textPrimary, marginBottom: Spacing.md },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radii.lg,
    borderWidth: 1, borderColor: Colors.borderLight,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  icon: { width: 40, height: 40, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center' },
  name: { ...Typography.label, color: Colors.textPrimary },
  sub: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
});

// ─── Main Screen ─────────────────────────────────────────────────
export default function ExploreScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('Communities');
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [communities, setCommunities] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCommunities = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await communitiesApi.getAll(search || undefined);
      setCommunities(data.communities ?? data.data ?? data ?? []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [search]);

  const fetchPeople = useCallback(async () => {
    if (!search.trim()) { setPeople([]); return; }
    setLoading(true);
    try {
      const { data } = await friendsApi.search(search);
      setPeople(data.users ?? data ?? []);
    } catch {} finally { setLoading(false); }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (mode === 'Communities' || mode === 'Trending') fetchCommunities();
      if (mode === 'People') fetchPeople();
    }, 350);
    return () => clearTimeout(t);
  }, [search, mode]);

  useEffect(() => { fetchCommunities(); }, []);

  const handleJoin = async (id: string) => {
    setCommunities((prev) => prev.map((c) =>
      c.id === id ? { ...c, isJoined: !c.isJoined, memberCount: c.memberCount + (c.isJoined ? -1 : 1) } : c
    ));
    try {
      const c = communities.find((x) => x.id === id);
      if (c?.isJoined) await communitiesApi.leave(id);
      else await communitiesApi.join(id);
    } catch {}
  };

  const handleConnect = (id: string) => {
    setPeople((prev) => prev.map((u) => u.id === id ? { ...u, isConnected: !u.isConnected } : u));
  };

  const filtered = selectedCat === 'All'
    ? communities
    : communities.filter((c) => c.category?.toLowerCase() === selectedCat.toLowerCase());

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>Discover communities and people</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder={mode === 'People' ? 'Search people...' : 'Search communities...'}
          placeholderTextColor={Colors.textMuted}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Mode pills */}
      <View style={styles.modePills}>
        {MODES.map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.modePill, mode === m && styles.modePillActive]}
            onPress={() => { setMode(m); setSearch(''); }}
          >
            <Text style={[styles.modePillText, mode === m && styles.modePillTextActive]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category chips — only for Communities */}
      {mode === 'Communities' && (
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(i) => i}
          contentContainerStyle={styles.catList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.catChip, selectedCat === item && styles.catChipActive]}
              onPress={() => setSelectedCat(item)}
            >
              <Text style={[styles.catChipText, selectedCat === item && styles.catChipTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      ) : mode === 'Trending' ? (
        <TrendingSection communities={communities} />
      ) : mode === 'People' ? (
        <FlatList
          data={people}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchPeople} tintColor={Colors.accent} />}
          renderItem={({ item }) => <PeopleCard user={item} onConnect={handleConnect} />}
          ListHeaderComponent={
            search.length === 0 ? (
              <View style={styles.center}>
                <Ionicons name="people-outline" size={44} color={Colors.textMuted} />
                <Text style={styles.emptyText}>Search for people by name</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            search.length > 0 ? (
              <View style={styles.center}>
                <Ionicons name="person-outline" size={44} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No people found</Text>
              </View>
            ) : null
          }
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCommunities(); }} tintColor={Colors.accent} />
          }
          renderItem={({ item }) => <CommunityCardV2 community={item} onJoin={handleJoin} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="search-outline" size={44} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No communities found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.sm },
  title: { ...Typography.h2, color: Colors.textPrimary },
  subtitle: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  searchWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderLight,
    borderRadius: Radii.lg, marginHorizontal: Spacing.md, marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md, height: 46,
  },
  searchInput: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
  modePills: {
    flexDirection: 'row', paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm, gap: Spacing.sm,
  },
  modePill: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: Radii.full, borderWidth: 1,
    borderColor: Colors.borderLight, backgroundColor: Colors.surface,
  },
  modePillActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  modePillText: { ...Typography.label, color: Colors.textSecondary, fontSize: 12 },
  modePillTextActive: { color: Colors.white },
  catList: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm, gap: Spacing.sm },
  catChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 5,
    borderRadius: Radii.full, borderWidth: 1,
    borderColor: Colors.borderLight, backgroundColor: Colors.surface,
  },
  catChipActive: { backgroundColor: Colors.accent + 'CC', borderColor: Colors.accent },
  catChipText: { ...Typography.caption, color: Colors.textSecondary },
  catChipTextActive: { color: Colors.white },
  list: { paddingHorizontal: Spacing.md, paddingBottom: 100 },
  center: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: Spacing.sm },
  emptyText: { ...Typography.body, color: Colors.textSecondary },
});
