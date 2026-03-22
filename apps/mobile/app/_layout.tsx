import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/auth.store';
import { Colors } from '../constants/theme';

// Conditionally import gesture handler to avoid web crashes
let GestureHandlerRootView: React.ComponentType<any>;
if (Platform.OS !== 'web') {
  GestureHandlerRootView = require('react-native-gesture-handler').GestureHandlerRootView;
} else {
  GestureHandlerRootView = ({ children, style }: any) => <View style={style}>{children}</View>;
}

function RootLayoutNav() {
  const { isAuthenticated, isLoading, loadSession } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => { loadSession(); }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <RootLayoutNav />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
