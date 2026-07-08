// web/src/services/echo.js
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

// ============================================
// ✅ DETECT PLATFORM
// ============================================

const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// ============================================
// ✅ GET CORRECT HOST
// ============================================

// ✅ Your PC's local IP - CHANGE THIS to match your actual IP!
const PC_IP = '192.168.1.5';

let wsHost = import.meta.env.VITE_REVERB_HOST || 'localhost';

if (isMobile) {
    wsHost = PC_IP;
    console.log('📱 Mobile device detected - using IP:', wsHost);
} else {
    wsHost = 'localhost';
    console.log('💻 Desktop detected - using:', wsHost);
}

const wsPort = parseInt(import.meta.env.VITE_REVERB_PORT) || 8080;
const wsKey = import.meta.env.VITE_REVERB_APP_KEY || 'velng2wlywkgfpeuhouw';
const wsScheme = import.meta.env.VITE_REVERB_SCHEME || 'http';

// ✅ Get the correct API URL for auth
const apiUrl = isMobile 
    ? `http://${PC_IP}:8000/api`  // Mobile uses PC IP
    : import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

console.log('🔊 ===== ECHO CONFIG =====');
console.log('📱 Platform:', isMobile ? 'Mobile' : 'Desktop');
console.log('🏠 Host:', wsHost);
console.log('🔌 Port:', wsPort);
console.log('🔑 Key:', wsKey);
console.log('📡 Scheme:', wsScheme);
console.log('🔗 API:', apiUrl);
console.log('===========================');

// ✅ Get token from localStorage
const getToken = () => {
    return localStorage.getItem('fcms_token');
};

// ============================================
// ✅ CREATE ECHO INSTANCE
// ============================================

const echo = new Echo({
    broadcaster: 'reverb',
    key: wsKey,
    wsHost: wsHost,
    wsPort: wsPort,
    wssPort: wsPort,
    forceTLS: wsScheme === 'https',
    enabledTransports: ['ws', 'wss'],
    timeout: 30000,
    authEndpoint: `${apiUrl}/broadcasting/auth`,
    auth: {
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            Authorization: `Bearer ${getToken()}`,
        },
    },
});

console.log('🔊 Echo instance created:', echo);

// ============================================
// ✅ EXPOSE GLOBALLY
// ============================================

window.echo = echo;

// ============================================
// ✅ CONNECTION MANAGEMENT
// ============================================

let retryCount = 0;
const maxRetries = 20;

const tryConnect = () => {
    try {
        if (echo.connector) {
            console.log('✅ Connector found');
            
            if (echo.connector.pusher) {
                const connection = echo.connector.pusher.connection;
                console.log('📊 Connection state:', connection.state);
                
                if (connection.state === 'connected') {
                    console.log('✅ Reverb WebSocket connected!');
                    console.log('🔗 Connected to:', wsHost, ':', wsPort);
                    
                    // ✅ Wait a moment before subscribing
                    setTimeout(() => {
                        subscribeToNotifications();
                    }, 500);
                    return;
                } else if (connection.state === 'connecting') {
                    console.log('⏳ WebSocket connecting...');
                } else if (connection.state === 'disconnected' || connection.state === 'unavailable') {
                    console.log('🔄 Attempting to connect...');
                    connection.connect();
                }
            }
        }
        
        retryCount++;
        if (retryCount < maxRetries) {
            console.log(`🔄 Retry ${retryCount}/${maxRetries}...`);
            setTimeout(tryConnect, 1000);
        } else {
            console.error('❌ Failed to connect to Reverb');
            console.log('💡 Run: php artisan reverb:start');
        }
    } catch (error) {
        console.error('❌ Connection error:', error);
        retryCount++;
        if (retryCount < maxRetries) {
            setTimeout(tryConnect, 2000);
        }
    }
};

// ============================================
// ✅ SUBSCRIBE TO NOTIFICATIONS
// ============================================

function subscribeToNotifications() {
    try {
        const token = getToken();
        if (!token) {
            console.log('⚠️ No token found, skipping notification subscription');
            return;
        }
        
        const userStr = localStorage.getItem('fcms_user');
        if (!userStr) {
            console.log('⚠️ No user found, skipping notification subscription');
            return;
        }
        
        const user = JSON.parse(userStr);
        const userId = user.user_id || user.id;
        
        if (!userId) {
            console.log('⚠️ No user ID found');
            return;
        }
        
        console.log('🔔 Subscribing to notifications for user:', userId);
        
        // ✅ Subscribe to private channel
        const channel = echo.private(`notifications.${userId}`);
        
        // ✅ Listen for new notifications
        channel.listen('.notification.new', (data) => {
            console.log('📨 Real-time notification received:', data);
            
            // ✅ Show browser notification
            showBrowserNotification(data.message);
            
            // ✅ Dispatch event for UI update
            window.dispatchEvent(new CustomEvent('new-notification', { detail: data }));
            
            // ✅ Update notification badge
            updateNotificationBadge();
        });
        
        // ✅ Handle subscription success
        channel.subscribed(() => {
            console.log(`✅ Subscribed to notifications.${userId}`);
        });
        
        // ✅ Handle subscription error
        channel.error((error) => {
            console.error(`❌ Subscription error for notifications.${userId}:`, error);
            
            // ✅ Retry subscription after 5 seconds
            setTimeout(() => {
                console.log('🔄 Retrying subscription...');
                subscribeToNotifications();
            }, 5000);
        });
        
    } catch (error) {
        console.error('❌ Failed to subscribe to notifications:', error);
    }
}

// ============================================
// ✅ SHOW BROWSER NOTIFICATION
// ============================================

function showBrowserNotification(message) {
    try {
        if (!('Notification' in window)) {
            return;
        }
        
        if (Notification.permission === 'granted') {
            new Notification('FCMS Notification', {
                body: message,
                icon: '/vite.svg',
            });
        } else if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    } catch (error) {
        console.error('❌ Failed to show browser notification:', error);
    }
}

// ============================================
// ✅ UPDATE NOTIFICATION BADGE
// ============================================

function updateNotificationBadge() {
    try {
        window.dispatchEvent(new CustomEvent('refresh-notifications'));
    } catch (error) {
        console.error('❌ Failed to update notification badge:', error);
    }
}

// ============================================
// ✅ START CONNECTION
// ============================================

setTimeout(tryConnect, 1000);

export default echo;

// ============================================
// ✅ CONSOLE HELPERS
// ============================================

window.testNotification = () => {
    console.log('🔔 Testing notification...');
    window.dispatchEvent(new CustomEvent('new-notification', {
        detail: {
            message: '🔔 Test notification from browser!',
            notification_type: 'test',
        }
    }));
};

window.checkEchoConnection = () => {
    if (echo.connector && echo.connector.pusher) {
        const state = echo.connector.pusher.connection.state;
        console.log('📊 Connection state:', state);
        return state;
    }
    console.log('❌ Echo not initialized');
    return null;
};

window.reconnectEcho = () => {
    console.log('🔄 Reconnecting...');
    if (echo.connector && echo.connector.pusher) {
        echo.connector.pusher.connection.disconnect();
        setTimeout(() => {
            echo.connector.pusher.connection.connect();
        }, 1000);
    }
};

console.log('🔧 Available commands:');
console.log('  - window.testNotification()');
console.log('  - window.checkEchoConnection()');
console.log('  - window.reconnectEcho()');