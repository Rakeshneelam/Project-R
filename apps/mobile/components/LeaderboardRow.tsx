import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Radii, Typography } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface LeaderboardRowProps {
  rank: number;
  user: { id: string; name: string; avatarUrl?: string; xpPoints: number; level: number };
  isCurrentUser?: boolean;
}

const medals: Record<number, { icon: 'trophy' | 'medal' | 'ribbon'; color: string }> = {
  1: { icon: 'trophy', color: '#F59E0B' },
  2: { icon: 'medal', color: '#94A3B8' },
  3: { icon: 'medal', color: '#CD7C40' },
};

export function LeaderboardRow({ rank, user, isCurrentUser }: LeaderboardRowProps) {
  const medal = medals[rank];
  return (
    <View style={[styles.row, isCurrentUser && styles.currentUser]}>
      {/* Rank */}
      <View style={styles.rankContainer}>
        {medal ? (
          <Ionicons name={medal.icon} size={22} color={medal.color} />
        ) : (
          <Text style={styles.rankText}>{rank}</Text>
        )}
      </View>

      {/* Avatar */}
      <View style={[styles.avatar, isCurrentUser && styles.avatarCurrent]}>
        <Text style={styles.avatarText}>{user.name?.[0]?.toUpperCase()}</Text>
      </View>

      {/* Name + Level */}
      <View style={styles.info}>
        <Text style={[styles.name, isCurrentUser && styles.nameCurrent]}>{user.name}</Text>
        <Text style={styles.level}>Level {user.level}</Text>
      </View>

      {/* XP */}
      <View style={styles.xpContainer}>
        <Text style={[styles.xp, rank === 1 && { color: Colors.gold }]}>
          {user.xpPoints >= 1000
            ? `${(user.xpPoints / 1000).toFixed(1)}k`
            : user.xpPoints}{' '}
          <Text style={styles.xpLabel}>XP</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.md,
    marginVertical: 2,
    backgroundColor: 'transparent',
  },
  currentUser: {
    backgroundColor: Colors.accentGlow,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rankContainer: { width: 36, alignItems: 'center' },
  rankText: { ...Typography.h4, color: Colors.textMuted, fontWeight: '700' },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.bgTertiary,
    alignItems: 'center', justifyContent: 'center',
    marginRight: Spacing.sm,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  avatarCurrent: { borderColor: Colors.accent, backgroundColor: Colors.accentDark },
  avatarText: { ...Typography.label, color: Colors.white },
  info: { flex: 1 },
  name: { ...Typography.label, color: Colors.textPrimary },
  nameCurrent: { color: Colors.accentLight },
  level: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  xpContainer: { alignItems: 'flex-end' },
  xp: { ...Typography.h4, color: Colors.textPrimary, fontWeight: '700' },
  xpLabel: { ...Typography.caption, color: Colors.textMuted, fontWeight: '400' },
});
