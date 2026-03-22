import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, Dimensions,
} from 'react-native';
import { Colors, Spacing, Radii, Typography } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface CommunityCardProps {
  community: {
    id: string;
    name: string;
    description: string;
    coverImageUrl?: string;
    memberCount: number;
    category: string;
    isJoined: boolean;
  };
  onJoin: (id: string) => void;
  onPress: (id: string) => void;
}

export function CommunityCard({ community, onJoin, onPress }: CommunityCardProps) {
  const categoryColors: Record<string, string> = {
    fitness: '#10B981', art: '#A855F7', tech: '#3B82F6',
    music: '#F59E0B', gaming: '#EF4444', food: '#F97316',
    travel: '#06B6D4', wellness: '#84CC16',
  };
  const catColor = categoryColors[community.category?.toLowerCase()] ?? Colors.accent;

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(community.id)} activeOpacity={0.85}>
      {/* Cover */}
      <View style={styles.cover}>
        {community.coverImageUrl ? (
          <Image source={{ uri: community.coverImageUrl }} style={styles.coverImg} />
        ) : (
          <View style={[styles.coverPlaceholder, { backgroundColor: catColor + '22' }]}>
            <Ionicons name="people" size={36} color={catColor} />
          </View>
        )}
        <View style={[styles.catBadge, { backgroundColor: catColor + '33', borderColor: catColor + '55' }]}>
          <Text style={[styles.catText, { color: catColor }]}>
            {community.category}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{community.name}</Text>
        <Text style={styles.desc} numberOfLines={2}>{community.description}</Text>
        <View style={styles.footer}>
          <View style={styles.members}>
            <Ionicons name="people-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.membersText}>
              {community.memberCount >= 1000
                ? `${(community.memberCount / 1000).toFixed(1)}k`
                : community.memberCount} members
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.joinBtn, community.isJoined && styles.joinedBtn]}
            onPress={() => onJoin(community.id)}
          >
            <Text style={[styles.joinText, community.isJoined && styles.joinedText]}>
              {community.isJoined ? 'Joined' : 'Join'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
    width: (width - Spacing.md * 2 - Spacing.sm) / 2,
  },
  cover: { width: '100%', height: 100, position: 'relative' },
  coverImg: { width: '100%', height: '100%' },
  coverPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  catBadge: {
    position: 'absolute', bottom: 6, left: 6,
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: Radii.full, borderWidth: 1,
  },
  catText: { ...Typography.caption, textTransform: 'capitalize' },
  body: { padding: Spacing.sm },
  name: { ...Typography.label, color: Colors.textPrimary, marginBottom: 4 },
  desc: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 16, marginBottom: Spacing.sm },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  members: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  membersText: { ...Typography.caption, color: Colors.textSecondary },
  joinBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: Radii.full,
  },
  joinedBtn: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  joinText: { ...Typography.caption, color: Colors.white, fontWeight: '600' },
  joinedText: { color: Colors.textSecondary },
});
