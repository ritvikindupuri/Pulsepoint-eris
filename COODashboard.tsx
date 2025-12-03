
import React, { useMemo, useEffect, useRef, useState } from 'react';
import { EmergencyCall, CallStatus, BaseStation, Team, Priority } from './types';
import { ClockIcon } from './components/icons/ClockIcon';
import { CheckCircleIcon } from './components/icons/CheckCircleIcon';
import { DownloadIcon } from './components/icons/DownloadIcon';

interface COODashboardProps {
  calls: EmergencyCall[];
  teams: Team[];
  isDarkMode: boolean;
  logAuditEvent: (action: string, details?: string) => void;
}

type DateFilter = '7d' | '30d' | 'all';

const SLAMinutes = 15; // Target response time in minutes

const COODashboard: React.FC<COODashboardProps> = ({ calls, teams, isDarkMode, logAuditEvent }) => {
    const complianceChartRef = useRef<HTMLCanvasElement>(null);
    const priorityChartRef = useRef<HTMLCanvasElement>(null);
    const complianceChartInstance = useRef<any>(null);
    const priorityChartInstance = useRef<any>(null);

    const [dateFilter, setDateFilter] = useState<DateFilter>('30d');
    const [stationFilter, setStationFilter] = useState<BaseStation | 'all'>('all');

    const filteredCalls = useMemo(() => {
        const now = new Date();
        const dateCutoff = new Date();
        if (dateFilter === '7d') dateCutoff.setDate(now.getDate() - 7);
        if (dateFilter === '30d') dateCutoff.setDate(now.getDate() - 30);
        
        return calls.filter(c => {
            const isCompleted = c.status === CallStatus.COMPLETED && c.dispatchTimestamp && c.onSceneTimestamp && c.completedTimestamp;
            if (!isCompleted) return false;

            const callDate = c.timestamp;
            if (dateFilter !== 'all' && callDate < dateCutoff) return false;

            if (stationFilter !== 'all') {
                const team = teams.find(t => t.id === c.assignedTeamId);
                if (!team || team.baseStation !== stationFilter) return false;
            }
            return true;
        });
    }, [calls, teams, dateFilter, stationFilter]);

    const slaStats = useMemo(() => {
        if (filteredCalls.length === 0) {
            return {
                avgDispatchMin: '0.0',
                avgOnSceneMin: '0.0',
                avgTotalResponseMin: '0.0',
                slaCompliance: '0.0',
                totalCompleted: 0,
            };
        }

        let totalDispatchSec = 0, totalOnSceneSec = 0, totalResponseSec = 0, compliantCount = 0;

        filteredCalls.forEach(call => {
            const totalTime = (call.onSceneTimestamp!.getTime() - call.timestamp.getTime()) / 1000;
            totalDispatchSec += (call.dispatchTimestamp!.getTime() - call.timestamp.getTime()) / 1000;
            totalOnSceneSec += (call.onSceneTimestamp!.getTime() - call.dispatchTimestamp!.getTime()) / 1000;
            totalResponseSec += totalTime;
            if (totalTime / 60 <= SLAMinutes) compliantCount++;
        });
        
        const total = filteredCalls.length;
        return {
            avgDispatchMin: (totalDispatchSec / total / 60).toFixed(1),
            avgOnSceneMin: (totalOnSceneSec / total / 60).toFixed(1),
            avgTotalResponseMin: (totalResponseSec / total / 60).toFixed(1),
            slaCompliance: (compliantCount / total * 100).toFixed(1),
            totalCompleted: total,
        };
    }, [filteredCalls]);

    const handleExportSLA = () => {
        logAuditEvent('SLA Data Exported', `Filters: date=${dateFilter}, station=${stationFilter}. Records: ${filteredCalls.length}`);
        let csvContent = "";
        csvContent += `# Report Generated: ${new Date().toISOString()}\n`;
        csvContent += `# Date Filter: ${dateFilter}\n`;
        csvContent += `# Station Filter: ${stationFilter}\n`;
        csvContent += "Call ID,Timestamp,Dispatch Timestamp,On-Scene Timestamp,Total Response Time (sec),Response Time (min),Met SLA\n";
        
        const csvData = filteredCalls.map(call => {
            const totalTimeSec = (call.onSceneTimestamp!.getTime() - call.timestamp.getTime()) / 1000;
            const metSLA = (totalTimeSec / 60) <= SLAMinutes;
            return [call.id, call.timestamp.toISOString(), call.dispatchTimestamp!.toISOString(), call.onSceneTimestamp!.toISOString(), totalTimeSec.toFixed(0), (totalTimeSec / 60).toFixed(2), metSLA ? 'Yes' : 'No'].join(',');
        }).join('\n');

        const blob = new Blob([csvContent + csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `pulsepoint_sla_data_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Effect for Compliance Chart
    useEffect(() => {
        if (!complianceChartRef.current) return;
        if (complianceChartInstance.current) complianceChartInstance.current.destroy();
        const ctx = complianceChartRef.current.getContext('2d');
        if (!ctx) return;
        
        complianceChartInstance.current = new (window as any).Chart(ctx, {
            type: 'bar', data: { labels: ['SLA Performance'], datasets: [{ label: `Met SLA (< ${SLAMinutes} min)`, data: [parseFloat(slaStats.slaCompliance)], backgroundColor: '#10B981', borderRadius: 4 }, { label: 'Missed SLA', data: [100 - parseFloat(slaStats.slaCompliance)], backgroundColor: '#EF4444', borderRadius: 4 }] },
            options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true, max: 100, ticks: { color: isDarkMode ? '#9CA3AF' : '#6B7280', callback: (v) => `${v}%` }, grid: { color: isDarkMode ? '#374151' : '#E5E7EB' } }, y: { stacked: true, ticks: { color: isDarkMode ? '#9CA3AF' : '#6B7280' }, grid: { display: false } } }, plugins: { legend: { position: 'bottom', labels: { color: isDarkMode ? '#D1D5DB' : '#4B5563' } }, tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${c.raw.toFixed(1)}%` } } } }
        });
    }, [slaStats, isDarkMode]);

    // Effect for Priority Breakdown Chart
    useEffect(() => {
        if (!priorityChartRef.current) return;
        if (priorityChartInstance.current) priorityChartInstance.current.destroy();
        const ctx = priorityChartRef.current.getContext('2d');
        if (!ctx) return;
        
        const priorities: Priority[] = [1, 2, 3, 4];
        const metData = priorities.map(p => filteredCalls.filter(c => c.priority === p && ((c.onSceneTimestamp!.getTime() - c.timestamp.getTime()) / 60000) <= SLAMinutes).length);
        const missedData = priorities.map(p => filteredCalls.filter(c => c.priority === p && ((c.onSceneTimestamp!.getTime() - c.timestamp.getTime()) / 60000) > SLAMinutes).length);

        priorityChartInstance.current = new (window as any).Chart(ctx, {
            type: 'bar', data: { labels: ['Priority 1', 'Priority 2', 'Priority 3', 'Priority 4'], datasets: [{ label: 'Met SLA', data: metData, backgroundColor: '#10B981', borderRadius: 4 }, { label: 'Missed SLA', data: missedData, backgroundColor: '#EF4444', borderRadius: 4 }] },
            options: { responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true, ticks: { color: isDarkMode ? '#9CA3AF' : '#6B7280' }, grid: { display: false } }, y: { stacked: true, beginAtZero: true, ticks: { color: isDarkMode ? '#9CA3AF' : '#6B7280', precision: 0 }, grid: { color: isDarkMode ? '#374151' : '#E5E7EB' } } }, plugins: { legend: { position: 'bottom', labels: { color: isDarkMode ? '#D1D5DB' : '#4B5563' } }, tooltip: { mode: 'index' } } }
        });
    }, [filteredCalls, isDarkMode]);


    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <header className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">COO Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Service Level Agreement (SLA) Performance Overview</p>
                </div>
                <button onClick={handleExportSLA} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out self-start md:self-center">
                    <DownloadIcon /> Export CSV
                </button>
            </header>

            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 mb-8 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Date Range:</span>
                    <FilterButton label="7 Days" value="7d" active={dateFilter} onClick={setDateFilter} />
                    <FilterButton label="30 Days" value="30d" active={dateFilter} onClick={setDateFilter} />
                    <FilterButton label="All Time" value="all" active={dateFilter} onClick={setDateFilter} />
                </div>
                 <div className="flex items-center gap-2">
                    <label htmlFor="stationFilter" className="font-semibold text-gray-700 dark:text-gray-300">Base Station:</label>
                    <select id="stationFilter" value={stationFilter} onChange={e => setStationFilter(e.target.value as BaseStation | 'all')} className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 h-full text-sm">
                        <option value="all">All Stations</option>
                        {(['North', 'South', 'East', 'West'] as BaseStation[]).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard icon={<ClockIcon />} title="Avg. Dispatch Time" value={`${slaStats.avgDispatchMin} min`} tooltip="Time from call creation to team dispatch." />
                <StatCard icon={<ClockIcon />} title="Avg. On-Scene Time" value={`${slaStats.avgOnSceneMin} min`} tooltip="Time from dispatch to arrival at scene." />
                <StatCard icon={<ClockIcon />} title="Avg. Total Response" value={`${slaStats.avgTotalResponseMin} min`} tooltip="Time from call creation to arrival at scene." />
                <StatCard icon={<CheckCircleIcon />} title="SLA Compliance" value={`${slaStats.slaCompliance}%`} tooltip={`Percentage of calls where total response time was <= ${SLAMinutes} minutes.`} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Response Time SLA Compliance ({SLAMinutes} min target)</h2>
                    <div className="h-40 relative">
                        {filteredCalls.length > 0 ? <canvas ref={complianceChartRef}></canvas> : <NoDataMessage />}
                    </div>
                </div>
                 <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">SLA Compliance by Priority</h2>
                    <div className="h-40 relative">
                        {filteredCalls.length > 0 ? <canvas ref={priorityChartRef}></canvas> : <NoDataMessage />}
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<{icon: React.ReactNode; title: string; value: string | number; tooltip: string}> = ({icon, title, value, tooltip}) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex items-center gap-4" title={tooltip}>
        <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full text-blue-500">{icon}</div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
    </div>
);

const FilterButton: React.FC<{ label: string; value: DateFilter, active: DateFilter, onClick: (v: DateFilter) => void }> = ({ label, value, active, onClick}) => (
    <button onClick={() => onClick(value)} className={`px-3 py-1 text-sm rounded-md transition ${active === value ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
        {label}
    </button>
)

const NoDataMessage = () => (
    <div className="flex items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
        <p>No completed calls match the selected filters.</p>
    </div>
);

export default COODashboard;
