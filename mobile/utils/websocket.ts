// mobile/utils/websocket.ts
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import EventEmitter from './eventEmitter';

// ============================================
// CONSTANTS
// ============================================

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:8000';
const WS_KEY = process.env.EXPO_PUBLIC_WEBSOCKET_KEY || 'velng2wlywkgfpeuhouw';
const WS_HOST = process.env.EXPO_PUBLIC_WEBSOCKET_HOST || '192.168.1.5';
const WS_PORT = parseInt(process.env.EXPO_PUBLIC_WEBSOCKET_PORT || '8080');

let pusherInstance: any = null;
let isConnecting = false;

// ============================================
// HELPER: Get token
// ============================================

const getToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem('fcms_token');
    }
    const token = await SecureStore.getItemAsync('fcms_token');
    return token;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

// ============================================
// INITIALIZE PUSHER
// ============================================

export const initializePusher = async (token?: string): Promise<any> => {
  try {
    if (pusherInstance) {
      console.log('✅ Pusher instance already exists');
      return pusherInstance;
    }

    if (isConnecting) {
      console.log('⏳ Pusher connection already in progress');
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (pusherInstance) {
            clearInterval(checkInterval);
            resolve(pusherInstance);
          }
        }, 100);
      });
    }

    isConnecting = true;

    const authToken = token || await getToken();
    if (!authToken) {
      console.error('❌ No auth token available for WebSocket');
      isConnecting = false;
      return null;
    }

    console.log('🔌 Initializing Pusher with:', {
      wsHost: WS_HOST,
      wsPort: WS_PORT,
      key: WS_KEY,
      platform: Platform.OS,
      authEndpoint: `${API_URL}/api/broadcasting/auth`,
    });

    let Pusher;
    try {
      Pusher = require('pusher-js/react-native');
    } catch (nativeError) {
      console.warn('⚠️ pusher-js/react-native failed, falling back to pusher-js');
      Pusher = require('pusher-js');
    }
    
    pusherInstance = new Pusher(WS_KEY, {
      cluster: 'mt1',
      wsHost: WS_HOST,
      wsPort: WS_PORT,
      wssPort: WS_PORT,
      forceTLS: false,
      enabledTransports: ['ws', 'wss'],
      disabledTransports: ['xhr_streaming', 'xhr_polling', 'sockjs'],
      authEndpoint: `${API_URL}/api/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      },
    });

    pusherInstance.connection.bind('connected', () => {
      console.log('✅ WebSocket connected successfully');
      isConnecting = false;
    });

    pusherInstance.connection.bind('disconnected', () => {
      console.log('🔌 WebSocket disconnected');
      isConnecting = false;
    });

    pusherInstance.connection.bind('error', (error: any) => {
      console.error('❌ WebSocket error:', error);
      isConnecting = false;
    });

    pusherInstance.connect();

    isConnecting = false;
    return pusherInstance;

  } catch (error) {
    console.error('❌ Failed to initialize Pusher:', error);
    isConnecting = false;
    return null;
  }
};

// ============================================
// ✅ SUBSCRIBE TO NOTIFICATIONS - WITH DEBUG
// ============================================

export const subscribeToNotifications = (
  userId: number,
  onNotification: (data: any) => void,
  onError?: (error: any) => void
): Promise<() => void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const pusher = await initializePusher();
      
      if (!pusher) {
        reject(new Error('Failed to initialize Pusher'));
        return;
      }

      const channelName = `notifications.${userId}`;
      console.log(`🔔 Subscribing to notifications channel: ${channelName}`);

      const channel = pusher.subscribe(channelName);

      channel.bind('notification.new', (data: any) => {
        console.log('📨 🔥🔥🔥 NOTIFICATION RECEIVED IN WEBSOCKET! 🔥🔥🔥');
        console.log('📨 Full notification data:', JSON.stringify(data, null, 2));
        
        // ✅ EMIT EVENTS
        console.log('📨 Emitting new-notification event');
        EventEmitter.emit('new-notification', data);
        
        // Check for fund release
        if (data.notification_type === 'fund_released' || data.notification_type === 'fund_issued') {
          console.log('💰 Emitting fund_released event');
          EventEmitter.emit('fund_released', data);
        }
        
        // Check for trip assignment
        if (data.notification_type === 'trip_assigned') {
          console.log('🚗 Emitting trip_assigned event');
          EventEmitter.emit('trip_assigned', data);
        }
        
        // ✅ Also call the callback
        onNotification(data);
      });

      channel.bind('pusher:subscription_succeeded', () => {
        console.log(`✅ Subscribed to ${channelName}`);
      });

      channel.bind('pusher:subscription_error', (error: any) => {
        console.error(`❌ Subscription error for ${channelName}:`, error);
        if (onError) onError(error);
      });

      resolve(() => {
        console.log(`🔇 Unsubscribing from ${channelName}`);
        channel.unbind('notification.new');
        pusher.unsubscribe(channelName);
      });

    } catch (error) {
      console.error('❌ Failed to subscribe to notifications:', error);
      if (onError) onError(error);
      reject(error);
    }
  });
};

// ============================================
// DISCONNECT
// ============================================

export const disconnectPusher = async (): Promise<void> => {
  try {
    if (pusherInstance) {
      console.log('🔌 Disconnecting WebSocket...');
      pusherInstance.disconnect();
      pusherInstance = null;
      console.log('✅ WebSocket disconnected');
    }
  } catch (error) {
    console.error('❌ Error disconnecting WebSocket:', error);
  }
};

export const isConnected = (): boolean => {
  if (!pusherInstance) return false;
  try {
    return pusherInstance.connection.state === 'connected';
  } catch {
    return false;
  }
};

export const getConnectionState = (): string => {
  if (!pusherInstance) return 'disconnected';
  try {
    return pusherInstance.connection.state;
  } catch {
    return 'disconnected';
  }
};