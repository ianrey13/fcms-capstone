// app/_layout.tsx - FINAL FIXED VERSION WITH TOAST
import { Stack } from "expo-router";
import "@/global.css";
import { useEffect, useRef, useState } from "react";
import { View, Text, Platform, AppState, AppStateStatus } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { storage } from "@/utils/storage";
import { 
  initializePusher, 
  subscribeToNotifications, 
  disconnectPusher 
} from "@/utils/websocket";
import { registerPushToken } from "@/services/notifications";
// ✅ ADD TOAST
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/config/toastConfig';

const isExpoGo = Constants.appOwnership === 'expo';

const getToken = async (): Promise<string | null> => {
  try {
    return await storage.getItem('fcms_token');
  } catch (error) {
    console.error("getToken error:", error);
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
    console.error("getUserId error:", error);
    return null;
  }
};

try {
  if (Notifications && Notifications.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
} catch (error) {
  console.log("⚠️ Notification handler not available");
}

export default function RootLayout() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const authCheckedRef = useRef(false);
  const navigationScheduledRef = useRef(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const notificationListenerRef = useRef<any>(null);
  const responseListenerRef = useRef<any>(null);

  // ============================================
  // CHECK AUTH STATUS - FINAL FIX
  // ============================================

  useEffect(() => {
    if (authCheckedRef.current) {
      console.log("🔍 [DEBUG] useEffect - auth already checked, skipping");
      return;
    }
    
    console.log("🔍 [DEBUG] useEffect - checking auth (first time)");
    authCheckedRef.current = true;
    checkAuth();
  }, []);

  const checkAuth = async () => {
    console.log("🔍 [DEBUG] checkAuth STARTED");
    try {
      const token = await getToken();
      const userId = await getUserId();
      
      console.log("🔍 [DEBUG] Token:", token ? "YES" : "NO");
      console.log("🔍 [DEBUG] UserId:", userId || "NO");
      
      // ✅ Set loading false first
      setIsLoading(false);
      
      if (token && userId) {
        console.log("🔍 [DEBUG] ✅ Authenticated - going to dashboard");
        setIsAuthenticated(true);
        setUserId(Number(userId));
        // ✅ Use setTimeout to break the render cycle
        setTimeout(() => {
          if (!navigationScheduledRef.current) {
            navigationScheduledRef.current = true;
            router.replace("/auth/(tabs)");
          }
        }, 10);
      } else {
        console.log("🔍 [DEBUG] ❌ Not authenticated - going to login");
        setIsAuthenticated(false);
        // ✅ Use setTimeout to break the render cycle
        setTimeout(() => {
          if (!navigationScheduledRef.current) {
            navigationScheduledRef.current = true;
            router.replace("/");
          }
        }, 10);
      }
    } catch (error) {
      console.error("🔍 [DEBUG] Auth check error:", error);
      setIsAuthenticated(false);
      setIsLoading(false);
      setTimeout(() => {
        if (!navigationScheduledRef.current) {
          navigationScheduledRef.current = true;
          router.replace("/");
        }
      }, 10);
    } finally {
      console.log("🔍 [DEBUG] checkAuth COMPLETE");
    }
  };

  // ============================================
  // SETUP NOTIFICATIONS
  // ============================================

  useEffect(() => {
    if (!userId) {
      console.log("🔍 [DEBUG] No userId - skipping notifications setup");
      return;
    }

    console.log("🔔 Setting up notifications for user:", userId);
    console.log("📱 Expo Go mode:", isExpoGo);

    let isMounted = true;

    const setupNotifications = async () => {
      try {
        const pusher = await initializePusher();
        if (!pusher) {
          console.warn("⚠️ Failed to initialize WebSocket");
          return;
        }

        const unsub = await subscribeToNotifications(
          userId,
          (data) => {
            console.log("📨 Real-time notification received:", data);
          },
          (error) => {
            console.error("❌ Notification subscription error:", error);
          }
        );

        unsubscribeRef.current = unsub;

        if (!isExpoGo && Device.isDevice) {
          console.log("📱 Physical device detected - registering for push...");
          try {
            const pushToken = await registerPushToken(userId);
            if (pushToken) {
              console.log("✅ Push token registered:", pushToken);
            }
          } catch (pushError) {
            console.error("❌ Push registration error:", pushError);
          }
        } else {
          console.log("📱 Expo Go - push notifications not available (expected)");
        }

        try {
          if (Notifications && Notifications.addNotificationReceivedListener) {
            notificationListenerRef.current = Notifications.addNotificationReceivedListener(
              (notification) => {
                console.log("📨 Push notification received (foreground):", notification);
                if (isMounted) {
                  const data = notification.request.content.data;
                }
              }
            );

            responseListenerRef.current = Notifications.addNotificationResponseReceivedListener(
              (response) => {
                console.log("🔔 User tapped notification:", response);
                const data = response.notification.request.content.data;
                handleNotificationNavigation(data);
              }
            );
          }
        } catch (listenerError) {
          console.log("⚠️ Could not set up notification listeners:", listenerError);
        }

        console.log("✅ All notification systems ready");

      } catch (error) {
        console.error("❌ Failed to setup notifications:", error);
      }
    };

    setupNotifications();

    const subscription = AppState.addEventListener("change", (state: AppStateStatus) => {
      console.log("📱 App state changed:", state);
    });

    return () => {
      isMounted = false;
      
      console.log("🧹 Cleaning up notification system");
      
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      
      if (notificationListenerRef.current) {
        try {
          if (Notifications && Notifications.removeNotificationSubscription) {
            Notifications.removeNotificationSubscription(notificationListenerRef.current);
          }
        } catch (e) {
          console.log("Could not remove notification listener");
        }
        notificationListenerRef.current = null;
      }
      
      if (responseListenerRef.current) {
        try {
          if (Notifications && Notifications.removeNotificationSubscription) {
            Notifications.removeNotificationSubscription(responseListenerRef.current);
          }
        } catch (e) {
          console.log("Could not remove response listener");
        }
        responseListenerRef.current = null;
      }
      
      subscription.remove();
      disconnectPusher();
    };

  }, [userId]);

  const handleNotificationNavigation = (data: any) => {
    console.log("🔔 Navigating from notification:", data);
    
    if (!data) return;
    
    const type = data.type || data.notification_type;
    const entityId = data.entity_id;
    
    switch (type) {
      case 'fund_release':
      case 'fund_released':
        router.push("/auth/trips/active");
        break;
        
      case 'trip_assigned':
        if (entityId) {
          router.push(`/auth/trips/${entityId}`);
        }
        break;
        
      case 'trip_started':
      case 'trip_completed':
        if (entityId) {
          router.push(`/auth/trips/${entityId}`);
        }
        break;
        
      case 'mo_approved':
      case 'trip_created':
        router.push("/auth/trips/active");
        break;
        
      default:
        router.push("/auth/(tabs)");
        break;
    }
  };

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoading) {
    console.log("🔍 [DEBUG] Rendering loading state");
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <Text style={{ fontSize: 16, color: '#64748b' }}>Loading...</Text>
      </View>
    );
  }

  // ============================================
  // RENDER WITH TOAST
  // ============================================

  console.log("🔍 [DEBUG] Rendering Stack navigator, isAuthenticated:", isAuthenticated);
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="index" options={{ headerShown: false }} />
        ) : (
          <Stack.Screen name="auth" options={{ headerShown: false }} />
        )}
      </Stack>
      {/* ✅ TOAST PROVIDER */}
      <Toast config={toastConfig} />
    </>
  );
}