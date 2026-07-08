// src/components/notifications/NotificationBell.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, AlertCircle, DollarSign } from 'lucide-react';
import { notificationAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import echo from '../../services/echo';
import { useAuth } from '../../contexts/AuthContext';
import eventBus from '../../utils/eventBus';

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const channelRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Define subscribeToChannel as a separate function
  const subscribeToChannel = () => {
    try {
      const channel = echo.channel('notifications');
      channelRef.current = channel;

      channel.listen('.notification.new', (data) => {
        console.log('🔔 Notification received in bell:', data);
        setNotifications(prev => [data, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        toast.success(data.message, {
          duration: 5000,
          icon: '🔔',
          position: 'top-right',
        });

        eventBus.emit('notification-received', data);
      });

      channel.subscribed(() => {
        console.log('✅ Subscribed to PUBLIC notification channel');
      });
    } catch (error) {
      console.error('⚠️ Error subscribing to channel:', error);
    }
  };

  // Setup real-time notifications
  useEffect(() => {
    if (!user) return;

    console.log('🔔 Setting up real-time notifications for user:', user.user_id);

    if (echo.connector && echo.connector.pusher) {
      const connection = echo.connector.pusher.connection;
      
      connection.bind('connected', () => {
        console.log('✅ WebSocket connected!');
        setIsConnected(true);
        // ✅ Now subscribeToChannel is defined
        subscribeToChannel();
      });
      
      connection.bind('disconnected', () => {
        console.log('❌ WebSocket disconnected');
        setIsConnected(false);
      });
      
      connection.bind('error', (error) => {
        console.error('❌ WebSocket error:', error);
        setIsConnected(false);
      });

      if (connection.state === 'connected') {
        setIsConnected(true);
        // ✅ Already connected, subscribe directly
        subscribeToChannel();
      } else if (connection.state === 'connecting') {
        console.log('⏳ Connecting...');
      } else {
        console.log('📊 Connection state:', connection.state);
        connection.connect();
      }
    }

    return () => {
      if (channelRef.current) {
        try {
          channelRef.current.stopListening('.notification.new');
        } catch (e) {}
      }
      if (echo.connector && echo.connector.pusher) {
        echo.connector.pusher.connection.unbind('connected');
        echo.connector.pusher.connection.unbind('disconnected');
        echo.connector.pusher.connection.unbind('error');
      }
    };
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getAll({ limit: 20 });
      const data = response.data?.data || [];
      setNotifications(data);
      const unread = data.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      fetchNotifications();
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.notification_id);
    if (notification.notification_type === 'budget_assistance_request') {
      navigate('/mo/budget-assistance');
      setIsOpen(false);
    } else if (notification.notification_type === 'trip_created' || notification.notification_type === 'fund_issued') {
      navigate(`/mo/tickets/${notification.entity_id}`);
      setIsOpen(false);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'budget_assistance_request': <DollarSign className="h-4 w-4 text-yellow-500" />,
      'budget_low_warning': <AlertCircle className="h-4 w-4 text-orange-500" />,
      'trip_created': <Bell className="h-4 w-4 text-green-500" />,
      'fund_issued': <DollarSign className="h-4 w-4 text-green-500" />,
      'trip_submitted': <Bell className="h-4 w-4 text-blue-500" />,
      'mo_rejected': <X className="h-4 w-4 text-red-500" />,
      'mo_approved': <Check className="h-4 w-4 text-green-500" />,
    };
    return icons[type] || <Bell className="h-4 w-4 text-blue-500" />;
  };

  const getNotificationColor = (type) => {
    const colors = {
      'budget_assistance_request': 'bg-yellow-50 border-yellow-200',
      'budget_low_warning': 'bg-orange-50 border-orange-200',
      'trip_created': 'bg-green-50 border-green-200',
      'fund_issued': 'bg-green-50 border-green-200',
      'mo_rejected': 'bg-red-50 border-red-200',
      'mo_approved': 'bg-green-50 border-green-200',
    };
    return colors[type] || 'bg-blue-50 border-blue-200';
  };

  const formatMessage = (message) => {
    if (message.length > 100) return message.substring(0, 100) + '...';
    return message;
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        <div className={`absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border z-50 overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b bg-gray-50">
            <span className="font-semibold text-gray-700">
              Notifications
              {!isConnected && <span className="ml-2 text-xs text-red-500">(Offline)</span>}
            </span>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:text-blue-700">
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No notifications</p>
                {!isConnected && <p className="text-xs text-red-400 mt-1">⚠️ Real-time connection lost</p>}
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.notification_id}
                  className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                    !notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  } ${getNotificationColor(notification.notification_type)}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div className="mt-1">{getNotificationIcon(notification.notification_type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.is_read ? 'font-semibold' : ''}`}>
                        {formatMessage(notification.message)}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500">{formatTime(notification.created_at)}</p>
                        {!notification.is_read && <span className="text-xs text-blue-600">New</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;