import { frontendAuth } from './frontendAuth';

export interface Conversation {
  id: string;
  name: string;
  isGroup: boolean;
  createdAt: string;
  updatedAt: string;
  participants: Array<{ user: { id: string; username: string; avatar?: string } }>;
  messages: any[];
}

class ConversationsManager {
  private static instance: ConversationsManager;
  private lastLoadTime: number = 0;
  private isLoading: boolean = false;
  private cache: Conversation[] = [];
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): ConversationsManager {
    if (!ConversationsManager.instance) {
      ConversationsManager.instance = new ConversationsManager();
    }
    return ConversationsManager.instance;
  }

  async loadConversations(trigger: 'login' | 'page-load' | 'route-change' | 'manual' = 'manual'): Promise<Conversation[]> {
    const now = Date.now();
    
    // Prevent duplicate calls within short timeframes
    if (this.isLoading) {
      console.log('🔄 Conversations already loading, skipping...');
      return this.cache;
    }

    // For non-manual triggers, check cache to avoid unnecessary API calls
    if (trigger !== 'manual' && (now - this.lastLoadTime) < this.CACHE_DURATION && this.cache.length > 0) {
      console.log(`📦 Using cached conversations (trigger: ${trigger})`);
      return this.cache;
    }

    this.isLoading = true;
    console.log(`🔄 Loading conversations (trigger: ${trigger})...`);

    try {
      const session = frontendAuth.getSession();
      if (!session?.user?.id) {
        console.warn('❌ No user session found for conversations loading');
        return [];
      }

      const response = await fetch(`/api/conversations?userId=${session.user.id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load conversations: ${response.statusText}`);
      }

      const conversationsData: Conversation[] = await response.json();
      
      // Update cache and timestamp
      this.cache = conversationsData;
      this.lastLoadTime = now;
      
      console.log(`✅ Conversations loaded successfully: ${conversationsData.length} conversations (trigger: ${trigger})`);
      
      return conversationsData;
    } catch (error) {
      console.error('❌ Error loading conversations:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async refreshConversations(): Promise<Conversation[]> {
    // Force refresh by bypassing cache
    this.lastLoadTime = 0;
    return this.loadConversations('manual');
  }

  getCachedConversations(): Conversation[] {
    return this.cache;
  }

  clearCache(): void {
    this.cache = [];
    this.lastLoadTime = 0;
  }

  isCurrentlyLoading(): boolean {
    return this.isLoading;
  }
}

export const conversationsManager = ConversationsManager.getInstance();

// Convenience function for specific use cases
export const loadConversationsOnEvent = async (event: 'login' | 'page-load' | 'route-change'): Promise<Conversation[]> => {
  return conversationsManager.loadConversations(event);
};
