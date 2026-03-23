import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PostCard } from '../../components/PostCard';
import { postsApi } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';
import { Colors, Spacing, Radii, Typography } from '../../constants/theme';
import { useRouter } from 'expo-router';

export default function FeedScreen() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchFeed = useCallback(async (pg = 1, reset = false) => {
    try {
      const { data } = await postsApi.getFeed(pg);
      const newPosts = data.posts ?? data.data ?? [];
      setPosts((prev) => reset ? newPosts : [...prev, ...newPosts]);
      setHasMore(newPosts.length === 10);
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchFeed(1, true); }, []);

  const onRefresh = () => { setPage(1); setRefreshing(true); fetchFeed(1, true); };
  const loadMore = () => {
    if (!hasMore || loading) return;
    const next = page + 1;
    setPage(next);
    fetchFeed(next);
  };

  const handleLike = async (postId: string) => {
    setPosts((prev) => prev.map((p) =>
      p.id === postId
        ? { ...p, isLiked: !p.isLiked, likesCount: p.likesCount + (p.isLiked ? -1 : 1) }
        : p
    ));
    try {
      const post = posts.find((p) => p.id === postId);
      if (post?.isLiked) await postsApi.unlikePost(postId);
      else await postsApi.likePost(postId);
    } catch {}
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        {/* Left: App name */}
        <Text style={styles.appName}>BondBridge</Text>

        {/* Right: Explore · Notifications · Inbox */}
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/explore' as any)}
          >
            <Ionicons name="compass-outline" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push({ pathname: '/inbox', params: { tab: 'notifications' } } as any)}
          >
            <Ionicons name="notifications-outline" size={24} color={Colors.textSecondary} />
            {/* Unread dot — shown if there are notifications */}
            <View style={styles.unreadDot} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push({ pathname: '/inbox', params: { tab: 'messages' } } as any)}
          >
            <Ionicons name="chatbubble-outline" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Feed ── */}
      {loading && posts.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="newspaper-outline" size={52} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Nothing here yet</Text>
          <Text style={styles.emptySubtext}>
            Join some communities or connect with friends to see posts here
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onLike={handleLike}
              onComment={() => {}}
              onPress={() => {}}
            />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={hasMore ? <ActivityIndicator color={Colors.accent} style={{ margin: 16 }} /> : null}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  appName: { ...Typography.h3, color: Colors.accentLight, fontWeight: '800', letterSpacing: 0.5 },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute', top: 6, right: 6,
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: Colors.accent,
    borderWidth: 1.5, borderColor: Colors.bg,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  emptyText: { ...Typography.h4, color: Colors.textSecondary },
  emptySubtext: {
    ...Typography.bodySmall, color: Colors.textMuted,
    textAlign: 'center', paddingHorizontal: Spacing.xl,
  },
  list: { paddingVertical: Spacing.sm, paddingBottom: 80 },
});
