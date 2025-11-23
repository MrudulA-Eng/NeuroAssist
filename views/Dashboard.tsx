
import React, { useState, useEffect } from 'react';
import { DashboardMode, RoutineItem, EmotionItem, ChatContact, QuestionItem } from '../types';
import { Mic, Plus, ArrowRight, ArrowLeft, ChevronDown, Check, X, Stethoscope, Trophy, Save, Loader2 } from 'lucide-react';
import { analyzeVoiceIntent, generateDailyQuestions, generateTherapistFeedback } from '../services/gemini';

interface DashboardProps {
  routines: RoutineItem[];
  emotions: EmotionItem[];
  contacts: ChatContact[];
  selectedTherapistId: string | null;
  setSelectedTherapistId: (id: string) => void;
  // New handlers replacing direct setters
  onAddRoutine: (label: string, emoji: string) => void;
  onToggleRoutine: (id: string, completed: boolean) => void;
  onAddEmotion: (label: string, emoji: string) => void;
  onDayComplete: (therapistId: string, feedback: string, points: number) => void;
}

const ROUTINE_EMOJIS = ["🦷", "🛌", "🚿", "👕", "🍳", "🥪", "🍽️", "🏫", "🚌", "📝", "🎮", "💊", "📚", "🎨", "⚽", "🧩", "🚶"];
const EMOTION_EMOJIS = [
  "😊", "😃", "🤣", "😌", "🧘", "😢", "😠", "😨", "😴", "🤢", "🤯", "😐", "🤩", "🥰", "🥳", "😎", "🥺", "😰", "😤", "🏳️"
];

const Dashboard: React.FC<DashboardProps> = ({ 
  routines, 
  emotions, 
  contacts,
  selectedTherapistId,
  setSelectedTherapistId,
  onAddRoutine,
  onToggleRoutine,
  onAddEmotion,
  onDayComplete
}) => {
  // View States
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isDaySubmitted, setIsDaySubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<DashboardMode>(DashboardMode.ROUTINE);
  
  // Data States
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [isListening, setIsListening] = useState(false);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(ROUTINE_EMOJIS[0]);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  // Stats
  const totalRoutines = routines.length;
  const completedRoutines = routines.filter(r => r.completed).length;
  const progressPercent = totalRoutines === 0 ? 0 : (completedRoutines / totalRoutines) * 100;
  const therapists = contacts.filter(c => c.role === 'Therapist');
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  useEffect(() => {
    if (selectedTherapistId && isSetupComplete && questions.length === 0) {
      const loadQuestions = async () => {
        const qs = await generateDailyQuestions();
        setQuestions(qs);
      };
      loadQuestions();
    }
  }, [selectedTherapistId, isSetupComplete]);

  const handleStartDay = () => {
    if (selectedTherapistId) {
      setIsSetupComplete(true);
    }
  };

  const handleFinishDay = async () => {
    if (!selectedTherapistId) return;
    setIsSubmitting(true);
    const feedbackResult = await generateTherapistFeedback(routines, emotions, questions);
    onDayComplete(selectedTherapistId, feedbackResult.text, feedbackResult.points);
    setIsSubmitting(false);
    setIsDaySubmitted(true);
  };

  const updateQuestionAnswer = (id: string, answer: string) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, answer } : q));
  };

  const handleOpenAddModal = (questionId?: string) => {
    if (questionId) {
       setActiveQuestionId(questionId);
       const q = questions.find(qu => qu.id === questionId);
       setNewItemText(q?.answer || '');
    } else {
       setActiveQuestionId(null);
       setNewItemText('');
       setSelectedEmoji(mode === DashboardMode.ROUTINE ? ROUTINE_EMOJIS[0] : EMOTION_EMOJIS[0]);
    }
    setShowAddModal(true);
  };

  const handleSaveItem = () => {
    if (!newItemText.trim()) return;
    
    if (activeQuestionId) {
      updateQuestionAnswer(activeQuestionId, newItemText);
    } else if (mode === DashboardMode.ROUTINE) {
      onAddRoutine(newItemText, selectedEmoji);
    } else {
      onAddEmotion(newItemText, selectedEmoji);
    }
    setShowAddModal(false);
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Browser does not support speech recognition.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      
      if (showAddModal) {
          setNewItemText(prev => prev + " " + transcript);
          return;
      }

      const analysis = await analyzeVoiceIntent(transcript);
      
      if (analysis.intent === 'ADD_ROUTINE' && analysis.label) {
        onAddRoutine(analysis.label, analysis.emoji || '✨');
      } else if (analysis.intent === 'ADD_EMOTION' && analysis.label) {
        onAddEmotion(analysis.label, analysis.emoji || '😊');
        setMode(DashboardMode.EMOTION); 
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  if (isDaySubmitted) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-green-50 to-teal-100 text-center animate-fadeIn">
        <div className="w-32 h-32 bg-yellow-400 rounded-full flex items-center justify-center mb-6 shadow-xl animate-bounce">
           <Trophy size={64} className="text-white" />
        </div>
        <h2 className="text-4xl font-bold text-teal-800 mb-4">Congratulations!</h2>
        <p className="text-xl text-teal-700 font-medium mb-8">
          You finished your daily activities! <br/> Your therapist has received your update.
        </p>
        <button 
          onClick={() => setIsDaySubmitted(false)}
          className="bg-white text-teal-600 px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transition-all"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!selectedTherapistId || !isSetupComplete) {
    return (
      <div className="h-full flex flex-col p-6 bg-slate-50">
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
           <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                  <Stethoscope size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Parent Setup</h2>
                  <p className="text-slate-500 text-sm">Prepare the day for your child</p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Select Therapist</label>
                  <div className="relative">
                    <select 
                      value={selectedTherapistId || ''}
                      onChange={(e) => setSelectedTherapistId(e.target.value)}
                      className="w-full appearance-none bg-slate-50 border-2 border-slate-200 text-slate-700 py-4 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-blue-400 font-bold transition-all"
                    >
                      <option value="" disabled>-- Select a Therapist --</option>
                      {therapists.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500"><ChevronDown size={20} /></div>
                  </div>
                </div>
                <button 
                  onClick={handleStartDay}
                  disabled={!selectedTherapistId}
                  className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all ${selectedTherapistId ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                >
                  Start My Day <ArrowRight size={20} />
                </button>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-full transition-colors duration-500 pb-20 ${mode === DashboardMode.ROUTINE ? 'bg-sky-50' : 'bg-blue-50'}`}>
      <div className="px-6 pt-6">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold flex items-center justify-center gap-2 text-slate-800">
            {mode === DashboardMode.ROUTINE ? '🗓️ My Day' : '😜 How I Feel'}
          </h2>
          <p className="text-slate-500 font-medium mt-1 text-sm">{currentDate}</p>
          {mode === DashboardMode.ROUTINE && (
            <div className="mt-4 max-w-sm mx-auto">
              <p className="text-slate-400 text-xs mb-1 font-semibold tracking-wider uppercase">Progress: {completedRoutines} / {totalRoutines}</p>
              <div className="h-4 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-teal-400 to-blue-500 transition-all duration-700 ease-out" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-center mb-6 sticky top-20 z-10">
          <button 
            onClick={handleVoiceInput}
            className={`relative group flex items-center gap-3 px-8 py-3 rounded-full shadow-lg border-2 border-white transition-all duration-300 transform hover:scale-105 active:scale-95 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-slate-800'}`}
          >
            <div className={`p-2 rounded-full ${isListening ? 'bg-white/20' : 'bg-slate-100'}`}><Mic size={24} className={isListening ? 'text-white' : 'text-slate-600'} /></div>
            <span className="text-xl font-bold tracking-wide">{isListening ? 'Listening...' : 'Speak'}</span>
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 mb-8">
          {mode === DashboardMode.ROUTINE ? (
            <>
              <button onClick={() => handleOpenAddModal()} className="bg-orange-200 hover:bg-orange-300 text-orange-800 px-6 py-2 rounded-full font-bold shadow-sm flex items-center gap-2 transition-colors active:scale-95"><Plus size={18} /> Add Routine</button>
              <button onClick={() => setMode(DashboardMode.EMOTION)} className="bg-sky-200 hover:bg-sky-300 text-sky-800 px-6 py-2 rounded-full font-bold shadow-sm flex items-center gap-2 transition-colors active:scale-95">Go to Feelings <ArrowRight size={18} /></button>
            </>
          ) : (
            <>
              <button onClick={() => setMode(DashboardMode.ROUTINE)} className="bg-sky-200 hover:bg-sky-300 text-sky-800 px-6 py-2 rounded-full font-bold shadow-sm flex items-center gap-2 transition-colors active:scale-95"><ArrowLeft size={18} /> Back to My Day</button>
              <button onClick={() => handleOpenAddModal()} className="bg-orange-200 hover:bg-orange-300 text-orange-800 px-6 py-2 rounded-full font-bold shadow-sm flex items-center gap-2 transition-colors active:scale-95"><Plus size={18} /> Add Emotion</button>
            </>
          )}
        </div>

        {mode === DashboardMode.ROUTINE && questions.length > 0 && (
           <div className="mb-8">
              <h3 className="text-slate-600 font-bold mb-3 uppercase text-xs tracking-wider ml-1">Daily Check-in</h3>
              <div className="space-y-3">
                {questions.map(q => (
                  <div key={q.id} onClick={() => handleOpenAddModal(q.id)} className={`bg-white rounded-2xl p-4 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-all flex items-center gap-4 ${q.answer ? 'border-green-300 bg-green-50' : ''}`}>
                     <div className="text-3xl">{q.emoji}</div>
                     <div className="flex-1">
                        <p className="font-bold text-slate-700 text-sm mb-1">{q.text}</p>
                        <p className={`text-sm ${q.answer ? 'text-green-700 font-medium' : 'text-slate-400 italic'}`}>{q.answer || "Tap to answer..."}</p>
                     </div>
                     {q.answer && <div className="bg-green-200 text-green-700 p-1 rounded-full"><Check size={16}/></div>}
                  </div>
                ))}
              </div>
           </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-12">
          {mode === DashboardMode.ROUTINE ? (
            routines.map((routine) => (
              <div key={routine.id} onClick={() => onToggleRoutine(routine.id, !routine.completed)} className={`aspect-square rounded-3xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm cursor-pointer transition-all duration-300 ${routine.completed ? 'bg-green-100 border-2 border-green-200 opacity-60 scale-95' : 'bg-white border-2 border-white hover:border-blue-200 hover:-translate-y-1 hover:shadow-md'}`}>
                <div className="text-4xl filter drop-shadow-sm">{routine.emoji}</div>
                <span className={`font-bold text-lg text-center leading-tight ${routine.completed ? 'line-through text-green-700' : 'text-slate-700'}`}>{routine.label}</span>
              </div>
            ))
          ) : (
            emotions.map((emotion) => (
              <div key={emotion.id} className="aspect-square bg-white rounded-3xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm border-2 border-white hover:border-pink-200 hover:-translate-y-1 hover:shadow-md transition-all duration-300 cursor-pointer">
                <div className="text-5xl filter drop-shadow-sm animate-pulse">{emotion.emoji}</div>
                <span className="font-bold text-lg text-center text-slate-700">{emotion.label}</span>
                <span className="text-xs text-slate-400">{new Date(emotion.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            ))
          )}
        </div>

        <div className="pb-10">
          <button onClick={handleFinishDay} disabled={isSubmitting} className={`w-full bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 text-lg transform transition-all active:scale-95 ${isSubmitting ? 'opacity-75 cursor-wait' : ''}`}>
             {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={24} />} 
             {isSubmitting ? 'Analyzing Day...' : 'Finish Daily Activities'}
          </button>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden transform transition-all scale-100">
            <div className="bg-slate-50 p-4 flex justify-between items-center border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">{activeQuestionId ? 'Answer Question' : (mode === DashboardMode.ROUTINE ? 'Add Routine' : 'Add Emotion')}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
            </div>
            <div className="p-6">
              {activeQuestionId && <div className="mb-4 bg-yellow-50 p-3 rounded-xl border border-yellow-100 text-slate-700 font-medium italic">"{questions.find(q => q.id === activeQuestionId)?.text}"</div>}
              <div className="mb-4">
                <div className="relative">
                  <input type="text" value={newItemText} onChange={(e) => setNewItemText(e.target.value)} placeholder={activeQuestionId ? "Type your answer..." : (mode === DashboardMode.ROUTINE ? "e.g. Brush Teeth" : "e.g. Excited")} className="w-full text-lg p-3 pr-12 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-400 focus:outline-none font-medium" autoFocus />
                  <button onClick={handleVoiceInput} className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-slate-200 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}><Mic size={20} /></button>
                </div>
              </div>
              {!activeQuestionId && (
                <div className="mb-6">
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Pick an Icon</label>
                   <div className="grid grid-cols-6 gap-2">
                     {(mode === DashboardMode.ROUTINE ? ROUTINE_EMOJIS : EMOTION_EMOJIS).map(emoji => (
                       <button key={emoji} onClick={() => setSelectedEmoji(emoji)} className={`text-2xl p-2 rounded-lg transition-all ${selectedEmoji === emoji ? 'bg-blue-100 scale-110 shadow-sm' : 'hover:bg-slate-50'}`}>{emoji}</button>
                     ))}
                   </div>
                </div>
              )}
              <button onClick={handleSaveItem} disabled={!newItemText.trim()} className={`w-full py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all ${newItemText.trim() ? 'bg-gradient-to-r from-blue-500 to-teal-400 text-white hover:shadow-blue-500/30' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}><Check size={20} />{activeQuestionId ? 'Submit Answer' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
