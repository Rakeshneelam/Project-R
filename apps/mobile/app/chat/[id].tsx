import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
import { messagesApi } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';
import { MessageBubble } from '../../components/MessageBubble';
import { Colors, Typography, Spacing, Radii } from '../../constants/theme';
import { auth } from '../../services/firebaseConfig';

const WS_URL = Platform.OS === 'web' ? 'http://localhost:3000' : 'http://10.0.2.2:3000';

export default function ChatScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, firebaseUser } = useAuthStore();

  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [partnerName, setPartnerName] = useState('Chat');

  const socketRef = useRef<Socket | null>(null);
  const flatRef = useRef<FlatList>(null);
  const typingTimer = useRef<any>(null);

  // Load history
  const loadMessages = useCallback(async () => {
    try {
      const res = await messagesApi.getMessages(conversationId, 1);
      const msgs = (res.data?.data ?? []).reverse(); // oldest first
      setMessages(msgs);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // Connect WebSocket
  useEffect(() => {
    loadMessages();

    const connectSocket = async () => {
      const token = await auth.currentUser?.getIdToken();
      const socket = io(WS_URL, {
        path: '/socket.io',
        transports: ['websocket'],
        query: { token },
      });

      socket.on('connect', () => {
        // Authenticate + join conversation room
        socket.emit('authenticate', { userId: user?.id });
        socket.emit('join_conversation', { conversationId });
      });

      socket.on('new_message', (msg: any) => {
        setMessages((prev) => [...prev, msg]);
        flatRef.current?.scrollToEnd({ animated: true });
      });

      socket.on('user_typing', () => {
        setIsTyping(true);
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setIsTyping(false), 2500);
      });

      socketRef.current = socket;
    };

    connectSocket();
    return () => {
      socketRef.current?.disconnect();
    };
  }, [conversationId, user?.id]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    const content = text.trim();
    setText('');
    setSending(true);
    try {
      const res = await messagesApi.sendMessage(conversationId, content);
      // Optimistically add (ws will also broadcast but dedup by id)
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === res.data.id);
        return exists ? prev : [...prev, res.data];
      });
      flatRef.current?.scrollToEnd({ animated: true });
    } catch {
      setText(content); // restore on error
    } finally {
      setSending(false);
    }
  };

  const emitTyping = () => {
    socketRef.current?.emit('typing', { conversationId, userId: user?.id });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{partnerName}</Text>
          {isTyping && (
            <Text style={styles.typingText}>typing…</Text>
          )}
        </View>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="call-outline" size={22} color={Colors.accentLight} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.accent} size="large" />
          </View>
        ) : (
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => (
              <MessageBubble
                content={item.content}
                isMine={item.senderId === user?.id}
                createdAt={item.createdAt}
              />
            )}
            contentContainerStyle={styles.messageList}
            onLayout={() => flatRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.center}>
                <Ionicons name="chatbubble-ellipses-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyText}>Say hello! 👋</Text>
              </View>
            }
          />
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={(v) => { setText(v); emitTyping(); }}
            placeholder="Message…"
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
            activeOpacity={0.8}
          >
            {sending
              ? <ActivityIndicator color={Colors.white} size="small" />
              : <Ionicons name="send" size={18} color={Colors.white} />
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  backBtn: { padding: Spacing.sm },
  headerInfo: { flex: 1 },
  headerName: { ...Typography.h4, color: Colors.textPrimary },
  typingText: { ...Typography.caption, color: Colors.accentLight },
  iconBtn: { padding: Spacing.sm },
  messageList: { paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: Spacing.sm,
    backgroundColor: Colors.bg,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 110,
    backgroundColor: Colors.bgTertiary,
    borderRadius: Radii.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.textPrimary,
    ...Typography.body,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5, shadowRadius: 8, elevation: 6,
  },
  sendBtnDisabled: { opacity: 0.4 },
  emptyText: { ...Typography.body, color: Colors.textMuted },
});
