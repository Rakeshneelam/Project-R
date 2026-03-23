import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { friendsApi } from '../../services/api';
import { Colors, Spacing, Radii, Typography } from '../../constants/theme';

// ─── Person Card ─────────────────────────────────────────────────
function PersonCard({ user, onConnect }: { user: any; onConnect: (id: string) => void }) {
  const name = user.profile?.displayName ?? user.displayName ?? user.name ?? 'User';
  const initials = name[0]?.toUpperCase() ?? '?';

  return (
    <View style={cardStyles.card}>
      <LinearGradient colors={[Colors.accent, Colors.accentLight]} style={cardStyles.avatar}>
        <Text style={cardStyles.initials}>{initials}</Text>
      </LinearGradient>

      <View style={cardStyles.info}>
        <Text style={cardStyles.name}>{name}</Text>
        {user.mutualCommunities > 0 && (
          <Text style={cardStyles.mutual}>
            <Ionicons name="people-outline" size={11} color={Colors.textMuted} /> {user.mutualCommunities} mutual communities
          </Text>
        )}
        {user.interests?.length > 0 && (
          <Text style={cardStyles.interests} numberOfLines={1}>
            {user.interests.slice(0, 3).join(' · ')}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[cardStyles.btn, user.isConnected && cardStyles.btnConnected]}
        onPress={() => onConnect(user.id)}
      >
        <Ionicons
          name={user.isConnected ? 'checkmark' : 'person-add-outline'}
          size={15}
          color={user.isConnected ? Colors.textMuted : Colors.white}
        />
        <Text style={[cardStyles.btnText, user.isConnected && cardStyles.btnTextConnected]}>
          {user.isConnected ? 'Friends' : 'Connect'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radii.lg,
    borderWidth: 1, borderColor: Colors.borderLight,
    padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.md,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: 18, fontWeight: '700', color: Colors.white },
  info: { flex: 1 },
  name: { ...Typography.label, color: Colors.textPrimary },
  mutual: { ...Typography.caption, color: Colors.textMuted, marginTop: 3 },
  interests: { ...Typography.caption, color: Colors.accentLight, marginTop: 2 },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: Radii.full, backgroundColor: Colors.accent,
  },
  btnConnected: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.borderLight },
  btnText: { fontSize: 12, fontWeight: '700', color: Colors.white },
  btnTextConnected: { color: Colors.textMuted },
});

// ─── Main Screen ─────────────────────────────────────────────────
export default function FindFriendsScreen() {
  const [search, setSearch] = useState('');
  const [people, setPeople] = useState<any[]>([]);
  const [suggested, setSuggested] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const searchPeople = useCallback(async (query: string) => {
    if (!query.trim()) { setPeople([]); return; }
    setLoading(true);
    try {
      const { data } = await friendsApi.search(query);
      setPeople(data.users ?? data ?? []);
    } catch {} finally { setLoading(false); }
  }, []);

  const loadSuggested = useCallback(async () => {
    try {
      const { data } = await friendsApi.list();
      setSuggested(data.suggestions ?? data.friends ?? data ?? []);
    } catch {} finally { setRefreshing(false); }
  }, []);

  React.useEffect(() => { loadSuggested(); }, []);

  React.useEffect(() => {
    const t = setTimeout(() => searchPeople(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const handleConnect = (id: string) => {
    const updateList = (list: any[]) =>
      list.map((u) => u.id === id ? { ...u, isConnected: !u.isConnected } : u);
    setPeople(updateList);
    setSuggested(updateList);
    try { friendsApi.sendRequest(id); } catch {}
  };

  const displayList = search.trim() ? people : suggested;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Find Friends</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
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

      {/* Section label */}
      {!search.trim() && (
        <Text style={styles.sectionLabel}>People you might know</Text>
      )}

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.accent} size="large" /></View>
      ) : (
        <FlatList
          data={displayList}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadSuggested(); }}
              tintColor={Colors.accent}
            />
          }
          renderItem={({ item }) => <PersonCard user={item} onConnect={handleConnect} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="people-outline" size={52} color={Colors.textMuted} />
              <Text style={styles.emptyText}>
                {search.trim() ? 'No people found' : 'No suggestions yet'}
              </Text>
              <Text style={styles.emptySub}>
                {search.trim()
                  ? 'Try a different name'
                  : 'Join communities to discover people with shared interests'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  title: { ...Typography.h2, color: Colors.textPrimary },
  searchWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderLight,
    borderRadius: Radii.lg, marginHorizontal: Spacing.md, marginTop: Spacing.md, marginBottom: Spacing.sm,
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
