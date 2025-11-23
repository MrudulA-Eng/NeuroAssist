
export enum ViewState {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  CHATS = 'CHATS',
  PROGRESS = 'PROGRESS'
}

export enum DashboardMode {
  ROUTINE = 'ROUTINE',
  EMOTION = 'EMOTION'
}

export interface RoutineItem {
  id: string;
  label: string;
  emoji: string;
  completed: boolean;
  timestamp?: number;
}

export interface EmotionItem {
  id: string;
  label: string;
  emoji: string;
  timestamp: number;
  intensity: number; // 1-5
}

export interface QuestionItem {
  id: string;
  text: string;
  emoji: string;
  answer?: string;
}

export interface ChatContact {
  id: string;
  name: string;
  role: 'Therapist' | 'Parent' | 'Support';
  avatar: string;
  lastMessage: string;
}

export interface MentalHealthLog {
  sleepQuality: 'Bad' | 'Okay' | 'Good' | null;
  anxietyLevel: 'None' | 'Low' | 'High' | null;
  medicationTaken: boolean;
  notes: string;
}

export interface ChatMessage {
  id: string;
  senderId: string; // 'me' or contactId
  text: string;
  timestamp: number;
  type: 'text' | 'feedback';
  points?: number;
}

// Global declaration for Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
