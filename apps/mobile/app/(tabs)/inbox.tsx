import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { messagesApi, notificationsApi } from '../../services/api';
import { Colors, Spacing, Radii, Typography } from '../../constants/theme';

type InboxMode = 'Messages' | 'Notifications';

function timeAgo(iso?: string) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// ─── Conversation Row ────────────────────────────────────────────
function ConvRow({ conv, onPress }: { conv: any; onPress: () => void }) {
  const other = conv.participants?.find((p: any) => !p.isMe) ?? conv.participants?.[0];
  const name = other?.user?.profile?.displayName ?? other?.user?.name ?? 'Unknown';
  const initials = name[0]?.toUpperCase() ?? '?';
  const unread = (conv.unreadCount ?? 0) > 0;

  return (
    <TouchableOpacity style={rowStyles.row} onPress={onPress} activeOpacity={0.7}>
      <LinearGradient colors={[Colors.accent, Colors.accentLight]} style={rowStyles.avatar}>
        <Text style={rowStyles.initials}>{initials}</Text>
      </LinearGradient>
      <View style={rowStyles.info}>
        <View style={rowStyles.top}>
          <Text style={[rowStyles.name, unread && rowStyles.bold]}>{name}</Text>
          <Text style={rowStyles.time}>{timeAgo(conv.lastMessageAt)}</Text>
        </View>
        <Text style={[rowStyles.preview, unread && rowStyles.previewBold]} numberOfLines={1}>
          {conv.lastMessage?.content ?? 'Start a conversation'}
        </Text>
      </View>
      {unread && <View style={rowStyles.unreadDot} />}
    </TouchableOpacity>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    gap: Spacing.md,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: 18, fontWeight: '700', color: Colors.white },
  info: { flex: 1 },
  top: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  name: { ...Typography.label, color: Colors.textPrimary },
  bold: { fontWeight: '700' },
  time: { ...Typography.caption, color: Colors.textMuted },
  preview: { ...Typography.caption, color: Colors.textMuted },
  previewBold: { color: Colors.textSecondary, fontWeight: '600' },
  unreadDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.accent },
});

// ─── Notification Row ────────────────────────────────────────────
function NotifRow({ notif }: { notif: any }) {
  const icons: Record<string, string> = {
    NEW_MESSAGE: 'chatbubble',
    FRIEND_REQUEST: 'person-add',
    FRIEND_ACCEPTED: 'people',
    DATING_NEW_MATCH: 'heart',
    BADGE_EARNED: 'trophy',
    CHALLENGE_RESULT: 'ribbon',
    SYSTEM: 'information-circle',
  };
  const icon = (icons[notif.type] ?? 'notifications') as any;

  return (
    <View style={[nStyles.row, !notif.isRead && nStyles.unread]}>
      <View style={nStyles.iconWrap}>
        <Ionicons name={icon} size={20} color={notif.isRead ? Colors.textMuted : Colors.accentLight} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={nStyles.title}>{notif.title}</Text>
        <Text style={nStyles.body} numberOfLines={2}>{notif.body}</Text>
        <Text style={nStyles.time}>{timeAgo(notif.createdAt)}</Text>
      </View>
      {!notif.isRead && <View style={nStyles.dot} />}
    </View>
  );
}

const nStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    gap: Spacing.md,
  },
  unread: { backgroundColor: Colors.accentGlow },
  iconWrap: {
    width: 40, height: 40, borderRadius: Radii.md,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  title: { ...Typography.label, color: Colors.textPrimary },
  body: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  time: { ...Typography.caption, color: Colors.textMuted, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accent, marginTop: 4 },
});

// ─── Main Screen ─────────────────────────────────────────────────
export default function InboxScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<InboxMode>('Messages');
  const [conversations, setConversations] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await messagesApi.getConversations();
      setConversations(data.conversations ?? data.data ?? data ?? []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await notificationsApi.getAll();
      setNotifications(data.data ?? data ?? []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    if (mode === 'Messages') fetchConversations();
    else fetchNotifications();
  }, [mode]);

  const onRefresh = () => {
    setRefreshing(true);
    if (mode === 'Messages') fetchConversations();
    else fetchNotifications();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Inbox</Text>
        {mode === 'Messages' && (
          <TouchableOpacity>
            <Ionicons name="create-outline" size={22} color={Colors.accentLight} />
          </TouchableOpacity>
        )}
        {mode === 'Notifications' && notifications.some((n) => !n.isRead) && (
          <TouchableOpacity onPress={() => notificationsApi.markAllRead()}>
            <Text style={styles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Mode pills */}
      <View style={styles.modePills}>
        {(['Messages', 'Notifications'] as InboxMode[]).map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.pill, mode === m && styles.pillActive]}
            onPress={() => { setMode(m); setLoading(true); }}
          >
            <Text style={[styles.pillText, mode === m && styles.pillTextActive]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.accent} size="large" /></View>
      ) : mode === 'Messages' ? (
        <FlatList
          data={conversations}
          keyExtractor={(i) => i.id}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
          renderItem={({ item }) => (
            <ConvRow conv={item} onPress={() => router.push(`/chat/${item.id}` as any)} />
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="chatbubbles-outline" size={52} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No conversations yet</Text>
              <Text style={styles.emptySub}>Connect with friends to start chatting</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(i) => i.id}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
          renderItem={({ item }) => <NotifRow notif={item} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="notifications-outline" size={52} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Nothing new</Text>
              <Text style={styles.emptySub}>You're all caught up</Text>
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
  markAll: { ...Typography.caption, color: Colors.accentLight },
  modePills: {
    flexDirection: 'row', paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm, gap: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  pill: {
    paddingHorizontal: 18, paddingVertical: 7, borderRadius: Radii.full,
    borderWidth: 1, borderColor: Colors.borderLight, backgroundColor: Colors.surface,
  },
  pillActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  pillText: { ...Typography.label, color: Colors.textSecondary, fontSize: 13 },
  pillTextActive: { color: Colors.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingTop: 60 },
  emptyText: { ...Typography.h4, color: Colors.textSecondary },
  emptySub: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center' },
});
