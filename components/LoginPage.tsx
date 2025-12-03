import React, { useState } from 'react';
import { UserIcon } from './icons/UserIcon';
import { LockIcon } from './icons/LockIcon';
import { AlertIcon } from './icons/AlertIcon';
import { Logo } from './icons/Logo';
import { SparklesIcon } from './icons/SparklesIcon';
import { UserRole } from '../types';

interface LoginPageProps {
  onLogin: (username: string, password_unused: string) => boolean;
  onNavigateToSignUp: () => void;
}

const DEMO_ACCOUNTS = [
    { role: UserRole.DISPATCHER, username: 'dispatch1', password: 'password', description: 'Logs calls and manages units on a live map.' },
    { role: UserRole.EMT, username: 'emt1', password: 'password', description: 'Views assigned incidents and files patient reports.' },
    { role: UserRole.SUPERVISOR, username: 'supervisor1', password: 'password', description: 'Manages team rosters and weekly schedules.' },
    { role: UserRole.COO, username: 'coo1', password: 'password', description: 'Views executive SLA dashboards and performance.' },
    { role: UserRole.ADMIN, username: 'admin1', password: 'password', description: 'Audits system logs and performs backups.' },
];

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onNavigateToSignUp }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
        setError('Username and password are required.');
        return;
    }
    const success = onLogin(username, password);
    if (!success) {
      setError('Invalid username or password.');
    }
  };

  const handlePopulateDemoCreds = (demoUser: string, demoPass: string) => {
    setUsername(demoUser);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 py-12">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
            <Logo className="h-12 w-auto mx-auto text-red-600"/>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-4">PulsePoint ERIS</h1>
            <p className="text-gray-500 dark:text-gray-400">Emergency Response Information System</p>
        </div>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex items-center" role="alert">
            <AlertIcon />
            <span className="block sm:inline ml-2">{error}</span>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="username">
              Username
            </label>
            <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                </span>
                <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(''); }}
                    className="shadow appearance-none border rounded w-full py-2 px-3 pl-10 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Username"
                    required
                />
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <LockIcon className="h-5 w-5 text-gray-400" />
                </span>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    className="shadow appearance-none border rounded w-full py-2 px-3 pl-10 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                    required
                />
            </div>
          </div>
          <div className="flex items-center justify-between mb-4">
            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 ease-in-out"
            >
              Sign In
            </button>
          </div>
        </form>
         <div className="text-center mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <button onClick={onNavigateToSignUp} className="font-medium text-blue-600 hover:text-blue-500">
                    Sign Up
                </button>
            </p>
        </div>
        
        <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or</span>
            </div>
        </div>

        <div className="text-center">
             <h3 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center justify-center gap-2">
                <SparklesIcon className="h-5 w-5 text-indigo-400" />
                Use a Demo Account
            </h3>
             <div className="space-y-2">
                {DEMO_ACCOUNTS.map(({ role, username, password, description }) => (
                    <button
                        key={role}
                        type="button"
                        onClick={() => handlePopulateDemoCreds(username, password)}
                        title={description}
                        className="w-full text-left p-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <p className="font-bold text-indigo-600 dark:text-indigo-400">Log in as {role}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            <span className="font-semibold">User:</span> {username} / <span className="font-semibold">Pass:</span> {password}
                        </p>
                    </button>
                ))}
             </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;