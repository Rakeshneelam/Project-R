import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Typography } from '../../constants/theme';

const TAB_ITEMS = [
  { name: 'index', label: 'Feed', icon: 'home', iconOutline: 'home-outline' },
  { name: 'discover', label: 'Discover', icon: 'compass', iconOutline: 'compass-outline' },
  { name: 'messages', label: 'Messages', icon: 'chatbubbles', iconOutline: 'chatbubbles-outline' },
  { name: 'create', label: 'Post', icon: 'add-circle', iconOutline: 'add-circle-outline' },
  { name: 'dating', label: 'Dating', icon: 'heart', iconOutline: 'heart-outline' },
  { name: 'profile', label: 'Profile', icon: 'person-circle', iconOutline: 'person-circle-outline' },
];

function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        {state.routes.map((route: any, index: number) => {
          const tab = TAB_ITEMS.find((t) => t.name === route.name) ?? TAB_ITEMS[0];
          const isFocused = state.index === index;
          const isCreate = route.name === 'create';

          const onPress = () => {
            if (!isFocused) navigation.navigate(route.name);
          };

          return (
            <TouchableOpacity key={route.key} style={[styles.tab, isCreate && styles.createTab]} onPress={onPress} activeOpacity={0.7}>
              {isCreate ? (
                <View style={styles.createBtn}>
                  <Ionicons name="add" size={26} color={Colors.white} />
                </View>
              ) : (
                <>
                  <Ionicons
                    name={(isFocused ? tab.icon : tab.iconOutline) as any}
                    size={22}
                    color={isFocused ? Colors.accentLight : Colors.textMuted}
                  />
                  <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                    {tab.label}
                  </Text>
                  {isFocused && <View style={styles.activeDot} />}
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
      {TAB_ITEMS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    backgroundColor: 'rgba(10,8,25,0.95)',
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
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 10, elevation: 8,
    marginBottom: 4,
  },
  tabLabel: { fontSize: 10, color: Colors.textMuted },
  tabLabelActive: { color: Colors.accentLight },
  activeDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: Colors.accentLight,
  },
});
