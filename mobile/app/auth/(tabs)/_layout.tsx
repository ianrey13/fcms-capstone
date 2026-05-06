// app/auth/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TabLayout() {
  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: '#3b82f6',
          tabBarInactiveTintColor: '#94a3b8',
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarItemStyle: styles.tabBarItem,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size, focused }) => (
              <View style={{ position: 'relative' }}>
                <Ionicons 
                  name={focused ? 'home' : 'home-outline'} 
                  size={size} 
                  color={color} 
                />
                {focused && (
                  <View style={[styles.activeIndicator, { backgroundColor: '#3b82f6' }]} />
                )}
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size, focused }) => (
              <View style={{ position: 'relative' }}>
                <Ionicons 
                  name={focused ? 'person' : 'person-outline'} 
                  size={size} 
                  color={color} 
                />
                {focused && (
                  <View style={[styles.activeIndicator, { backgroundColor: '#3b82f6' }]} />
                )}
              </View>
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  tabBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    height: 65,
    paddingBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    // Remove absolute positioning
    position: 'relative',
    // Add shadow only on top
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  tabBarItem: {
    paddingVertical: 4,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    transform: [{ translateX: -3 }],
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});