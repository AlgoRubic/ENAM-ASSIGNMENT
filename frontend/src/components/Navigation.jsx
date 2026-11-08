import React from 'react';
import { Zap, Terminal, Scale, MessageSquareCode } from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'push', label: 'Push Feed', icon: Zap, badge: 'Live' },
    { id: 'pull', label: 'Terminal', icon: Terminal, badge: '8 Modules' },
    { id: 'audit', label: 'Audit', icon: Scale, badge: 'Promises' },
    { id: 'copilot', label: 'Copilot', icon: MessageSquareCode, badge: 'AI' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#090d16]/95 backdrop-blur-2xl border-t border-gray-800/80 px-4 py-2 pb-5 md:pb-2">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400"></span>
                )}
              </div>
              <span className={`text-[11px] font-semibold tracking-tight mt-1 ${isActive ? 'text-white' : 'text-gray-400'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
