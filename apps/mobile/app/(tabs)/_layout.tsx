import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Typography } from '../../constants/theme';

// ── The 5 tabs the user sees ───────────────────────────────────────
const TAB_ITEMS = [
  { name: 'index',        label: 'Home',         icon: 'home',         iconOutline: 'home-outline' },
  { name: 'find-friends', label: 'Find Friends', icon: 'people',       iconOutline: 'people-outline' },
  { name: 'create',       label: '',             icon: 'add',          iconOutline: 'add' },
  { name: 'dating',       label: 'Dating',       icon: 'heart',        iconOutline: 'heart-outline' },
  { name: 'profile',      label: 'Profile',      icon: 'person-circle',iconOutline: 'person-circle-outline' },
];

// ── Routes that exist as files but should NOT appear as tabs ───────
const HIDDEN_ROUTES = ['explore', 'inbox', 'discover', 'messages'];

function CustomTabBar({ state, descriptors, navigation }: any) {
  // Only render routes that belong to TAB_ITEMS
  const visibleRoutes = state.routes.filter((r: any) =>
    TAB_ITEMS.some((t) => t.name === r.name)
  );

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        {visibleRoutes.map((route: any) => {
          const tab = TAB_ITEMS.find((t) => t.name === route.name)!;
          const realIndex = state.routes.findIndex((r: any) => r.key === route.key);
          const isFocused = state.index === realIndex;
          const isCreate = route.name === 'create';

          const onPress = () => {
            if (!isFocused) navigation.navigate(route.name);
          };

          return (
            <TouchableOpacity
              key={route.key}
              style={[styles.tab, isCreate && styles.createTab]}
              onPress={onPress}
              activeOpacity={0.7}
            >
              {isCreate ? (
                <View style={styles.createBtn}>
                  <Ionicons name="add" size={28} color={Colors.white} />
                </View>
              ) : (
                <>
                  <Ionicons
                    name={(isFocused ? tab.icon : tab.iconOutline) as any}
                    size={22}
                    color={isFocused ? Colors.accentLight : Colors.textMuted}
                  />
                  {tab.label ? (
                    <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                      {tab.label}
                    </Text>
                  ) : null}
                  {isFocused && !isCreate && <View style={styles.activeDot} />}
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      {/* Visible tabs */}
      {TAB_ITEMS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} />
      ))}
      {/* Hidden routes — exist as files but don't show in tab bar */}
      {HIDDEN_ROUTES.map((name) => (
        <Tabs.Screen key={name} name={name} options={{ href: null }} />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    backgroundColor: 'rgba(10,8,25,0.97)',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
  },
  tabBar: {
    flexDirection: 'row', height: 58,
    alignItems: 'center', paddingHorizontal: 4,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 6, gap: 3 },
  createTab: { paddingTop: 0 },
  createBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55, shadowRadius: 12, elevation: 10,
    marginBottom: 4,
  },
  tabLabel: { fontSize: 10, color: Colors.textMuted },
  tabLabelActive: { color: Colors.accentLight, fontWeight: '600' },
  activeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.accentLight },
});
