// mobile/services/api.ts
import axios from 'axios';
import { storage } from '../utils/storage';

// Change this to your computer's IP address
const API_URL = 'http://172.22.157.4:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await storage.getItem('fcms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await storage.deleteItem('fcms_token');
      await storage.deleteItem('fcms_user');
    }
    return Promise.reject(error);
  }
);

// Auth API
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
  
  // ✅ Try POST instead of PUT
  updateProfile: (data: any) => api.post('/auth/update-profile', data),
  
  // Alternative: Try PATCH if POST doesn't work
  updateProfilePatch: (data: any) => api.patch('/auth/me', data),
};

// User API (for admin - not accessible by driver)
export const userAPI = {
  getById: (id: number) => api.get(`/admin/users/${id}`),
  update: (id: number, data: any) => api.put(`/admin/users/${id}`, data),
};

// Driver API
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

// GPS API
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