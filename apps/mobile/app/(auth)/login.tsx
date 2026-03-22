import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/auth.store';
import { Colors, Spacing, Radii, Typography } from '../../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Please fill in all fields'); return; }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Login failed', e?.response?.data?.message ?? 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={['#1e1b4b', '#0D0F1A']} style={styles.topGrad} />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        <TouchableOpacity style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace('/(auth)')}>
          <Ionicons name="arrow-back" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.logoRow}>
          <LinearGradient colors={[Colors.accent, Colors.accentLight]} style={styles.logo}>
            <Ionicons name="heart" size={24} color={Colors.white} />
          </LinearGradient>
          <Text style={styles.brand}>BondBridge</Text>
        </View>

        <Text style={styles.title}>Welcome back 👋</Text>
        <Text style={styles.subtitle}>Sign in to continue your journey</Text>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.forgotBtn}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        {/* Login Btn */}
        <TouchableOpacity onPress={handleLogin} disabled={loading} style={styles.loginBtnWrapper}>
          <LinearGradient colors={[Colors.accent, Colors.accentLight]} style={styles.loginBtn}>
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.loginBtnText}>Sign In</Text>
            }
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.signupRow}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <Text style={styles.signupLink}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  topGrad: { position: 'absolute', top: 0, left: 0, right: 0, height: 250 },
  scrollContent: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingTop: 60, paddingBottom: Spacing.xxl },
  back: { marginBottom: Spacing.lg },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xl },
  logo: {
    width: 44, height: 44, borderRadius: Radii.md,
    alignItems: 'center', justifyContent: 'center',
  },
  brand: { ...Typography.h3, color: Colors.textPrimary },
  title: { ...Typography.h2, color: Colors.textPrimary, marginBottom: Spacing.xs },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.xl },
  inputGroup: { marginBottom: Spacing.md },
  label: { ...Typography.label, color: Colors.textSecondary, marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.borderLight,
    borderRadius: Radii.md, paddingHorizontal: Spacing.md, height: 52,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
  eyeBtn: { padding: 4 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: Spacing.xl },
  forgotText: { ...Typography.bodySmall, color: Colors.accentLight },
  loginBtnWrapper: { marginBottom: Spacing.lg },
  loginBtn: {
    height: 54, borderRadius: Radii.md,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  loginBtnText: { ...Typography.h4, color: Colors.white },
  signupRow: { flexDirection: 'row', justifyContent: 'center' },
  signupText: { ...Typography.body, color: Colors.textSecondary },
  signupLink: { ...Typography.body, color: Colors.accentLight, fontWeight: '600' },
});
