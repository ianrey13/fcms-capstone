// mobile/services/api.ts
import axios from 'axios';
import { storage } from '../utils/storage';
import { Platform } from 'react-native';

// ============================================
// API URL Configuration
// ============================================

const getApiUrl = () => {
  // For Web (browser) - uses localhost
  if (Platform.OS === 'web') {
    return 'http://localhost:8000/api';
  }
  
  // For physical device - use your machine's IP
  return 'http://192.168.1.5:8000/api';
};

const API_URL = getApiUrl();

console.log('📱 Platform:', Platform.OS);
console.log('🌐 API_URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

// ============================================
// REQUEST INTERCEPTOR - Add Auth Token
// ============================================
api.interceptors.request.use(
  async (config) => {
    const token = await storage.getItem('fcms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// ============================================
// RESPONSE INTERCEPTOR - Handle Errors
// ============================================
api.interceptors.response.use(
  (response) => {
    console.log(`📥 ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    console.error('Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.response?.data?.message || error.message,
    });
    
    if (error.response?.status === 401) {
      await storage.deleteItem('fcms_token');
      await storage.deleteItem('fcms_user');
    }
    return Promise.reject(error);
  }
);

// ============================================
// AUTH API
// ============================================
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password, device_name: 'mobile' }),
  
  logout: () => api.post('/auth/logout'),
  
  getMe: () => api.get('/auth/me'),
  
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: newPassword,
    }),
  
  updateProfile: (data: any) => api.post('/auth/update-profile', data),
  updateProfilePatch: (data: any) => api.patch('/auth/me', data),
};

// ============================================
// USER API (Admin only)
// ============================================
export const userAPI = {
  getById: (id: number) => api.get(`/admin/users/${id}`),
  update: (id: number, data: any) => api.put(`/admin/users/${id}`, data),
};

// ============================================
// DRIVER API
// ============================================
export const driverAPI = {
  getTrips: () => api.get('/driver/trips'),
  getActiveTrip: () => api.get('/driver/trips/active'),
  acknowledgeFunds: (id: number) => api.post(`/driver/trips/${id}/acknowledge`),
  startTrip: (id: number) => api.post(`/driver/trips/${id}/start`),
  completeTrip: (id: number) => api.post(`/driver/trips/${id}/complete`),
  getGasSlip: (tripId: number) => api.get(`/driver/trips/${tripId}/gas-slip`),
  uploadReceipt: (id: number, formData: FormData) =>
    api.post(`/driver/trips/${id}/receipt`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateOdometer: (id: number, odometerOut: number, odometerIn: number) =>
    api.post(`/driver/trips/${id}/odometer`, { 
      odometer_out: odometerOut, 
      odometer_in: odometerIn 
    }),
};

// ============================================
// NOTIFICATION API ✅ NEW
// ============================================
export const notificationAPI = {
  /**
   * Get all notifications (paginated)
   */
  getAll: (page: number = 1, limit: number = 20) =>
    api.get('/notifications', { params: { page, limit } }),

  /**
   * Get driver-specific notifications (for mobile)
   */
  getDriverNotifications: (unreadOnly: boolean = false, type?: string) =>
    api.get('/driver/notifications', { params: { unread_only: unreadOnly, type } }),

  /**
   * Get unread notification count
   */
  getUnreadCount: () =>
    api.get('/notifications/unread-count'),

  /**
   * Mark a notification as read
   */
  markAsRead: (id: number) =>
    api.post(`/notifications/${id}/read`),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: () =>
    api.post('/notifications/mark-all-read'),

  /**
   * Register device for push notifications
   */
  registerDevice: (pushToken: string, platform: string, deviceName?: string) =>
    api.post('/notifications/register-device', {
      push_token: pushToken,
      platform,
      device_name: deviceName || 'Unknown Device',
    }),

  /**
   * Unregister device from push notifications
   */
  unregisterDevice: (pushToken: string) =>
    api.post('/notifications/unregister-device', {
      push_token: pushToken,
    }),

  /**
   * Get notification preferences
   */
  getPreferences: () =>
    api.get('/notifications/preferences'),

  /**
   * Update notification preferences
   */
  updatePreferences: (preferences: {
    push_enabled?: boolean;
    email_enabled?: boolean;
    types?: string[];
  }) =>
    api.put('/notifications/preferences', preferences),
};

// ============================================
// GPS API
// ============================================
export const gpsAPI = {
  sendPing: (data: { 
    trip_ticket_id: number; 
    latitude: number; 
    longitude: number; 
    accuracy_meters?: number; 
    speed_kmh?: number;
    is_low_accuracy?: boolean;
  }) => api.post('/gps-pings', data),
};

export default api;