import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChallengeCard } from '../../components/ChallengeCard';
import { challengesApi } from '../../services/api';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const FILTER = ['All', 'Daily', 'Weekly', 'Monthly'];

export default function ChallengesScreen() {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchChallenges = async () => {
    try {
      const { data } = await challengesApi.getActive();
      setChallenges(data.challenges ?? data.data ?? data ?? []);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchChallenges(); }, []);

  const filtered = filter === 'All'
    ? challenges
    : challenges.filter((c) => c.type?.toLowerCase() === filter.toLowerCase());

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Challenges 🏆</Text>
          <Text style={styles.subtitle}>Complete challenges, earn XP, climb the leaderboard</Text>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTER.map((f) => (
          <React.Fragment key={f}>
            <View
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
            >
              <Text
                style={[styles.filterText, filter === f && styles.filterTextActive]}
                onPress={() => setFilter(f)}
              >
                {f}
              </Text>
            </View>
          </React.Fragment>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.accent} size="large" /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchChallenges(); }} tintColor={Colors.accent} />
          }
          renderItem={({ item }) => (
            <ChallengeCard challenge={item} onPress={() => {}} />
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="trophy-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No {filter !== 'All' ? filter.toLowerCase() : ''} challenges right now</Text>
              <Text style={styles.emptySubtext}>Check back soon for new challenges!</Text>
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
    paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  title: { ...Typography.h2, color: Colors.textPrimary },
  subtitle: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm, gap: Spacing.sm,
  },
  filterTab: {
    flex: 1, paddingVertical: 8, alignItems: 'center',
    borderRadius: 8, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderLight,
  },
  filterTabActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  filterText: { ...Typography.label, color: Colors.textSecondary },
  filterTextActive: { color: Colors.white },
  list: { paddingTop: Spacing.sm, paddingBottom: 80 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingTop: 80 },
  emptyText: { ...Typography.body, color: Colors.textSecondary },
  emptySubtext: { ...Typography.bodySmall, color: Colors.textMuted, textAlign: 'center' },
});
