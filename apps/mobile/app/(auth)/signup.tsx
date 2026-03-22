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

export default function SignupScreen() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const [form, setForm] = useState({ name: '', email: '', password: '', dob: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSignup = async () => {
    if (!form.name || !form.email || !form.password) {
      Alert.alert('Please fill in all required fields'); return;
    }
    if (form.password.length < 8) {
      Alert.alert('Password must be at least 8 characters'); return;
    }
    setLoading(true);
    try {
      await register(form.name.trim(), form.email.trim().toLowerCase(), form.password, form.dob || undefined);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Sign up failed', e?.response?.data?.message ?? 'Something went wrong');
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

        <Text style={styles.title}>Create account ✨</Text>
        <Text style={styles.subtitle}>Join thousands building real connections</Text>

        {[
          { label: 'Full Name', key: 'name', icon: 'person-outline', placeholder: 'John Doe', keyboard: 'default' as any },
          { label: 'Email', key: 'email', icon: 'mail-outline', placeholder: 'you@example.com', keyboard: 'email-address' as any },
          { label: 'Date of Birth (optional)', key: 'dob', icon: 'calendar-outline', placeholder: 'YYYY-MM-DD', keyboard: 'default' as any },
        ].map((f) => (
          <View key={f.key} style={styles.inputGroup}>
            <Text style={styles.label}>{f.label}</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name={f.icon as any} size={18} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={form[f.key as keyof typeof form]}
                onChangeText={set(f.key as keyof typeof form)}
                placeholder={f.placeholder}
                placeholderTextColor={Colors.textMuted}
                keyboardType={f.keyboard}
                autoCapitalize={f.key === 'name' ? 'words' : 'none'}
              />
            </View>
          </View>
        ))}

        {/* Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={form.password}
              onChangeText={set('password')}
              placeholder="Min. 8 characters"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity onPress={handleSignup} disabled={loading} style={styles.btnWrapper}>
          <LinearGradient colors={[Colors.accent, Colors.accentLight]} style={styles.btn}>
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.btnText}>Create Account</Text>
            }
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.terms}>
          By signing up, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginLink}>Sign in</Text>
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
  logo: { width: 44, height: 44, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center' },
  brand: { ...Typography.h3, color: Colors.textPrimary },
  title: { ...Typography.h2, color: Colors.textPrimary, marginBottom: Spacing.xs },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.xl },
  inputGroup: { marginBottom: Spacing.md },
  label: { ...Typography.label, color: Colors.textSecondary, marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderLight,
    borderRadius: Radii.md, paddingHorizontal: Spacing.md, height: 52,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
  eyeBtn: { padding: 4 },
  btnWrapper: { marginVertical: Spacing.lg },
  btn: {
    height: 54, borderRadius: Radii.md,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  btnText: { ...Typography.h4, color: Colors.white },
  terms: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center', lineHeight: 18, marginBottom: Spacing.lg },
  termsLink: { color: Colors.accentLight },
  loginRow: { flexDirection: 'row', justifyContent: 'center' },
  loginText: { ...Typography.body, color: Colors.textSecondary },
  loginLink: { ...Typography.body, color: Colors.accentLight, fontWeight: '600' },
});
