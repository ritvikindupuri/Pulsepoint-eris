
import React from 'react';
import { User } from '../types';
import { Logo } from './icons/Logo';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { WifiIcon } from './icons/WifiIcon';
import { WifiOffIcon } from './icons/WifiOffIcon';

interface NavBarProps {
  user: User;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isOnline: boolean;
  onToggleOnline: () => void;
}

const NavBar: React.FC<NavBarProps> = ({ user, onLogout, isDarkMode, onToggleDarkMode, isOnline, onToggleOnline }) => {
  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <div className="flex items-center">
            <Logo className="h-8 w-8 text-red-600 mr-2" />
            <span className="text-xl font-semibold text-gray-700 dark:text-gray-200">PulsePoint ERIS</span>
        </div>
        <div className="flex items-center">
          <span className="text-gray-700 dark:text-gray-300 mr-4">Welcome, {user.username} ({user.role})</span>
          <button 
            onClick={onToggleOnline} 
            title={isOnline ? 'Simulate Offline' : 'Simulate Online'}
            className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none mr-4 ${isOnline ? 'text-green-500' : 'text-red-500'}`}
          >
            {isOnline ? <WifiIcon className="h-5 w-5" /> : <WifiOffIcon className="h-5 w-5" />}
          </button>
          <button onClick={onToggleDarkMode} className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none mr-4">
            {isDarkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </button>
          <button
            onClick={onLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-300"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;