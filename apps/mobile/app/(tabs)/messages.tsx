import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { messagesApi } from '../../services/api';
import { Colors, Typography, Spacing, Radii } from '../../constants/theme';

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function MessagesScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await messagesApi.getConversations(1);
      setConversations(res.data?.data ?? []);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const renderItem = ({ item }: { item: any }) => {
    const other = item.otherParticipants?.[0]?.user;
    const displayName = other?.profile?.displayName ?? 'Unknown';
    const avatar = other?.profile?.avatarUrl;
    const lastMsg = item.lastMessage;

    return (
      <TouchableOpacity
        style={styles.item}
        activeOpacity={0.75}
        onPress={() => router.push(`/chat/${item.id}` as any)}
      >
        <View style={styles.avatarWrap}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarLetter}>{displayName[0]?.toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.onlineDot} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
          <Text style={styles.preview} numberOfLines={1}>
            {lastMsg?.content ?? 'No messages yet'}
          </Text>
        </View>
        <View style={styles.meta}>
          {lastMsg && <Text style={styles.time}>{timeAgo(lastMsg.createdAt)}</Text>}
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity style={styles.composeBtn}>
          <Ionicons name="create-outline" size={22} color={Colors.accentLight} />
        </TouchableOpacity>
      </View>

      {conversations.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="chatbubbles-outline" size={56} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptyText}>Connect with friends to start chatting</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={Colors.accent}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: { ...Typography.h2, color: Colors.textPrimary },
  composeBtn: {
    width: 38, height: 38, borderRadius: Radii.full,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  avatarWrap: { position: 'relative' },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarFallback: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.accentDark,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { ...Typography.h3, color: Colors.white },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: Colors.success,
    borderWidth: 2, borderColor: Colors.bg,
  },
  info: { flex: 1, gap: 3 },
  name: { ...Typography.h4, color: Colors.textPrimary },
  preview: { ...Typography.bodySmall, color: Colors.textSecondary },
  meta: { alignItems: 'flex-end', gap: 4 },
  time: { ...Typography.caption, color: Colors.textMuted },
  separator: { height: 1, backgroundColor: Colors.borderLight, marginLeft: 84 },
  emptyTitle: { ...Typography.h3, color: Colors.textSecondary },
  emptyText: { ...Typography.body, color: Colors.textMuted, textAlign: 'center' },
});
