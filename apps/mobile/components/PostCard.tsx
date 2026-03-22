import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Colors, Spacing, Radii, Typography } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface PostCardProps {
  post: {
    id: string;
    content: string;
    mediaUrl?: string;
    author: { id: string; name: string; avatarUrl?: string };
    community: { id: string; name: string };
    likesCount: number;
    commentsCount: number;
    isLiked: boolean;
    createdAt: string;
  };
  onLike: (id: string) => void;
  onComment: (id: string) => void;
  onPress: (id: string) => void;
}

export function PostCard({ post, onLike, onComment, onPress }: PostCardProps) {
  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(post.id)} activeOpacity={0.85}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          {post.author.avatarUrl ? (
            <Image source={{ uri: post.author.avatarUrl }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarText}>{post.author.name?.[0]?.toUpperCase()}</Text>
          )}
        </View>
        <View style={styles.headerText}>
          <Text style={styles.authorName}>{post.author.name}</Text>
          <View style={styles.meta}>
            <Text style={styles.community}>{post.community.name}</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.time}>{timeAgo(post.createdAt)}</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <Text style={styles.content} numberOfLines={4}>{post.content}</Text>

      {/* Media */}
      {post.mediaUrl && (
        <Image source={{ uri: post.mediaUrl }} style={styles.media} resizeMode="cover" />
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.action} onPress={() => onLike(post.id)}>
          <Ionicons
            name={post.isLiked ? 'heart' : 'heart-outline'}
            size={20}
            color={post.isLiked ? Colors.danger : Colors.textSecondary}
          />
          <Text style={[styles.actionText, post.isLiked && { color: Colors.danger }]}>
            {post.likesCount}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} onPress={() => onComment(post.id)}>
          <Ionicons name="chatbubble-outline" size={19} color={Colors.textSecondary} />
          <Text style={styles.actionText}>{post.commentsCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action}>
          <Ionicons name="share-outline" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
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
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs + 2,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.accentDark,
    alignItems: 'center', justifyContent: 'center',
    marginRight: Spacing.sm, overflow: 'hidden',
  },
  avatarImg: { width: 40, height: 40 },
  avatarText: { ...Typography.h4, color: Colors.white },
  headerText: { flex: 1 },
  authorName: { ...Typography.label, color: Colors.textPrimary },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  community: { ...Typography.caption, color: Colors.accentLight },
  dot: { ...Typography.caption, color: Colors.textMuted, marginHorizontal: 4 },
  time: { ...Typography.caption, color: Colors.textMuted },
  content: { ...Typography.body, color: Colors.textPrimary, lineHeight: 22, marginBottom: Spacing.sm },
  media: { width: '100%', height: 200, borderRadius: Radii.md, marginBottom: Spacing.sm },
  actions: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xs, gap: Spacing.md },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { ...Typography.bodySmall, color: Colors.textSecondary },
});
