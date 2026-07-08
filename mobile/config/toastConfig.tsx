// mobile/config/toastConfig.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export const toastConfig = {
  fundRelease: ({ text1, text2, props }: any) => (
    <TouchableOpacity 
      activeOpacity={0.9}
      onPress={props?.onPress}
      style={styles.toastWrapper}
    >
      <LinearGradient
        colors={['#d97706', '#b45309']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.toastContainer}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="cash-outline" size={24} color="#ffffff" />
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.title}>{text1 || '💰 Fund Released'}</Text>
          <Text style={styles.message} numberOfLines={2}>{text2}</Text>
        </View>
        <View style={styles.actionContainer}>
          <Text style={styles.actionText}>View</Text>
          <Ionicons name="chevron-forward" size={16} color="#ffffff" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  ),

  tripAssigned: ({ text1, text2, props }: any) => (
    <TouchableOpacity 
      activeOpacity={0.9}
      onPress={props?.onPress}
      style={styles.toastWrapper}
    >
      <LinearGradient
        colors={['#2563eb', '#1d4ed8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.toastContainer}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="car-outline" size={24} color="#ffffff" />
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.title}>{text1 || '🚗 New Trip Assigned'}</Text>
          <Text style={styles.message} numberOfLines={2}>{text2}</Text>
        </View>
        <View style={styles.actionContainer}>
          <Text style={styles.actionText}>View</Text>
          <Ionicons name="chevron-forward" size={16} color="#ffffff" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  ),

  default: ({ text1, text2 }: any) => (
    <View style={styles.toastWrapper}>
      <LinearGradient
        colors={['#3b82f6', '#2563eb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.toastContainer}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="notifications" size={24} color="#ffffff" />
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.title}>{text1 || 'Notification'}</Text>
          <Text style={styles.message} numberOfLines={2}>{text2}</Text>
        </View>
      </LinearGradient>
    </View>
  ),
};

const styles = StyleSheet.create({
  toastWrapper: {
    width: '92%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    marginVertical: 8,
    alignSelf: 'center',
  },
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 70,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  actionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});