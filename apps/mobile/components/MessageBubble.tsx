import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Radii, Spacing } from '../constants/theme';

interface Props {
  content: string;
  isMine: boolean;
  senderName?: string;
  createdAt: string;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({ content, isMine, createdAt }: Props) {
  return (
    <View style={[styles.row, isMine ? styles.rowRight : styles.rowLeft]}>
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={styles.text}>{content}</Text>
        <Text style={styles.time}>{formatTime(createdAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  rowRight: { justifyContent: 'flex-end' },
  rowLeft: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '78%',
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    gap: 4,
  },
  bubbleMine: {
    backgroundColor: Colors.accent,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: Colors.bgTertiary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderBottomLeftRadius: 4,
  },
  text: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  time: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.45)',
    alignSelf: 'flex-end',
  },
});
