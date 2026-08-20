import React from 'react';

type PlayerTab = 'profile' | 'diet' | 'calendar' | 'bodyComposition';

interface BottomNavBarProps {
  activeTab: PlayerTab;
  onTabChange: (tab: PlayerTab) => void;
}

const NavItem: React.FC<{
  label: string;
  // FIX: Replaced JSX.Element with React.ReactElement to resolve namespace issue.
  // FIX: Explicitly set props generic to <any> to allow cloning with className.
  icon: React.ReactElement<any>;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => {
  const activeColor = 'text-blue-400';
  const inactiveColor = 'text-gray-400';
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ease-in-out focus:outline-none ${isActive ? activeColor : inactiveColor} hover:text-blue-300`}
      aria-label={label}
    >
      {React.cloneElement(icon, { className: `w-6 h-6 mb-1` })}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
};

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onTabChange }) => {
  // FIX: Replaced JSX.Element with React.ReactElement to resolve namespace issue.
  // FIX: Explicitly set props generic to <any> to allow cloning with className.
  const navItems: { tab: PlayerTab; label: string; icon: React.ReactElement<any> }[] = [
    {
      tab: 'profile',
      label: '프로필',
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>,
    },
    {
      tab: 'diet',
      label: '식단',
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>,
    },
    {
      tab: 'calendar',
      label: '캘린더',
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0h18" /></svg>,
    },
    {
      tab: 'bodyComposition',
      label: '통계',
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" /></svg>,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-gray-800 border-t border-gray-700 shadow-lg flex z-40">
      {navItems.map(item => (
        <NavItem
          key={item.tab}
          label={item.label}
          icon={item.icon}
          isActive={activeTab === item.tab}
          onClick={() => onTabChange(item.tab)}
        />
      ))}
    </nav>
  );
};

export default BottomNavBar;