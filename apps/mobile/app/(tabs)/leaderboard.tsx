import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LeaderboardRow } from '../../components/LeaderboardRow';
import { leaderboardApi } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';
import { Colors, Spacing, Radii, Typography } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function LeaderboardScreen() {
  const user = useAuthStore((s) => s.user);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRank, setUserRank] = useState<number | null>(null);

  const fetchLeaderboard = async () => {
    try {
      const { data } = await leaderboardApi.getGlobal();
      const list = data.entries ?? data.data ?? data ?? [];
      setEntries(list);
      const rank = list.findIndex((e: any) => e.user?.id === user?.id);
      if (rank !== -1) setUserRank(rank + 1);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchLeaderboard(); }, []);

  const topThree = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard 👑</Text>
        {userRank && (
          <View style={styles.myRankPill}>
            <Text style={styles.myRankText}>Your rank: #{userRank}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.accent} size="large" /></View>
      ) : (
        <FlatList
          data={rest}
          keyExtractor={(_, i) => String(i + 3)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchLeaderboard(); }} tintColor={Colors.accent} />
          }
          ListHeaderComponent={
            <>
              {/* Podium — Top 3 */}
              {topThree.length > 0 && (
                <View style={styles.podium}>
                  {/* 2nd */}
                  {topThree[1] && (
                    <View style={[styles.podiumItem, styles.podiumSecond]}>
                      <View style={[styles.podiumAvatar, { borderColor: Colors.silver }]}>
                        <Text style={styles.podiumAvatarText}>{topThree[1].user?.name?.[0]}</Text>
                      </View>
                      <Text style={styles.podiumName} numberOfLines={1}>{topThree[1].user?.name}</Text>
                      <View style={[styles.podiumBar, { height: 60, backgroundColor: Colors.silver + '44' }]}>
                        <Text style={[styles.podiumRankText, { color: Colors.silver }]}>2</Text>
                      </View>
                    </View>
                  )}
                  {/* 1st */}
                  {topThree[0] && (
                    <View style={[styles.podiumItem, styles.podiumFirst]}>
                      <Ionicons name="trophy" size={24} color={Colors.gold} style={styles.crown} />
                      <View style={[styles.podiumAvatar, { borderColor: Colors.gold, width: 64, height: 64, borderRadius: 32 }]}>
                        <Text style={[styles.podiumAvatarText, { fontSize: 22 }]}>{topThree[0].user?.name?.[0]}</Text>
                      </View>
                      <Text style={styles.podiumName} numberOfLines={1}>{topThree[0].user?.name}</Text>
                      <View style={[styles.podiumBar, { height: 80, backgroundColor: Colors.gold + '44' }]}>
                        <Text style={[styles.podiumRankText, { color: Colors.gold }]}>1</Text>
                      </View>
                    </View>
                  )}
                  {/* 3rd */}
                  {topThree[2] && (
                    <View style={[styles.podiumItem, styles.podiumThird]}>
                      <View style={[styles.podiumAvatar, { borderColor: Colors.bronze }]}>
                        <Text style={styles.podiumAvatarText}>{topThree[2].user?.name?.[0]}</Text>
                      </View>
                      <Text style={styles.podiumName} numberOfLines={1}>{topThree[2].user?.name}</Text>
                      <View style={[styles.podiumBar, { height: 45, backgroundColor: Colors.bronze + '44' }]}>
                        <Text style={[styles.podiumRankText, { color: Colors.bronze }]}>3</Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
              <Text style={styles.sectionLabel}>All Rankings</Text>
            </>
          }
          renderItem={({ item, index }) => (
            <LeaderboardRow
              rank={index + 4}
              user={item.user ?? item}
              isCurrentUser={item.user?.id === user?.id}
            />
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="trophy-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No rankings yet</Text>
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  title: { ...Typography.h2, color: Colors.textPrimary },
  myRankPill: {
    backgroundColor: Colors.accentGlow, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radii.full, borderWidth: 1, borderColor: Colors.border,
  },
  myRankText: { ...Typography.caption, color: Colors.accentLight, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingTop: 80 },
  list: { paddingBottom: 80 },
  podium: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center',
    paddingHorizontal: Spacing.md, paddingTop: Spacing.lg, paddingBottom: Spacing.md, gap: Spacing.sm,
  },
  podiumItem: { alignItems: 'center', flex: 1 },
  podiumFirst: { marginBottom: 0 },
  podiumSecond: { marginBottom: -10 },
  podiumThird: { marginBottom: -20 },
  crown: { marginBottom: 4 },
  podiumAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.bgTertiary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, marginBottom: 6,
  },
  podiumAvatarText: { ...Typography.h3, color: Colors.white },
  podiumName: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', marginBottom: 6 },
  podiumBar: { width: '100%', borderTopLeftRadius: 8, borderTopRightRadius: 8, alignItems: 'center', justifyContent: 'center' },
  podiumRankText: { ...Typography.h3, fontWeight: '800' },
  sectionLabel: { ...Typography.label, color: Colors.textMuted, paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
  emptyText: { ...Typography.body, color: Colors.textSecondary },
});
