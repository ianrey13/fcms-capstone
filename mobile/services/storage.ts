// mobile/services/storage.ts
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Detect if running in browser
const isWeb = Platform.OS === 'web';

export const storage = {
  // Get item
  getItem: async (key: string): Promise<string | null> => {
    if (isWeb) {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  },

  // Set item
  setItem: async (key: string, value: string): Promise<void> => {
    if (isWeb) {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },

  // Delete item
  deleteItem: async (key: string): Promise<void> => {
    if (isWeb) {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};