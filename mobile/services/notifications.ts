// services/notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';  // ✅ ADD THIS
import api from './api';  
import { storage } from '../utils/storage';

// ============================================
// ✅ CHECK EXPO GO
// ============================================

const isExpoGo = Constants.appOwnership === 'expo';

// ============================================
// HELPER: Get token from storage
// ============================================

const getToken = async (): Promise<string | null> => {
  try {
    return await storage.getItem('fcms_token');
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

const getUserId = async (): Promise<number | null> => {
  try {
    const userStr = await storage.getItem('fcms_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user?.user_id || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
};

// ============================================
// REGISTER DEVICE FOR PUSH NOTIFICATIONS
// ============================================

/**
 * Register device for push notifications
 */
export const registerPushToken = async (userId?: number): Promise<string | null> => {
  try {
    // ✅ Skip if running in Expo Go
    if (isExpoGo) {
      console.log('📱 Running in Expo Go - Push notifications are disabled (expected)');
      return null;
    }

    // If userId not provided, try to get it from storage
    let finalUserId = userId;
    if (!finalUserId) {
      finalUserId = await getUserId() || undefined;
    }

    if (!finalUserId) {
      console.log('⚠️ No user ID available for push registration');
      return null;
    }

    if (!Device.isDevice) {
      console.log('📱 Must use physical device for push notifications');
      return null;
    }

    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('❌ Push notification permissions denied');
      return null;
    }

    // Get Expo push token
    const token = await Notifications.getExpoPushTokenAsync();
    
    console.log('📱 Expo Push Token:', token.data);

    // Send token to backend
    await api.post('/notifications/register-device', {
      push_token: token.data,
      platform: Platform.OS,
      device_name: Device.modelName || 'Unknown Device',
    });

    console.log('✅ Push token registered successfully');
    return token.data;

  } catch (error: any) {
    console.error('❌ Failed to register push token:', error?.message || error);
    return null;
  }
};

// ============================================
// UNREGISTER DEVICE
// ============================================

export const unregisterPushToken = async (pushToken: string): Promise<boolean> => {
  try {
    await api.post('/notifications/unregister-device', {
      push_token: pushToken,
    });
    console.log('✅ Push token unregistered successfully');
    return true;
  } catch (error: any) {
    console.error('❌ Failed to unregister push token:', error?.message || error);
    return false;
  }
};

// ============================================
// GET UNREAD COUNT
// ============================================

export const getUnreadCount = async (): Promise<number> => {
  try {
    const token = await getToken();
    if (!token) {
      console.log('⚠️ No token available for unread count');
      return 0;
    }

    const response = await api.get('/notifications/unread-count');
    return response.data?.unread_count || 0;
  } catch (error: any) {
    console.error('❌ Failed to get unread count:', error?.message || error);
    return 0;
  }
};

// ============================================
// GET NOTIFICATIONS
// ============================================

export const getNotifications = async (page: number = 1, limit: number = 20) => {
  try {
    const token = await getToken();
    if (!token) {
      console.log('⚠️ No token available for notifications');
      return [];
    }

    const response = await api.get('/notifications', {
      params: { page, limit }
    });
    
    return response.data?.data || [];
  } catch (error: any) {
    console.error('❌ Failed to get notifications:', error?.message || error);
    return [];
  }
};

// ============================================
// GET DRIVER NOTIFICATIONS (Mobile)
// ============================================

export const getDriverNotifications = async (unreadOnly: boolean = false, type?: string) => {
  try {
    const token = await getToken();
    if (!token) {
      console.log('⚠️ No token available for driver notifications');
      return { data: [], meta: { unread_count: 0 } };
    }

    const response = await api.get('/driver/notifications', {
      params: { unread_only: unreadOnly, type }
    });
    
    return response.data || { data: [], meta: { unread_count: 0 } };
  } catch (error: any) {
    console.error('❌ Failed to get driver notifications:', error?.message || error);
    return { data: [], meta: { unread_count: 0 } };
  }
};

// ============================================
// MARK AS READ
// ============================================

export const markAsRead = async (notificationId: number): Promise<boolean> => {
  try {
    const token = await getToken();
    if (!token) {
      console.log('⚠️ No token available to mark as read');
      return false;
    }

    await api.post(`/notifications/${notificationId}/read`);
    return true;
  } catch (error: any) {
    console.error('❌ Failed to mark as read:', error?.message || error);
    return false;
  }
};

// ============================================
// MARK ALL AS READ
// ============================================

export const markAllAsRead = async (): Promise<number> => {
  try {
    const token = await getToken();
    if (!token) {
      console.log('⚠️ No token available to mark all as read');
      return 0;
    }

    const response = await api.post('/notifications/mark-all-read');
    return response.data?.message || 0;
  } catch (error: any) {
    console.error('❌ Failed to mark all as read:', error?.message || error);
    return 0;
  }
};

// ============================================
// NOTIFICATION PREFERENCES
// ============================================

export const getPreferences = async () => {
  try {
    const token = await getToken();
    if (!token) {
      return { push_enabled: true, email_enabled: true, types: [] };
    }

    const response = await api.get('/notifications/preferences');
    return response.data?.data || { push_enabled: true, email_enabled: true, types: [] };
  } catch (error: any) {
    console.error('❌ Failed to get preferences:', error?.message || error);
    return { push_enabled: true, email_enabled: true, types: [] };
  }
};

export const updatePreferences = async (preferences: {
  push_enabled?: boolean;
  email_enabled?: boolean;
  types?: string[];
}) => {
  try {
    const token = await getToken();
    if (!token) {
      console.log('⚠️ No token available to update preferences');
      return false;
    }

    await api.put('/notifications/preferences', preferences);
    return true;
  } catch (error: any) {
    console.error('❌ Failed to update preferences:', error?.message || error);
    return false;
  }
};

// ============================================
// TEST NOTIFICATION (For debugging)
// ============================================

export const sendTestNotification = async (): Promise<boolean> => {
  try {
    const token = await getToken();
    if (!token) {
      console.log('⚠️ No token available for test notification');
      return false;
    }

    await api.post('/notifications/test');
    console.log('✅ Test notification sent');
    return true;
  } catch (error: any) {
    console.error('❌ Failed to send test notification:', error?.message || error);
    return false;
  }
};

export default {
  registerPushToken,
  unregisterPushToken,
  getUnreadCount,
  getNotifications,
  getDriverNotifications,
  markAsRead,
  markAllAsRead,
  getPreferences,
  updatePreferences,
  sendTestNotification,
};