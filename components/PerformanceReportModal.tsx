import React, { useMemo } from 'react';
import { EmergencyCall, Team, CallStatus } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';
import { AnalyticsIcon } from './icons/AnalyticsIcon';

interface PerformanceReportModalProps {
    calls: EmergencyCall[];
    teams: Team[];
    onClose: () => void;
}

const PerformanceReportModal: React.FC<PerformanceReportModalProps> = ({ calls, teams, onClose }) => {

    const performanceData = useMemo(() => {
        return teams.map(team => {
            const completedCalls = calls.filter(c => 
                c.assignedTeamId === team.id &&
                c.status === CallStatus.COMPLETED &&
                c.dispatchTimestamp &&
                c.onSceneTimestamp &&
                c.completedTimestamp
            );

            if (completedCalls.length === 0) {
                return {
                    teamName: team.name,
                    callsCompleted: 0,
                    avgDispatchMin: 'N/A',
                    avgOnSceneMin: 'N/A',
                    avgTotalResponseMin: 'N/A',
                };
            }

            let totalDispatchSec = 0;
            let totalOnSceneSec = 0;
            let totalResponseSec = 0;

            completedCalls.forEach(call => {
                totalDispatchSec += (call.dispatchTimestamp!.getTime() - call.timestamp.getTime()) / 1000;
                totalOnSceneSec += (call.onSceneTimestamp!.getTime() - call.dispatchTimestamp!.getTime()) / 1000;
                totalResponseSec += (call.onSceneTimestamp!.getTime() - call.timestamp.getTime()) / 1000;
            });

            const total = completedCalls.length;
            return {
                teamName: team.name,
                callsCompleted: total,
                avgDispatchMin: (totalDispatchSec / total / 60).toFixed(1),
                avgOnSceneMin: (totalOnSceneSec / total / 60).toFixed(1),
                avgTotalResponseMin: (totalResponseSec / total / 60).toFixed(1),
            };
        });
    }, [calls, teams]);

    const handleExport = () => {
        const headers = "Team,Calls Completed,Avg Dispatch (min),Avg On Scene (min),Avg Total Response (min)\n";
        const csvData = performanceData.map(d =>
            [d.teamName, d.callsCompleted, d.avgDispatchMin, d.avgOnSceneMin, d.avgTotalResponseMin].join(',')
        ).join('\n');

        const blob = new Blob([headers + csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `pulsepoint_performance_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-3xl">
                <div className="flex justify-between items-center mb-4 border-b dark:border-gray-700 pb-3">
                    <div className="flex items-center gap-3">
                        <AnalyticsIcon className="h-6 w-6 text-blue-500" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Team Performance Report</h3>
                    </div>
                    <button onClick={handleExport} className="flex items-center gap-2 text-sm bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-3 rounded-md shadow-sm transition-colors">
                        <DownloadIcon /> Export CSV
                    </button>
                </div>
                
                <div className="overflow-x-auto max-h-[60vh]">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Team</th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300">Calls Completed</th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300">Avg. Dispatch</th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300">Avg. On Scene</th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300">Avg. Total Response</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {performanceData.map(data => (
                                <tr key={data.teamName}>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{data.teamName}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-300">{data.callsCompleted}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-300">{data.avgDispatchMin} min</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-300">{data.avgOnSceneMin} min</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-300">{data.avgTotalResponseMin} min</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end mt-6">
                    <button onClick={onClose} className="py-2 px-6 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition">Close</button>
                </div>
            </div>
        </div>
    );
};

export default PerformanceReportModal;