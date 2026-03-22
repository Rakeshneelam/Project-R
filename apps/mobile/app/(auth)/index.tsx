import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radii, Typography } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1e1b4b', '#0D0F1A', '#0D0F1A']}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Glow orbs */}
      <View style={[styles.orb, styles.orb1]} />
      <View style={[styles.orb, styles.orb2]} />

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <LinearGradient colors={[Colors.accent, Colors.accentLight]} style={styles.logoGradient}>
            <Ionicons name="heart" size={36} color={Colors.white} />
          </LinearGradient>
        </View>

        <Text style={styles.appName}>BondBridge</Text>
        <Text style={styles.tagline}>
          Build real connections.{'\n'}Join communities. Grow together.
        </Text>

        {/* Feature bullets */}
        {[
          { icon: 'people', text: 'Join communities you love' },
          { icon: 'trophy', text: 'Complete challenges & earn XP' },
          { icon: 'chatbubbles', text: 'Connect with like-minded people' },
        ].map((f) => (
          <View key={f.icon} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Ionicons name={f.icon as any} size={16} color={Colors.accentLight} />
            </View>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}

        {/* CTA */}
        <View style={styles.ctas}>
          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <LinearGradient colors={[Colors.accent, Colors.accentLight]} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.white} />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.secondaryBtnText}>I already have an account</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  orb: {
    position: 'absolute', borderRadius: Radii.full,
    opacity: 0.4,
  },
  orb1: {
    width: 300, height: 300, top: -80, left: -80,
    backgroundColor: Colors.accentDark,
  },
  orb2: {
    width: 200, height: 200, bottom: 100, right: -60,
    backgroundColor: Colors.accent,
    opacity: 0.2,
  },
  content: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxl,
  },
  logoContainer: { marginBottom: Spacing.lg },
  logoGradient: {
    width: 80, height: 80, borderRadius: Radii.xl,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 10,
  },
  appName: { ...Typography.h1, color: Colors.textPrimary, marginBottom: Spacing.sm, textAlign: 'center' },
  tagline: {
    ...Typography.body, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 24, marginBottom: Spacing.xl,
  },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm,
    alignSelf: 'flex-start',
  },
  featureIcon: {
    width: 32, height: 32, borderRadius: Radii.sm,
    backgroundColor: Colors.accentGlow,
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm,
  },
  featureText: { ...Typography.body, color: Colors.textSecondary },
  ctas: { width: '100%', marginTop: Spacing.xxl, gap: Spacing.md },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.md, borderRadius: Radii.lg, gap: Spacing.sm,
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  primaryBtnText: { ...Typography.h4, color: Colors.white },
  secondaryBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  secondaryBtnText: { ...Typography.body, color: Colors.textSecondary },
});
