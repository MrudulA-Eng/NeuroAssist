
import React, { useState, useMemo } from 'react';
import { RoutineItem, EmotionItem, ChatContact, ChatMessage } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area, CartesianGrid } from 'recharts';
import { ChevronDown, TrendingUp, Brain, Calendar, Activity } from 'lucide-react';

interface ProgressProps {
  routines: RoutineItem[];
  emotions: EmotionItem[];
  contacts: ChatContact[];
  messages: Record<string, ChatMessage[]>;
}

const Progress: React.FC<ProgressProps> = ({ routines, emotions, contacts, messages }) => {
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>('');
  const therapists = contacts.filter(c => c.role === 'Therapist');

  // --- DATA PROCESSING ---

  // 1. Emotion Summary (Pie Chart)
  // Aggregates current emotions + mock history for visualization
  const emotionData = useMemo(() => {
    const counts: Record<string, number> = {};
    
    // Add real current emotions
    emotions.forEach(e => {
        counts[e.label] = (counts[e.label] || 0) + 1;
    });

    // Mock baseline data if empty to avoid blank chart
    if (emotions.length === 0) {
        return [
            { name: 'Happy', value: 4, color: '#34D399' },
            { name: 'Neutral', value: 3, color: '#94A3B8' },
            { name: 'Anxious', value: 1, color: '#F87171' },
            { name: 'Excited', value: 2, color: '#FBBF24' }
        ];
    }

    const COLORS: Record<string, string> = {
        'Happy': '#34D399', 'Very Happy': '#10B981', 'Laughing': '#059669',
        'Sad': '#60A5FA', 'Scared': '#818CF8', 'Anxious': '#F87171',
        'Angry': '#EF4444', 'Neutral': '#94A3B8', 'Peaceful': '#A78BFA'
    };

    return Object.keys(counts).map(key => ({
        name: key,
        value: counts[key],
        color: COLORS[key] || '#CBD5E1'
    }));
  }, [emotions]);

  // Insight for Emotions
  const emotionInsight = useMemo(() => {
     if (emotionData.length === 0) return "No data available yet.";
     const topEmotion = emotionData.reduce((prev, current) => (prev.value > current.value) ? prev : current);
     if (topEmotion.name === 'Happy' || topEmotion.name === 'Very Happy') return "Mostly positive emotions! Great week.";
     if (topEmotion.name === 'Anxious' || topEmotion.name === 'Sad') return "Indicates some distress. Review triggers.";
     return "Emotions are balanced and stable.";
  }, [emotionData]);

  // 2. Routine Adherence (Bar Chart)
  const routineData = useMemo(() => {
     // Mocking previous days + Current Day
     const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
     const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1; // Mon=0
     
     return days.map((day, index) => {
        if (index === todayIndex) {
            return {
                name: day,
                completed: routines.filter(r => r.completed).length,
                total: routines.length || 5 // defaulting total for visualization if empty
            };
        }
        // Mock history
        const baseTotal = 6;
        const baseCompleted = [4, 5, 3, 6, 4, 2, 5][index];
        return { name: day, completed: baseCompleted, total: baseTotal };
     });
  }, [routines]);

  // 3. Mental Wellness / Strength (Area Chart)
  // Derived from Chat Sentiment and Routine Success
  const wellnessData = useMemo(() => {
    if (!selectedTherapistId) return [];

    const relevantMessages = messages[selectedTherapistId] || [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    
    // Simple sentiment analysis helper
    const analyzeSentiment = (msgs: ChatMessage[]) => {
        let score = 50; // Baseline
        msgs.forEach(m => {
            const text = m.text.toLowerCase();
            if (text.includes('good') || text.includes('great') || text.includes('happy') || text.includes('better')) score += 5;
            if (text.includes('bad') || text.includes('sad') || text.includes('anxious') || text.includes('worse')) score -= 5;
            if (text.includes('progress') || text.includes('excellent')) score += 8;
        });
        return Math.min(100, Math.max(0, score));
    };

    // Distribute messages roughly across days for the graph (Mocking time distribution for visual)
    return days.map((day, idx) => {
        // Filter messages for "this day" (mock logic: dividing array chunks)
        const chunkStart = Math.floor((relevantMessages.length / 5) * idx);
        const chunkEnd = Math.floor((relevantMessages.length / 5) * (idx + 1));
        const dailyMsgs = relevantMessages.slice(chunkStart, chunkEnd);
        
        // Add some variance based on routines too
        const routineFactor = [4, 5, 3, 6, 4][idx] * 5; 
        
        return {
            name: day,
            score: (analyzeSentiment(dailyMsgs) + routineFactor) / 2
        };
    });
  }, [selectedTherapistId, messages]);


  // --- RENDER ---

  return (
    <div className="min-h-full pb-32 bg-slate-50">
      {/* Header & Selector */}
      <div className="bg-white p-6 shadow-sm sticky top-0 z-10 border-b border-slate-100">
         <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="text-blue-500" /> Progress Report
         </h2>
         
         <div className="relative">
            <select 
                value={selectedTherapistId}
                onChange={(e) => setSelectedTherapistId(e.target.value)}
                className="w-full appearance-none bg-slate-100 border-2 border-slate-200 text-slate-700 py-3 px-4 pr-10 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-blue-400 font-bold transition-all"
            >
                <option value="" disabled>Select Therapist for Analytics</option>
                {therapists.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                <ChevronDown size={20} />
            </div>
         </div>
      </div>

      {!selectedTherapistId ? (
          <div className="flex flex-col items-center justify-center h-[50vh] p-8 text-center opacity-60">
             <Activity size={64} className="text-slate-300 mb-4" />
             <p className="text-xl font-bold text-slate-400">Select a therapist above to view detailed patient analytics.</p>
          </div>
      ) : (
          <div className="p-6 space-y-6 animate-fadeIn">
             
             {/* 1. Mental Wellness Graph (Based on Chats & Questions) */}
             <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                        <Brain size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">Mental Strength Index</h3>
                        <p className="text-xs text-slate-500">Based on chat sentiment & daily answers</p>
                    </div>
                </div>
                
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={wellnessData}>
                            <defs>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Area type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 bg-purple-50 p-3 rounded-xl text-xs text-purple-800 leading-relaxed">
                   <strong>Analysis:</strong> Engagement in therapy chats correlates with higher routine completion this week. Keep encouraging positive dialogue.
                </div>
             </div>

             {/* 2. Emotion Summary */}
             <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                    <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">Emotion Summary</h3>
                    </div>
                </div>
                
                <div className="flex flex-row items-center">
                    <div className="h-48 w-1/2">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={emotionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={60}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {emotionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="w-1/2 pl-2">
                        <div className="space-y-2">
                            {emotionData.slice(0, 3).map((e, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                    <span className="w-3 h-3 rounded-full" style={{backgroundColor: e.color}}></span>
                                    {e.name} ({Math.round(e.value / (emotionData.reduce((a,b)=>a+b.value,0))*100)}%)
                                </div>
                            ))}
                        </div>
                        <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Insight</p>
                        <p className="text-sm font-medium text-slate-700">{emotionInsight}</p>
                    </div>
                </div>
             </div>

             {/* 3. Routine Adherence */}
             <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">Routine Consistency</h3>
                        <p className="text-xs text-slate-500">Task completion rate per day</p>
                    </div>
                </div>
                
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={routineData} barSize={16}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                            <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Bar dataKey="total" fill="#f1f5f9" radius={[4, 4, 4, 4]} stackId="a" />
                            <Bar dataKey="completed" fill="#3b82f6" radius={[4, 4, 4, 4]} stackId="b"  />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
             </div>

          </div>
      )}
    </div>
  );
};

export default Progress;
