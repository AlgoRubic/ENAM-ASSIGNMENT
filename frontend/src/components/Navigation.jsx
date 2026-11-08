import React from 'react';
import { Newspaper, LineChart, Scale, Compass } from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'push', label: 'Push', icon: Newspaper },
    { id: 'pull', label: 'Terminal', icon: LineChart },
    { id: 'audit', label: 'Audit', icon: Scale },
    { id: 'copilot', label: 'Research', icon: Compass },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/85 backdrop-blur-2xl border-t border-white/[0.08] px-6 py-2 pb-6 md:pb-2">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-4 rounded-xl transition-all duration-150 active:scale-95 ${
                isActive ? 'text-white' : 'text-[#86868b] hover:text-[#d1d1d6]'
              }`}
            >
              <Icon 
                className={`w-[21px] h-[21px] transition-transform duration-150 ${
                  isActive ? 'stroke-[2.2px]' : 'stroke-[1.6px]'
                }`} 
              />
              <span className={`text-[10px] tracking-tight mt-1 ${
                isActive ? 'font-semibold text-white' : 'font-medium text-[#86868b]'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
