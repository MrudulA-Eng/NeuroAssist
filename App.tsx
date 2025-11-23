
import React, { useState, useEffect } from 'react';
import { ViewState, RoutineItem, EmotionItem, ChatContact, ChatMessage } from './types';
import Layout from './components/Layout';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import Chat from './views/Chat';
import Progress from './views/Progress';
import { api } from './services/api';

const MOCK_CONTACTS: ChatContact[] = [
  { id: '1', name: 'Dr. Sandeep', role: 'Therapist', avatar: '', lastMessage: 'Great job with the morning routine!' },
  { id: '2', name: 'Dr. Sujatha', role: 'Therapist', avatar: '', lastMessage: 'Please track anxiety levels today.' },
  { id: '5', name: 'Dr. George Stephen', role: 'Therapist', avatar: '', lastMessage: 'Looking forward to our next session.' },
  { id: '6', name: 'Dr. Fathima Rasool', role: 'Therapist', avatar: '', lastMessage: 'How was sleep last night?' },
  { id: '3', name: 'Mom', role: 'Parent', avatar: '', lastMessage: 'Don\'t forget your lunch box.' },
  { id: '4', name: 'Mr. Jones', role: 'Support', avatar: '', lastMessage: 'See you at 3 PM.' },
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.LOGIN);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  // Data State
  const [routines, setRoutines] = useState<RoutineItem[]>([]);
  const [emotions, setEmotions] = useState<EmotionItem[]>([]);
  const [contacts] = useState<ChatContact[]>(MOCK_CONTACTS);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  
  const [selectedTherapistId, setSelectedTherapistId] = useState<string | null>(null);

  // Load initial data when user logs in
  useEffect(() => {
    if (currentUserId) {
      loadData();
    }
  }, [currentUserId]);

  const loadData = async () => {
    if (!currentUserId) return;
    const loadedRoutines = await api.getRoutines(currentUserId);
    const loadedEmotions = await api.getEmotions(currentUserId);
    setRoutines(loadedRoutines);
    setEmotions(loadedEmotions);

    // Load messages for each contact
    const msgs: Record<string, ChatMessage[]> = {};
    for (const contact of contacts) {
      msgs[contact.id] = await api.getMessages(currentUserId, contact.id);
    }
    setMessages(msgs);
  };

  const handleLogin = (userId: string) => {
    setCurrentUserId(userId);
    api.initMockData(userId); // Seeding if empty (mock only)
    setCurrentView(ViewState.DASHBOARD);
  };

  const handleLogout = () => {
    setCurrentView(ViewState.LOGIN);
    setCurrentUserId('');
    setRoutines([]);
    setEmotions([]);
    setMessages({});
    setSelectedTherapistId(null);
  };

  // --- Data Handlers ---

  const handleAddRoutine = async (label: string, emoji: string) => {
    const newItem: RoutineItem = {
      id: Date.now().toString(),
      label,
      emoji,
      completed: false,
      timestamp: Date.now()
    };
    // Optimistic update
    setRoutines(prev => [...prev, newItem]);
    // Save to backend
    await api.addRoutine(currentUserId, newItem);
  };

  const handleToggleRoutine = async (id: string, completed: boolean) => {
    setRoutines(prev => prev.map(r => r.id === id ? { ...r, completed } : r));
    await api.toggleRoutine(currentUserId, id, completed);
  };

  const handleAddEmotion = async (label: string, emoji: string) => {
    const newItem: EmotionItem = {
      id: Date.now().toString(),
      label,
      emoji,
      timestamp: Date.now(),
      intensity: 3
    };
    setEmotions(prev => [...prev, newItem]);
    await api.addEmotion(currentUserId, newItem);
  };

  const handleSendMessage = async (contactId: string, text: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'me',
      text,
      timestamp: Date.now(),
      type: 'text'
    };

    setMessages(prev => ({
      ...prev,
      [contactId]: [...(prev[contactId] || []), newMessage]
    }));

    await api.sendMessage(currentUserId, contactId, newMessage);
  };

  const handleDayComplete = async (therapistId: string, feedback: string, points: number) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: therapistId,
      text: feedback,
      timestamp: Date.now(),
      type: 'feedback',
      points: points
    };

    setMessages(prev => ({
      ...prev,
      [therapistId]: [...(prev[therapistId] || []), newMessage]
    }));

    await api.sendMessage(currentUserId, therapistId, newMessage);
  };

  if (currentView === ViewState.LOGIN) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout currentView={currentView} setView={setCurrentView} onLogout={handleLogout}>
      {currentView === ViewState.DASHBOARD && (
        <Dashboard 
          routines={routines} 
          emotions={emotions} 
          contacts={contacts}
          selectedTherapistId={selectedTherapistId}
          setSelectedTherapistId={setSelectedTherapistId}
          onAddRoutine={handleAddRoutine}
          onToggleRoutine={handleToggleRoutine}
          onAddEmotion={handleAddEmotion}
          onDayComplete={handleDayComplete}
        />
      )}
      {currentView === ViewState.CHATS && (
        <Chat 
          contacts={contacts} 
          messages={messages} 
          onSendMessage={handleSendMessage} 
        />
      )}
      {currentView === ViewState.PROGRESS && (
        <Progress 
          routines={routines} 
          emotions={emotions} 
          contacts={contacts}
          messages={messages}
        />
      )}
    </Layout>
  );
};

export default App;
