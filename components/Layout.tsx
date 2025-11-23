import React from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, MessageCircle, TrendingUp, LogOut } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  setView: (view: ViewState) => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, setView, onLogout }) => {
  return (
    <div className="min-h-screen flex flex-col max-w-2xl mx-auto bg-white/50 shadow-2xl overflow-hidden relative">
      {/* Top Bar */}
      <header className="bg-white/80 backdrop-blur-md p-4 sticky top-0 z-20 flex justify-between items-center shadow-sm">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-teal-400 bg-clip-text text-transparent">
          Neuro Assist
        </h1>
        <button onClick={onLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
            <LogOut size={20} />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 scroll-smooth">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-6 left-6 right-6 bg-white rounded-full shadow-xl border border-slate-100 p-2 flex justify-around items-center z-30">
        <NavButton 
          active={currentView === ViewState.DASHBOARD} 
          onClick={() => setView(ViewState.DASHBOARD)} 
          icon={<LayoutDashboard size={24} />} 
          label="My Day" 
        />
        <NavButton 
          active={currentView === ViewState.CHATS} 
          onClick={() => setView(ViewState.CHATS)} 
          icon={<MessageCircle size={24} />} 
          label="Therapist" 
        />
        <NavButton 
          active={currentView === ViewState.PROGRESS} 
          onClick={() => setView(ViewState.PROGRESS)} 
          icon={<TrendingUp size={24} />} 
          label="Progress" 
        />
      </nav>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-16 h-16 rounded-full transition-all duration-300 ${
      active 
        ? 'bg-blue-500 text-white shadow-lg -translate-y-2 scale-110' 
        : 'text-slate-400 hover:bg-slate-50'
    }`}
  >
    {icon}
    <span className="text-[10px] font-medium mt-1">{label}</span>
  </button>
);

export default Layout;