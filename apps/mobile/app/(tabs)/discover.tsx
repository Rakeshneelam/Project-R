import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CommunityCard } from '../../components/CommunityCard';
import { communitiesApi } from '../../services/api';
import { Colors, Spacing, Radii, Typography } from '../../constants/theme';
import { useRouter } from 'expo-router';

const CATEGORIES = ['All', 'Fitness', 'Art', 'Tech', 'Music', 'Gaming', 'Food', 'Travel', 'Wellness'];

export default function DiscoverScreen() {
  const router = useRouter();
  const [communities, setCommunities] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCommunities = useCallback(async () => {
    try {
      const { data } = await communitiesApi.getAll(search || undefined);
      setCommunities(data.communities ?? data.data ?? data ?? []);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => fetchCommunities(), 400);
    return () => clearTimeout(t);
  }, [search]);

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

  const filtered = selectedCat === 'All'
    ? communities
    : communities.filter((c) => c.category?.toLowerCase() === selectedCat.toLowerCase());

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <Text style={styles.subtitle}>Find communities that match your vibe</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search communities..."
          placeholderTextColor={Colors.textMuted}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category filter */}
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

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.accent} size="large" /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCommunities(); }} tintColor={Colors.accent} />
          }
          renderItem={({ item }) => (
            <CommunityCard community={item} onJoin={handleJoin} onPress={() => {}} />
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="search-outline" size={48} color={Colors.textMuted} />
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
  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.md },
  title: { ...Typography.h2, color: Colors.textPrimary },
  subtitle: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },
  searchWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderLight,
    borderRadius: Radii.lg, marginHorizontal: Spacing.md, marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md, height: 48,
  },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
  catList: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm, gap: Spacing.sm },
  catChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radii.full, borderWidth: 1,
    borderColor: Colors.borderLight, backgroundColor: Colors.surface,
  },
  catChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  catChipText: { ...Typography.label, color: Colors.textSecondary },
  catChipTextActive: { color: Colors.white },
  grid: { paddingHorizontal: Spacing.md, paddingBottom: 80 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: Spacing.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingTop: 80 },
  emptyText: { ...Typography.body, color: Colors.textSecondary },
});
