import React from 'react';
import { Home, Calendar, Bell, User, Flame } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', icon: Home, label: '홈' },
  { to: '/urgent-sales', icon: Flame, label: '급매' },
  { to: '/calendar', icon: Calendar, label: '청약' },
  { to: '/notifications', icon: Bell, label: '알림' },
  { to: '/profile', icon: User, label: '프로필' },
];

const BottomNav = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="grid grid-cols-5 py-2 max-w-md mx-auto">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center py-2 ${
                isActive ? 'text-blue-500' : 'text-gray-400'
              }`
            }
          >
            <item.icon className="w-6 h-6 mb-1" />
            <span className="text-xs">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;
