
import React, { useState, useMemo } from 'react';
import { AuditLogEntry, User, UserRole } from '../types';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { SearchIcon } from './icons/SearchIcon';

interface AdminDashboardProps {
    logs: AuditLogEntry[];
    users: User[];
    onBackup: () => void;
    logAuditEvent: (action: string, details?: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ logs, users, onBackup, logAuditEvent }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [userFilter, setUserFilter] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

    const uniqueActions = useMemo(() => Array.from(new Set(logs.map(log => log.action))), [logs]);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchesUser = userFilter === '' || log.user.toLowerCase().includes(userFilter.toLowerCase());
            const matchesAction = actionFilter === '' || log.action === actionFilter;
            
            // Role Filter Logic: Find the user object by username, then check role
            let matchesRole = true;
            if (roleFilter !== 'all') {
                const userObj = users.find(u => u.username === log.user);
                matchesRole = userObj ? userObj.role === roleFilter : false;
            }

            let matchesDate = true;
            if (startDate) {
                matchesDate = matchesDate && log.timestamp >= new Date(startDate);
            }
            if (endDate) {
                // Set to end of day
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                matchesDate = matchesDate && log.timestamp <= end;
            }

            return matchesUser && matchesAction && matchesDate && matchesRole;
        });
    }, [logs, userFilter, actionFilter, startDate, endDate, roleFilter, users]);

    const handleExport = () => {
        logAuditEvent('Audit Log Exported', `Filters: User=${userFilter || 'All'}, Role=${roleFilter}, Action=${actionFilter || 'All'}, Range=${startDate || 'Start'}-${endDate || 'End'}. Records: ${filteredLogs.length}`);
        
        const timestamp = new Date().toISOString();
        let csvContent = "";
        // Header (BR-S5-A-02)
        csvContent += `# Export Generated: ${timestamp}\n`;
        csvContent += `# Filter User: ${userFilter || 'All'}\n`;
        csvContent += `# Filter Role: ${roleFilter}\n`;
        csvContent += `# Filter Action: ${actionFilter || 'All'}\n`;
        csvContent += `# Date Range: ${startDate || 'Start'} to ${endDate || 'End'}\n`;
        csvContent += "ID,Timestamp,User,Action,Details\n";
        
        const csvData = filteredLogs.map(log => {
            const details = `"${(log.details || '').replace(/"/g, '""')}"`;
            return [log.id, log.timestamp.toISOString(), log.user, log.action, details].join(',');
        }).join('\n');
        
        // Footer (BR-S5-A-02)
        const footer = `\n# End of Report - Generated: ${timestamp}`;

        const blob = new Blob([csvContent + csvData + footer], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `pulsepoint_audit_log_${timestamp.split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Admin Dashboard</h1>
                <div className="flex gap-4">
                    <button 
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out"
                    >
                        <DownloadIcon /> Export CSV
                    </button>
                    <button 
                        onClick={onBackup}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out"
                    >
                        <ShieldCheckIcon /> Perform System Backup
                    </button>
                </div>
            </header>

            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">System Audit Log</h2>
                
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date Range</label>
                        <div className="flex gap-2">
                             <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full text-sm p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" />
                             <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full text-sm p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User Search</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon className="h-4 w-4 text-gray-400" /></span>
                            <input type="text" placeholder="Username..." value={userFilter} onChange={e => setUserFilter(e.target.value)} className="w-full pl-9 p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User Role</label>
                        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as UserRole | 'all')} className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                            <option value="all">All Roles</option>
                            {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Action Type</label>
                        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                            <option value="">All Actions</option>
                            {uniqueActions.map(action => <option key={action} value={action}>{action}</option>)}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button onClick={() => { setStartDate(''); setEndDate(''); setUserFilter(''); setActionFilter(''); setRoleFilter('all'); }} className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-2">Clear Filters</button>
                    </div>
                </div>

                <div className="overflow-y-auto h-[60vh]">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Timestamp</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">User</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Action</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Details</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredLogs.map(log => (
                                <tr key={log.id}>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{log.timestamp.toLocaleString()}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{log.user}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{log.action}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{log.details || 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {filteredLogs.length === 0 && (
                        <div className="text-center py-16">
                            <p className="text-gray-500 dark:text-gray-400">No audit events match your filters.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
