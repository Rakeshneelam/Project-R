import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { postsApi, communitiesApi, profileApi } from '../../services/api';
import { Colors, Spacing, Radii, Typography } from '../../constants/theme';

export default function CreatePostScreen() {
  const [content, setContent] = useState('');
  const [selectedCommunity, setSelectedCommunity] = useState<any>(null);
  const [communities, setCommunities] = useState<any[]>([]);
  const [showCommunities, setShowCommunities] = useState(false);
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    communitiesApi.getJoined().then(({ data }) => {
      setCommunities(data.communities ?? data.data ?? data ?? []);
    }).catch(() => {});
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) { Alert.alert('Please write something first'); return; }
    if (!selectedCommunity) { Alert.alert('Please select a community'); return; }
    setSubmitting(true);
    try {
      let mediaUrl: string | undefined;
      if (mediaUri) {
        const filename = mediaUri.split('/').pop() ?? 'image.jpg';
        const { data: urlData } = await profileApi.getUploadUrl(filename, 'image/jpeg');
        await fetch(urlData.uploadUrl, {
          method: 'PUT', body: await fetch(mediaUri).then((r) => r.blob()),
          headers: { 'Content-Type': 'image/jpeg' },
        });
        mediaUrl = urlData.url;
      }
      await postsApi.createPost({ content: content.trim(), communityId: selectedCommunity.id, mediaUrl });
      setContent('');
      setMediaUri(null);
      setSelectedCommunity(null);
      Alert.alert('Posted!', 'Your post is live in the community.');
    } catch (e: any) {
      Alert.alert('Failed to post', e?.response?.data?.message ?? 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Post</Text>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting || !content.trim()}
          style={[styles.postBtn, (!content.trim() || submitting) && styles.postBtnDisabled]}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <Text style={styles.postBtnText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
        {/* Community selector */}
        <TouchableOpacity
          style={styles.communitySelector}
          onPress={() => setShowCommunities(!showCommunities)}
        >
          <Ionicons name="people-outline" size={18} color={Colors.accentLight} />
          <Text style={[styles.commSelectorText, selectedCommunity && styles.commSelected]}>
            {selectedCommunity?.name ?? 'Select Community'}
          </Text>
          <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
        </TouchableOpacity>

        {showCommunities && (
          <View style={styles.dropdown}>
            {communities.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.dropdownItem}
                onPress={() => { setSelectedCommunity(c); setShowCommunities(false); }}
              >
                <Text style={styles.dropdownText}>{c.name}</Text>
                {selectedCommunity?.id === c.id && (
                  <Ionicons name="checkmark-circle" size={18} color={Colors.accent} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Text area */}
        <TextInput
          style={styles.textarea}
          value={content}
          onChangeText={setContent}
          placeholder="What's on your mind? Share with your community..."
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={1000}
        />
        <Text style={styles.charCount}>{content.length}/1000</Text>

        {/* Media preview */}
        {mediaUri && (
          <View style={styles.mediaPreview}>
            <Image source={{ uri: mediaUri }} style={styles.mediaImg} resizeMode="cover" />
            <TouchableOpacity style={styles.removeMedia} onPress={() => setMediaUri(null)}>
              <Ionicons name="close-circle" size={24} color={Colors.danger} />
            </TouchableOpacity>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={pickImage}>
            <Ionicons name="image-outline" size={22} color={Colors.accentLight} />
            <Text style={styles.actionText}>Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="happy-outline" size={22} color={Colors.accentLight} />
            <Text style={styles.actionText}>Feeling</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="location-outline" size={22} color={Colors.accentLight} />
            <Text style={styles.actionText}>Location</Text>
          </TouchableOpacity>
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
  title: { ...Typography.h3, color: Colors.textPrimary },
  postBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radii.full,
  },
  postBtnDisabled: { opacity: 0.4 },
  postBtnText: { ...Typography.label, color: Colors.white },
  body: { flex: 1, padding: Spacing.md },
  communitySelector: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radii.md, padding: Spacing.md, marginBottom: Spacing.sm,
  },
  commSelectorText: { ...Typography.body, color: Colors.textMuted, flex: 1 },
  commSelected: { color: Colors.accentLight, fontWeight: '600' },
  dropdown: {
    backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.borderLight,
    borderRadius: Radii.md, marginBottom: Spacing.sm, overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  dropdownText: { ...Typography.body, color: Colors.textPrimary },
  textarea: {
    ...Typography.body, color: Colors.textPrimary,
    minHeight: 180, textAlignVertical: 'top', lineHeight: 24,
    marginBottom: Spacing.xs,
  },
  charCount: { ...Typography.caption, color: Colors.textMuted, textAlign: 'right', marginBottom: Spacing.md },
  mediaPreview: { marginBottom: Spacing.md, borderRadius: Radii.md, overflow: 'hidden', position: 'relative' },
  mediaImg: { width: '100%', height: 200 },
  removeMedia: { position: 'absolute', top: 8, right: 8 },
  actions: {
    flexDirection: 'row', gap: Spacing.md,
    paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { ...Typography.label, color: Colors.accentLight },
});
