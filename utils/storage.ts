// localStorage utility functions for the entire application

export interface StorageItem {
  key: string;
  value: any;
  expiry?: number; // timestamp in milliseconds
}

class LocalStorageManager {
  private prefix: string = 'webrtc-app-';

  constructor(prefix?: string) {
    if (prefix) {
      this.prefix = prefix;
    }
  }

  // Get full key with prefix
  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  // Set item in localStorage
  setItem<T>(key: string, value: T, expiryInHours?: number): void {
    try {
      const item: StorageItem = {
        key,
        value,
        expiry: expiryInHours ? Date.now() + (expiryInHours * 60 * 60 * 1000) : undefined
      };
      
      localStorage.setItem(this.getKey(key), JSON.stringify(item));
    } catch (error) {
      console.error(`Error setting localStorage item ${key}:`, error);
    }
  }

  // Get item from localStorage
  getItem<T>(key: string, defaultValue?: T): T | null {
    try {
      const itemStr = localStorage.getItem(this.getKey(key));
      if (!itemStr) {
        return defaultValue || null;
      }

      const item: StorageItem = JSON.parse(itemStr);
      
      // Check if item has expired
      if (item.expiry && Date.now() > item.expiry) {
        this.removeItem(key);
        return defaultValue || null;
      }

      return item.value as T;
    } catch (error) {
      console.error(`Error getting localStorage item ${key}:`, error);
      return defaultValue || null;
    }
  }

  // Remove item from localStorage
  removeItem(key: string): void {
    try {
      localStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.error(`Error removing localStorage item ${key}:`, error);
    }
  }

  // Update existing item
  updateItem<T>(key: string, updater: (currentValue: T | null) => T, expiryInHours?: number): void {
    try {
      const currentValue = this.getItem<T>(key);
      const newValue = updater(currentValue);
      this.setItem(key, newValue, expiryInHours);
    } catch (error) {
      console.error(`Error updating localStorage item ${key}:`, error);
    }
  }

  // Check if item exists
  hasItem(key: string): boolean {
    try {
      const itemStr = localStorage.getItem(this.getKey(key));
      if (!itemStr) return false;

      const item: StorageItem = JSON.parse(itemStr);
      
      // Check if item has expired
      if (item.expiry && Date.now() > item.expiry) {
        this.removeItem(key);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Error checking localStorage item ${key}:`, error);
      return false;
    }
  }

  // Clear all items with this prefix
  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }

  // Get all keys with prefix
  getAllKeys(): string[] {
    try {
      const keys = Object.keys(localStorage);
      return keys
        .filter(key => key.startsWith(this.prefix))
        .map(key => key.replace(this.prefix, ''));
    } catch (error) {
      console.error('Error getting localStorage keys:', error);
      return [];
    }
  }

  // Get storage size in bytes
  getStorageSize(): number {
    try {
      let totalSize = 0;
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += key.length + value.length;
          }
        }
      });
      return totalSize;
    } catch (error) {
      console.error('Error calculating localStorage size:', error);
      return 0;
    }
  }

  // Remove expired items
  removeExpiredItems(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          const itemStr = localStorage.getItem(key);
          if (itemStr) {
            try {
              const item: StorageItem = JSON.parse(itemStr);
              if (item.expiry && Date.now() > item.expiry) {
                localStorage.removeItem(key);
              }
            } catch {
              // Invalid JSON, remove the item
              localStorage.removeItem(key);
            }
          }
        }
      });
    } catch (error) {
      console.error('Error removing expired items:', error);
    }
  }
}

// Create default instance
const storage = new LocalStorageManager();

// Export specific storage managers for different parts of the app
export const userStorage = new LocalStorageManager('webrtc-user-');
export const chatStorage = new LocalStorageManager('webrtc-chat-');
export const settingsStorage = new LocalStorageManager('webrtc-settings-');
export const cacheStorage = new LocalStorageManager('webrtc-cache-');

// Export default storage and class
export { LocalStorageManager };
export default storage;

// Common storage keys used throughout the app
export const STORAGE_KEYS = {
  // User related
  USERNAME: 'username',
  USER_ID: 'userId',
  USER_PROFILE: 'profile',
  AUTH_TOKEN: 'authToken',
  
  // Chat related
  MESSAGES: 'messages',
  CONVERSATIONS: 'conversations',
  SELECTED_USER: 'selectedUser',
  UNREAD_COUNTS: 'unreadCounts',
  FAILED_MESSAGES: 'failedMessages',
  
  // Settings
  THEME: 'theme',
  LANGUAGE: 'language',
  NOTIFICATIONS: 'notifications',
  SOUND_ENABLED: 'soundEnabled',
  AUTO_RETRY: 'autoRetry',
  
  // Cache
  CONVERSATION_CACHE: 'conversationCache',
  USER_CACHE: 'userCache',
  MEDIA_CACHE: 'mediaCache',
  
  // Call related
  CALL_SETTINGS: 'callSettings',
  RECENT_CALLS: 'recentCalls'
} as const;

// Helper functions for common operations
export const storageHelpers = {
  // User helpers - MOVED TO SECURE COOKIES
  saveUser: (username: string, userId?: string) => {
    console.warn('saveUser: Use secure cookies instead of localStorage');
    // This is deprecated - use setAuthCookie from cookies.ts
  },
  
  getUser: () => {
    console.warn('getUser: Use getClientCookies instead of localStorage');
    // This is deprecated - use getClientCookies from cookies.ts
    const username = userStorage.getItem(STORAGE_KEYS.USERNAME) || '';
    const userId = userStorage.getItem(STORAGE_KEYS.USER_ID) || '';
    return {
      username: username as string,
      userId: userId as string
    };
  },
  
  clearUser: () => {
    console.warn('clearUser: Use secure cookies instead of localStorage');
    // This is deprecated - clear auth cookies instead
    userStorage.removeItem(STORAGE_KEYS.USERNAME);
    userStorage.removeItem(STORAGE_KEYS.USER_ID);
    userStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    userStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  },
  
  // Chat helpers
  saveFailedMessage: (message: any) => {
    chatStorage.updateItem(STORAGE_KEYS.FAILED_MESSAGES, (current: any[] | null) => [...(current || []), message]);
  },
  
  getFailedMessages: () => {
    return chatStorage.getItem(STORAGE_KEYS.FAILED_MESSAGES, []);
  },
  
  clearFailedMessages: () => {
    chatStorage.removeItem(STORAGE_KEYS.FAILED_MESSAGES);
  },
  
  // Settings helpers
  saveSetting: (key: string, value: any) => {
    settingsStorage.setItem(key, value);
  },
  
  getSetting: (key: string, defaultValue?: any) => {
    return settingsStorage.getItem(key, defaultValue);
  },
  
  // Cache helpers with expiry (24 hours by default)
  setCache: (key: string, value: any, expiryInHours: number = 24) => {
    cacheStorage.setItem(key, value, expiryInHours);
  },
  
  getCache: (key: string, defaultValue?: any) => {
    return cacheStorage.getItem(key, defaultValue);
  },
  
  clearCache: () => {
    cacheStorage.clear();
  }
};
