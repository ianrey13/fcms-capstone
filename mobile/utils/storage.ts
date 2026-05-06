// mobile/utils/storage.ts
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export const storage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (isWeb) {
        return localStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('Storage getItem error:', error);
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (isWeb) {
        localStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error('Storage setItem error:', error);
    }
  },

  deleteItem: async (key: string): Promise<void> => {
    try {
      if (isWeb) {
        localStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error('Storage deleteItem error:', error);
    }
  },

  clear: async (): Promise<void> => {
    try {
      if (isWeb) {
        localStorage.clear();
      } else {
        await SecureStore.deleteItemAsync('fcms_token');
        await SecureStore.deleteItemAsync('fcms_user');
      }
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  },
};