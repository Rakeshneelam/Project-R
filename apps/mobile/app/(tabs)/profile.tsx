import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/auth.store';
import { profileApi } from '../../services/api';
import { Colors, Spacing, Radii, Typography } from '../../constants/theme';

const StatBox = ({ label, value }: { label: string; value: string | number }) => (
  <View style={statStyles.box}>
    <Text style={statStyles.value}>{value}</Text>
    <Text style={statStyles.label}>{label}</Text>
  </View>
);
const statStyles = StyleSheet.create({
  box: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md },
  value: { ...Typography.h3, color: Colors.textPrimary },
  label: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
});

const BadgeChip = ({ label, icon }: { label: string; icon: string }) => (
  <View style={badgeStyles.chip}>
    <Ionicons name={icon as any} size={16} color={Colors.gold} />
    <Text style={badgeStyles.label}>{label}</Text>
  </View>
);
const badgeStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.warningLight,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: Radii.full, borderWidth: 1, borderColor: Colors.warning + '44',
    margin: 4,
  },
  label: { ...Typography.caption, color: Colors.gold, fontWeight: '600' },
});

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const [uploading, setUploading] = useState(false);

  const handleAvatarChange = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    setUploading(true);
    try {
      const uri = result.assets[0].uri;
      const filename = `avatar-${user?.id}.jpg`;
      const { data: urlData } = await profileApi.getUploadUrl(filename, 'image/jpeg');
      await fetch(urlData.uploadUrl, {
        method: 'PUT',
        body: await fetch(uri).then((r) => r.blob()),
        headers: { 'Content-Type': 'image/jpeg' },
      });
      await profileApi.update({ avatarUrl: urlData.url });
    } catch {
      Alert.alert('Failed to update avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const levelProgress = ((user?.xpPoints ?? 0) % 500) / 500;
  const MOCK_BADGES = [
    { label: 'Early Bird', icon: 'sunny' },
    { label: 'Connector', icon: 'people' },
    { label: 'Challenger', icon: 'trophy' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={Colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Avatar + name */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={handleAvatarChange}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <LinearGradient colors={[Colors.accent, Colors.accentLight]} style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
              </LinearGradient>
            )}
            <View style={styles.cameraBtn}>
              {uploading
                ? <ActivityIndicator size="small" color={Colors.white} />
                : <Ionicons name="camera" size={14} color={Colors.white} />
              }
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>

          {/* Level badge */}
          <View style={styles.levelBadge}>
            <Ionicons name="flash" size={14} color={Colors.gold} />
            <Text style={styles.levelText}>Level {user?.level ?? 1}</Text>
          </View>
        </View>

        {/* XP Progress */}
        <View style={styles.xpSection}>
          <View style={styles.xpHeader}>
            <Text style={styles.xpLabel}>{user?.xpPoints ?? 0} XP</Text>
            <Text style={styles.xpNext}>Next level: {500 - ((user?.xpPoints ?? 0) % 500)} XP away</Text>
          </View>
          <View style={styles.xpBar}>
            <LinearGradient
              colors={[Colors.accent, Colors.accentLight]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.xpFill, { width: `${levelProgress * 100}%` }]}
            />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatBox label="Posts" value={0} />
          <View style={styles.statDivider} />
          <StatBox label="Communities" value={0} />
          <View style={styles.statDivider} />
          <StatBox label="Friends" value={0} />
        </View>

        {/* Badges */}
        {MOCK_BADGES.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Badges</Text>
            <View style={styles.badges}>
              {MOCK_BADGES.map((b) => <BadgeChip key={b.label} {...b} />)}
            </View>
          </View>
        )}

        {/* Bio */}
        {user?.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bio}>{user.bio}</Text>
          </View>
        )}

        {/* Settings options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          {[
            { icon: 'person-outline', label: 'Edit Profile' },
            { icon: 'notifications-outline', label: 'Notifications' },
            { icon: 'shield-outline', label: 'Privacy' },
            { icon: 'help-circle-outline', label: 'Help & Support' },
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
  headerTitle: { ...Typography.h3, color: Colors.textPrimary },
  content: { paddingBottom: 100 },
  avatarSection: { alignItems: 'center', paddingVertical: Spacing.xl },
  avatarWrapper: { position: 'relative', marginBottom: Spacing.md },
  avatar: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: Colors.accent,
  },
  avatarText: { fontSize: 40, color: Colors.white, fontWeight: '700' },
  cameraBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.bg,
  },
  name: { ...Typography.h3, color: Colors.textPrimary, marginBottom: 4 },
  email: { ...Typography.bodySmall, color: Colors.textMuted, marginBottom: Spacing.sm },
  levelBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.warningLight,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radii.full,
  },
  levelText: { ...Typography.label, color: Colors.gold },
  xpSection: { marginHorizontal: Spacing.md, marginBottom: Spacing.md },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  xpLabel: { ...Typography.label, color: Colors.textPrimary },
  xpNext: { ...Typography.caption, color: Colors.textMuted },
  xpBar: {
    height: 6, backgroundColor: Colors.bgTertiary,
    borderRadius: Radii.full, overflow: 'hidden',
  },
  xpFill: { height: '100%', borderRadius: Radii.full, minWidth: 8 },
  statsRow: {
    flexDirection: 'row', marginHorizontal: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radii.lg,
    borderWidth: 1, borderColor: Colors.borderLight, marginBottom: Spacing.md,
  },
  statDivider: { width: 1, backgroundColor: Colors.borderLight },
  section: { marginHorizontal: Spacing.md, marginBottom: Spacing.lg },
  sectionTitle: { ...Typography.label, color: Colors.textMuted, marginBottom: Spacing.sm },
  badges: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  bio: { ...Typography.body, color: Colors.textSecondary, lineHeight: 22 },
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
