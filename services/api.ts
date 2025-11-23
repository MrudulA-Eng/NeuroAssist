
import { RoutineItem, EmotionItem, ChatMessage } from '../types';

// --- CONFIGURATION ---
// Set this to TRUE if you have the backend/server.js running locally.
// Set this to FALSE to use browser storage (LocalStorage) for the preview.
export const USE_MONGODB = false;

const API_URL = 'http://localhost:5000/api';

// --- MOCK STORAGE HELPERS (For Preview Mode) ---
const STORAGE_KEYS = {
  ROUTINES: 'neuro_routines',
  EMOTIONS: 'neuro_emotions',
  MESSAGES: 'neuro_messages',
};

const getLocal = (key: string) => JSON.parse(localStorage.getItem(key) || '[]');
const setLocal = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

// --- API SERVICE ---

export const api = {
  
  // LOGIN
  login: async (username: string, password: string): Promise<boolean> => {
    if (USE_MONGODB) {
      try {
        const res = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        return data.success;
      } catch (e) {
        console.error("API Login Error", e);
        return false;
      }
    } else {
      // Mock Login logic
      const VALID_CREDENTIALS = [
        { username: 'parent1', password: '123456' },
        { username: 'parent2', password: '234567' },
        { username: 'parent3', password: '345678' }
      ];
      return VALID_CREDENTIALS.some(c => c.username === username && c.password === password);
    }
  },

  // ROUTINES
  getRoutines: async (userId: string): Promise<RoutineItem[]> => {
    if (USE_MONGODB) {
      const res = await fetch(`${API_URL}/routines?userId=${userId}`);
      return await res.json();
    }
    return getLocal(`${STORAGE_KEYS.ROUTINES}_${userId}`);
  },

  addRoutine: async (userId: string, routine: RoutineItem): Promise<RoutineItem> => {
    if (USE_MONGODB) {
      const res = await fetch(`${API_URL}/routines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...routine, userId })
      });
      return await res.json();
    }
    const current = getLocal(`${STORAGE_KEYS.ROUTINES}_${userId}`);
    // Check if Mongo creates _id, locally we use id
    const newItem = { ...routine, _id: routine.id }; 
    setLocal(`${STORAGE_KEYS.ROUTINES}_${userId}`, [...current, newItem]);
    return newItem;
  },

  toggleRoutine: async (userId: string, id: string, completed: boolean): Promise<void> => {
    if (USE_MONGODB) {
      // Mongo uses _id, usually passed as id in frontend if mapped correctly
      // We assume id matches _id for mongo
      await fetch(`${API_URL}/routines/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed })
      });
      return;
    }
    const current = getLocal(`${STORAGE_KEYS.ROUTINES}_${userId}`);
    const updated = current.map((r: RoutineItem) => r.id === id ? { ...r, completed } : r);
    setLocal(`${STORAGE_KEYS.ROUTINES}_${userId}`, updated);
  },

  // EMOTIONS
  getEmotions: async (userId: string): Promise<EmotionItem[]> => {
    if (USE_MONGODB) {
      const res = await fetch(`${API_URL}/emotions?userId=${userId}`);
      return await res.json();
    }
    return getLocal(`${STORAGE_KEYS.EMOTIONS}_${userId}`);
  },

  addEmotion: async (userId: string, emotion: EmotionItem): Promise<EmotionItem> => {
    if (USE_MONGODB) {
      const res = await fetch(`${API_URL}/emotions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...emotion, userId })
      });
      return await res.json();
    }
    const current = getLocal(`${STORAGE_KEYS.EMOTIONS}_${userId}`);
    const newItem = { ...emotion, _id: emotion.id };
    setLocal(`${STORAGE_KEYS.EMOTIONS}_${userId}`, [...current, newItem]);
    return newItem;
  },

  // MESSAGES
  getMessages: async (userId: string, contactId: string): Promise<ChatMessage[]> => {
    if (USE_MONGODB) {
      const res = await fetch(`${API_URL}/messages?userId=${userId}&contactId=${contactId}`);
      return await res.json();
    }
    // Return all messages for the user from local storage, filtered by contact
    const allMessages = getLocal(`${STORAGE_KEYS.MESSAGES}_${userId}`);
    // In mock, we need to associate messages with contacts. 
    // We'll filter the big list.
    return allMessages.filter((m: any) => m.contactId === contactId || (m.senderId === contactId) || (m.senderId === 'me' && m.targetContactId === contactId));
  },

  sendMessage: async (userId: string, contactId: string, message: ChatMessage): Promise<ChatMessage> => {
    if (USE_MONGODB) {
      const res = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...message, userId, contactId })
      });
      return await res.json();
    }
    const current = getLocal(`${STORAGE_KEYS.MESSAGES}_${userId}`);
    // Store targetContactId to filter correctly in mock mode
    const newItem = { ...message, userId, contactId, targetContactId: contactId };
    setLocal(`${STORAGE_KEYS.MESSAGES}_${userId}`, [...current, newItem]);
    return newItem;
  },
  
  // Helper to initialize some mock data if empty
  initMockData: (userId: string) => {
     if (USE_MONGODB) return;
     if (!localStorage.getItem(`${STORAGE_KEYS.MESSAGES}_${userId}`)) {
         // Seed with some initial data for demo if empty
         // This is handled in App.tsx typically, but good to have fallback
     }
  }
};
