import React from 'react';
import { Home, MessageSquare, CheckSquare, Clapperboard, Layers } from 'lucide-react';
import { ActiveTab } from '../../types.js';

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  pendingApprovalsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  pendingApprovalsCount = 0,
}) => {
  const tabs = [
    { id: 'home' as ActiveTab, label: 'Home', icon: Home },
    { id: 'chat' as ActiveTab, label: 'Assistant', icon: MessageSquare },
    { id: 'planner' as ActiveTab, label: 'Planner', icon: CheckSquare, badge: pendingApprovalsCount },
    { id: 'studio' as ActiveTab, label: 'Studio', icon: Clapperboard },
    { id: 'hub' as ActiveTab, label: 'OS Hub', icon: Layers },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 safe-area-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex flex-col items-center justify-center min-w-[60px] py-1.5 px-2 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'text-cyan-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 font-normal'
              }`}
              style={{ minHeight: '48px' }}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-cyan-400' : ''}`} />
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className="absolute -top-1 -right-2 flex items-center justify-center w-4 h-4 text-[9px] font-bold text-white bg-rose-500 rounded-full ring-2 ring-slate-950">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] tracking-tight mt-1 leading-none">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 w-6 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
