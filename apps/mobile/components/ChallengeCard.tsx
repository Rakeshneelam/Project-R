import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Radii, Typography } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface ChallengeCardProps {
  challenge: {
    id: string;
    title: string;
    description: string;
    type: 'daily' | 'weekly' | 'monthly';
    xpReward: number;
    deadline: string;
    participantCount: number;
    isCompleted: boolean;
    userProgress?: number;
  };
  onPress: (id: string) => void;
}

const typeConfig = {
  daily: { color: '#10B981', label: 'Daily', icon: 'sunny' as const },
  weekly: { color: '#7C3AED', label: 'Weekly', icon: 'star' as const },
  monthly: { color: '#F59E0B', label: 'Monthly', icon: 'trophy' as const },
};

export function ChallengeCard({ challenge, onPress }: ChallengeCardProps) {
  const config = typeConfig[challenge.type] ?? typeConfig.daily;
  const timeLeft = () => {
    const diff = new Date(challenge.deadline).getTime() - Date.now();
    const h = Math.floor(diff / 3600000);
    if (h < 24) return `${h}h left`;
    return `${Math.floor(h / 24)}d left`;
  };
  const progress = challenge.userProgress ?? 0;

  return (
    <TouchableOpacity
      style={[styles.card, challenge.isCompleted && styles.completed]}
      onPress={() => onPress(challenge.id)}
      activeOpacity={0.85}
    >
      {/* Top row */}
      <View style={styles.header}>
        <View style={[styles.typeBadge, { backgroundColor: config.color + '22' }]}>
          <Ionicons name={config.icon} size={12} color={config.color} />
          <Text style={[styles.typeText, { color: config.color }]}>{config.label}</Text>
        </View>
        <View style={styles.xpBadge}>
          <Text style={styles.xpText}>+{challenge.xpReward} XP</Text>
        </View>
      </View>

      <Text style={styles.title}>{challenge.title}</Text>
      <Text style={styles.desc} numberOfLines={2}>{challenge.description}</Text>

      {/* Progress bar */}
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%`, backgroundColor: config.color }]} />
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          <Ionicons name="people-outline" size={12} color={Colors.textMuted} /> {challenge.participantCount} joined
        </Text>
        <Text style={styles.footerText}>{timeLeft()}</Text>
      </View>

      {challenge.isCompleted && (
        <View style={styles.completedOverlay}>
          <Ionicons name="checkmark-circle" size={28} color={Colors.success} />
          <Text style={styles.completedText}>Completed!</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs + 2,
  },
  completed: { borderColor: Colors.successLight, opacity: 0.8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radii.full,
  },
  typeText: { ...Typography.caption, fontWeight: '600' },
  xpBadge: {
    backgroundColor: Colors.accentGlow,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radii.full, borderWidth: 1, borderColor: Colors.border,
  },
  xpText: { ...Typography.caption, color: Colors.accentLight, fontWeight: '700' },
  title: { ...Typography.h4, color: Colors.textPrimary, marginBottom: 4 },
  desc: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 18, marginBottom: Spacing.sm },
  progressBg: {
    height: 4, backgroundColor: Colors.bgTertiary,
    borderRadius: Radii.full, marginBottom: Spacing.sm, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: Radii.full },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { ...Typography.caption, color: Colors.textMuted },
  completedOverlay: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.xs },
  completedText: { ...Typography.label, color: Colors.success },
});
