// app/auth/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { getUnreadCount } from '@/services/notifications';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import EventEmitter from '@/utils/eventEmitter';  // ✅ Import event emitter

export default function TabLayout() {
  const [unreadCount, setUnreadCount] = useState(0);

  // ============================================
  // FETCH UNREAD COUNT ON FOCUS
  // ============================================

  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();
    }, [])
  );

  const fetchUnreadCount = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  // ============================================
  // ✅ LISTEN FOR REAL-TIME NOTIFICATIONS
  // ============================================

  useEffect(() => {
    // Listen for new notifications using EventEmitter
    const handleNewNotification = () => {
      console.log('🔔 New notification detected - refreshing badge');
      fetchUnreadCount();
    };

    EventEmitter.on('new-notification', handleNewNotification);

    // Cleanup
    return () => {
      EventEmitter.off('new-notification', handleNewNotification);
    };
  }, []);

  // ============================================
  // RENDER
  // ============================================

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
                {/* ✅ Notification Badge */}
                {unreadCount > 0 && (
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
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
    position: 'relative',
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
  // ✅ Badge styles
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#f8fafc',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 14,
  },
});