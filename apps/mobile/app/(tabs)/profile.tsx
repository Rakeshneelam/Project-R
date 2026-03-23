import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, ActivityIndicator, Platform, Switch,
  Modal, FlatList, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/auth.store';
import { profileApi, friendsApi, communitiesApi } from '../../services/api';
import { Colors, Spacing, Radii, Typography } from '../../constants/theme';

// ─── Bottom Sheet ─────────────────────────────────────────────────
function ListModal({
  visible, title, data, onClose, renderItem,
}: {
  visible: boolean;
  title: string;
  data: any[];
  onClose: () => void;
  renderItem: (item: any) => React.ReactNode;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={modalStyles.backdrop} onPress={onClose} />
      <View style={modalStyles.sheet}>
        <View style={modalStyles.handle} />
        <View style={modalStyles.header}>
          <Text style={modalStyles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={data}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => renderItem(item) as any}
          ListEmptyComponent={
            <Text style={modalStyles.empty}>Nothing here yet</Text>
          }
        />
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: Colors.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '70%', borderTopWidth: 1, borderColor: Colors.borderLight,
  },
  handle: {
    width: 40, height: 4, backgroundColor: Colors.borderLight,
    borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  title: { ...Typography.h4, color: Colors.textPrimary },
  empty: { ...Typography.body, color: Colors.textMuted, textAlign: 'center', paddingTop: 40 },
});

// ─── Stat Cell ────────────────────────────────────────────────────
function StatCell({ count, label, onPress }: { count: number; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={statStyles.cell} onPress={onPress} activeOpacity={0.7}>
      <Text style={statStyles.count}>{count}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const statStyles = StyleSheet.create({
  cell: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md },
  count: { ...Typography.h3, color: Colors.textPrimary },
  label: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
});

// ─── Privacy Row ──────────────────────────────────────────────────
type Visibility = 'public' | 'friends' | 'hidden';
const VIS_OPTIONS: Visibility[] = ['public', 'friends', 'hidden'];

function PrivacyRow({ label, value, onChange }: { label: string; value: Visibility; onChange: (v: Visibility) => void }) {
  const idx = VIS_OPTIONS.indexOf(value);
  const next = () => onChange(VIS_OPTIONS[(idx + 1) % VIS_OPTIONS.length]);
  const colors: Record<Visibility, string> = {
    public: Colors.success ?? '#4ECDC4',
    friends: Colors.accentLight,
    hidden: Colors.textMuted,
  };
  const icons: Record<Visibility, string> = { public: 'earth', friends: 'people', hidden: 'eye-off' };
  return (
    <TouchableOpacity style={privStyles.row} onPress={next} activeOpacity={0.7}>
      <Text style={privStyles.label}>{label}</Text>
      <View style={[privStyles.badge, { borderColor: colors[value] + '55' }]}>
        <Ionicons name={icons[value] as any} size={12} color={colors[value]} />
        <Text style={[privStyles.badgeText, { color: colors[value] }]}>{value}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

const privStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  label: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radii.full,
    borderWidth: 1, backgroundColor: Colors.bgTertiary, marginRight: 8,
  },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
});

// ─── Main Profile ─────────────────────────────────────────────────
export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  // Lists
  const [friends, setFriends] = useState<any[]>([]);
  const [myCommunities, setMyCommunities] = useState<any[]>([]);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [commOpen, setCommOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  // Privacy state
  const [commVisibility, setCommVisibility] = useState<Visibility>('public');
  const [postsVisibility, setPostsVisibility] = useState<Visibility>('public');
  const [allowSuggestions, setAllowSuggestions] = useState(true);

  const loadFriends = useCallback(async () => {
    try {
      const { data } = await friendsApi.list();
      setFriends(data.friends ?? data.data ?? data ?? []);
    } catch {}
  }, []);

  const loadCommunities = useCallback(async () => {
    try {
      const { data } = await communitiesApi.getMine();
      setMyCommunities(data.communities ?? data.data ?? data ?? []);
    } catch {}
  }, []);

  useEffect(() => { loadFriends(); loadCommunities(); }, []);

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Sign out of BondBridge?')) logout();
    } else {
      Alert.alert('Sign Out', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]);
    }
  };

  const levelProgress = ((user?.xpPoints ?? 0) % 500) / 500;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.topName}>{user?.name ?? 'Profile'}</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={Colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Avatar + bio */}
        <View style={styles.avatarSection}>
          <LinearGradient colors={[Colors.accent, Colors.accentLight]} style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() ?? '?'}</Text>
          </LinearGradient>
          <Text style={styles.displayName}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.levelBadge}>
            <Ionicons name="flash" size={13} color={Colors.gold} />
            <Text style={styles.levelText}>Level {user?.level ?? 1} · {user?.xpPoints ?? 0} XP</Text>
          </View>
        </View>

        {/* ── Instagram-style stat row ── */}
        <View style={styles.statsRow}>
          <StatCell count={0} label="Posts" onPress={() => {}} />
          <View style={styles.statDivider} />
          <StatCell
            count={friends.length}
            label="Friends"
            onPress={() => setFriendsOpen(true)}
          />
          <View style={styles.statDivider} />
          <StatCell
            count={myCommunities.length}
            label="Communities"
            onPress={() => setCommOpen(true)}
          />
        </View>

        {/* XP bar */}
        <View style={styles.xpSection}>
          <View style={styles.xpHeader}>
            <Text style={styles.xpLabel}>{user?.xpPoints ?? 0} XP</Text>
            <Text style={styles.xpNext}>{500 - ((user?.xpPoints ?? 0) % 500)} XP to next level</Text>
          </View>
          <View style={styles.xpBar}>
            <LinearGradient
              colors={[Colors.accent, Colors.accentLight]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.xpFill, { width: `${Math.max(levelProgress * 100, 4)}%` as any }]}
            />
          </View>
        </View>

        {/* ── Privacy Controls ── */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => setPrivacyOpen(!privacyOpen)} activeOpacity={0.7}>
            <Text style={styles.sectionTitle}>🔒 Privacy</Text>
            <Ionicons name={privacyOpen ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          {privacyOpen && (
            <View style={styles.privacyPanel}>
              <PrivacyRow label="Communities I've joined" value={commVisibility} onChange={setCommVisibility} />
              <PrivacyRow label="Posts on my profile" value={postsVisibility} onChange={setPostsVisibility} />
              <View style={privStyles.row}>
                <Text style={privStyles.label}>Allow friend suggestions</Text>
                <Switch
                  value={allowSuggestions}
                  onValueChange={setAllowSuggestions}
                  trackColor={{ true: Colors.accent, false: Colors.bgTertiary }}
                  thumbColor={Colors.white}
                />
              </View>
              <View style={[privStyles.row, { borderBottomWidth: 0, opacity: 0.6 }]}>
                <Ionicons name="shield-checkmark" size={14} color={Colors.accentLight} style={{ marginRight: 8 }} />
                <Text style={{ ...Typography.caption, color: Colors.accentLight, flex: 1 }}>
                  Dating activity is always private
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Account settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          {[
            { icon: 'person-outline',        label: 'Edit Profile' },
            { icon: 'notifications-outline', label: 'Notification Preferences' },
            { icon: 'shield-outline',         label: 'Safety & Blocking' },
            { icon: 'help-circle-outline',   label: 'Help & Support' },
          ].map((item) => (
            <TouchableOpacity key={item.label} style={styles.menuItem}>
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon as any} size={18} color={Colors.accentLight} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* ── Friends Bottom Sheet ── */}
      <ListModal
        visible={friendsOpen}
        title={`Friends (${friends.length})`}
        data={friends}
        onClose={() => setFriendsOpen(false)}
        renderItem={(f) => {
          const name = f.friend?.profile?.displayName ?? f.friend?.name ?? f.displayName ?? 'User';
          const initials = name[0]?.toUpperCase() ?? '?';
          return (
            <View style={listItemStyles.row} key={f.id}>
              <LinearGradient colors={[Colors.accent, Colors.accentLight]} style={listItemStyles.avatar}>
                <Text style={listItemStyles.initials}>{initials}</Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={listItemStyles.name}>{name}</Text>
                {f.mutualCommunities > 0 && (
                  <Text style={listItemStyles.sub}>{f.mutualCommunities} mutual communities</Text>
                )}
              </View>
            </View>
          );
        }}
      />

      {/* ── Communities Bottom Sheet ── */}
      <ListModal
        visible={commOpen}
        title={`Communities (${myCommunities.length})`}
        data={myCommunities}
        onClose={() => setCommOpen(false)}
        renderItem={(c) => (
          <View style={listItemStyles.row} key={c.id}>
            <View style={listItemStyles.commIcon}>
              <Text style={{ fontSize: 20 }}>
                {c.type === 'ANONYMOUS' ? '🎭' : c.type === 'PRIVATE' ? '🔒' : '🔓'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={listItemStyles.name}>{c.name}</Text>
              <Text style={listItemStyles.sub}>{c.memberCount?.toLocaleString()} members</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const listItemStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight, gap: Spacing.md,
  },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  commIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.borderLight },
  initials: { fontSize: 16, fontWeight: '700', color: Colors.white },
  name: { ...Typography.label, color: Colors.textPrimary },
  sub: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  topName: { ...Typography.h3, color: Colors.textPrimary },
  content: { paddingBottom: 100 },
  avatarSection: { alignItems: 'center', paddingVertical: Spacing.xl },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md, borderWidth: 3, borderColor: Colors.accent,
  },
  avatarText: { fontSize: 36, color: Colors.white, fontWeight: '700' },
  displayName: { ...Typography.h3, color: Colors.textPrimary, marginBottom: 4 },
  email: { ...Typography.caption, color: Colors.textMuted, marginBottom: Spacing.sm },
  levelBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.warningLight,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radii.full,
  },
  levelText: { ...Typography.label, color: Colors.gold, fontSize: 12 },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md, marginBottom: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radii.lg,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  statDivider: { width: 1, backgroundColor: Colors.borderLight },
  xpSection: { marginHorizontal: Spacing.md, marginBottom: Spacing.lg },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  xpLabel: { ...Typography.label, color: Colors.textPrimary },
  xpNext: { ...Typography.caption, color: Colors.textMuted },
  xpBar: { height: 6, backgroundColor: Colors.bgTertiary, borderRadius: Radii.full, overflow: 'hidden' },
  xpFill: { height: '100%', borderRadius: Radii.full, minWidth: 8 },
  section: { marginHorizontal: Spacing.md, marginBottom: Spacing.lg },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: Spacing.sm,
  },
  sectionTitle: { ...Typography.label, color: Colors.textMuted, marginBottom: Spacing.sm },
  privacyPanel: {
    backgroundColor: Colors.surface, borderRadius: Radii.lg,
    borderWidth: 1, borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.md, overflow: 'hidden', marginTop: 4,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  menuIcon: {
    width: 36, height: 36, borderRadius: Radii.sm,
    backgroundColor: Colors.accentGlow,
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
  },
  menuLabel: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
});
