
import React, { useState } from 'react';
import { ChatContact, ChatMessage } from '../types';
import { Video, Phone, ArrowLeft, Send, FileText, BellRing, Stethoscope, Headset, User as UserIcon, MessageSquare } from 'lucide-react';

interface ChatProps {
  contacts: ChatContact[];
  messages: Record<string, ChatMessage[]>;
  onSendMessage: (contactId: string, text: string) => void;
}

const Chat: React.FC<ChatProps> = ({ contacts, messages, onSendMessage }) => {
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [inputText, setInputText] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedContact) return;

    onSendMessage(selectedContact.id, inputText);
    setInputText('');
  };

  // Fixed: Updated getRoleIcon to accept size parameter to avoid React.cloneElement type issues
  const getRoleIcon = (role: string, size: number = 24) => {
    switch (role) {
      case 'Therapist': return <Stethoscope size={size} />;
      case 'Support': return <Headset size={size} />;
      case 'Parent': return <UserIcon size={size} />;
      default: return <UserIcon size={size} />;
    }
  };

  const getRoleStyles = (role: string) => {
      switch (role) {
        case 'Therapist': return 'bg-blue-100 text-blue-600';
        case 'Support': return 'bg-orange-100 text-orange-600';
        case 'Parent': return 'bg-purple-100 text-purple-600';
        default: return 'bg-slate-100 text-slate-600';
      }
  };

  // --- View: Contact List ---
  if (!selectedContact) {
    return (
      <div className="p-6 bg-slate-50 min-h-full pb-24">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Therapist & Support</h2>
        <p className="text-slate-500 mb-6 text-sm">Connect with your care team for feedback and reminders.</p>
        
        <div className="space-y-4">
          {contacts.filter(c => c.role === 'Therapist' || c.role === 'Support').map((contact) => (
            <div 
              key={contact.id} 
              onClick={() => setSelectedContact(contact)}
              className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer border border-slate-100 group"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  {/* Role Icon Avatar */}
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getRoleStyles(contact.role)} shadow-sm group-hover:scale-105 transition-transform`}>
                     {/* Fixed: Pass size directly to getRoleIcon */}
                     {getRoleIcon(contact.role, 28)}
                  </div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-lg text-slate-800">{contact.name}</h3>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getRoleStyles(contact.role)} bg-opacity-10 flex-shrink-0 ml-2`}>
                      {contact.role}
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm flex items-center gap-1">
                    {contact.role === 'Support' ? <BellRing size={14} className="shrink-0" /> : <FileText size={14} className="shrink-0" />}
                    <span className="truncate">
                      {messages[contact.id]?.slice(-1)[0]?.text || "No messages yet"}
                    </span>
                  </p>
                </div>
                
                <div className="text-slate-300 pl-2">
                  <ArrowLeft size={24} className="rotate-180" />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 space-y-4">
            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-start gap-4">
            <div className="bg-blue-100 p-2 rounded-full text-blue-600 mt-1">
                <MessageSquare size={24} />
            </div>
            <div>
                <h3 className="font-bold text-blue-900 mb-1">Therapist Feedback</h3>
                <p className="text-blue-700 text-sm leading-relaxed">
                Therapists evaluate your daily progress reports and will send constructive feedback here.
                </p>
            </div>
            </div>

            <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 flex items-start gap-4">
            <div className="bg-orange-100 p-2 rounded-full text-orange-600 mt-1">
                <BellRing size={24} />
            </div>
            <div>
                <h3 className="font-bold text-orange-900 mb-1">Support Reminders</h3>
                <p className="text-orange-700 text-sm leading-relaxed">
                The Support Team will send timely reminders for activities, hydration, and breaks to help keep the day on track.
                </p>
            </div>
            </div>
        </div>
      </div>
    );
  }

  // --- View: Conversation ---
  const chatHistory = messages[selectedContact.id] || [];

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] bg-slate-50">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm flex items-center gap-3 z-10 sticky top-0">
        <button onClick={() => setSelectedContact(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
          <ArrowLeft size={24} />
        </button>
        <div className="relative">
           <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRoleStyles(selectedContact.role)}`}>
              {/* Fixed: Pass size directly to getRoleIcon */}
              {getRoleIcon(selectedContact.role, 20)}
           </div>
           <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800">{selectedContact.name}</h3>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            {selectedContact.role === 'Support' ? 'Support Team' : 'Therapist'} • Online
          </p>
        </div>
        <div className="flex gap-2 text-blue-500">
           <button className="p-2 hover:bg-blue-50 rounded-full"><Phone size={20}/></button>
           <button className="p-2 hover:bg-blue-50 rounded-full"><Video size={20}/></button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {chatHistory.length === 0 && (
          <div className="text-center text-slate-400 mt-10">
            <p>No messages yet.</p>
          </div>
        )}
        
        {chatHistory.map((msg) => {
          const isMe = msg.senderId === 'me';
          const isFeedback = msg.type === 'feedback';

          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              
              {/* Avatar Icon for other person */}
              {!isMe && (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 mt-1 self-start ${getRoleStyles(selectedContact.role)} shadow-sm`}>
                    {/* Fixed: Pass size directly to getRoleIcon */}
                    {getRoleIcon(selectedContact.role, 16)}
                </div>
              )}

              <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm relative ${
                isMe 
                  ? 'bg-blue-500 text-white rounded-tr-none' 
                  : isFeedback 
                    ? 'bg-white border-2 border-yellow-200 rounded-tl-none'
                    : 'bg-white border border-slate-100 rounded-tl-none'
              }`}>
                {/* Special Header for Feedback */}
                {isFeedback && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                    <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      <FileText size={12} /> FEEDBACK
                    </span>
                  </div>
                )}

                <p className={`text-sm leading-relaxed ${!isMe && isFeedback ? 'text-slate-700 font-medium' : ''} ${!isMe && !isFeedback ? 'text-slate-600' : ''}`}>
                  {msg.text}
                </p>
                <span className={`text-[10px] block mt-1 opacity-70 ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100 mb-14">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
           <input 
             type="text" 
             value={inputText}
             onChange={(e) => setInputText(e.target.value)}
             placeholder="Type a message..."
             className="flex-1 bg-slate-100 text-slate-800 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all placeholder:text-slate-400"
           />
           <button 
             type="submit" 
             disabled={!inputText.trim()}
             className={`p-3 rounded-full transition-all flex-shrink-0 ${inputText.trim() ? 'bg-blue-500 text-white shadow-lg hover:bg-blue-600 transform hover:scale-105' : 'bg-slate-200 text-slate-400'}`}
           >
             <Send size={20} />
           </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
