import React, { useEffect, useRef } from 'react';
import { EmergencyCall, CallStatus } from '../types';

interface CallAnalyticsChartsProps {
    calls: EmergencyCall[];
    isDarkMode: boolean;
}

const CallAnalyticsCharts: React.FC<CallAnalyticsChartsProps> = ({ calls, isDarkMode }) => {
    const statusChartRef = useRef<HTMLCanvasElement>(null);
    const priorityChartRef = useRef<HTMLCanvasElement>(null);
    const statusChartInstance = useRef<any>(null);
    const priorityChartInstance = useRef<any>(null);

    useEffect(() => {
        if (!statusChartRef.current || !priorityChartRef.current) return;

        // Destroy previous charts
        if (statusChartInstance.current) statusChartInstance.current.destroy();
        if (priorityChartInstance.current) priorityChartInstance.current.destroy();

        const statusCtx = statusChartRef.current.getContext('2d');
        const priorityCtx = priorityChartRef.current.getContext('2d');
        if (!statusCtx || !priorityCtx) return;

        // Status Chart Data
        const statusCounts = calls.reduce((acc, call) => {
            acc[call.status] = (acc[call.status] || 0) + 1;
            return acc;
        }, {} as Record<CallStatus, number>);

        const statusLabels = Object.values(CallStatus);
        const statusData = statusLabels.map(status => statusCounts[status] || 0);

        statusChartInstance.current = new (window as any).Chart(statusCtx, {
            type: 'pie',
            data: {
                labels: statusLabels,
                datasets: [{
                    label: 'Call Status',
                    data: statusData,
                    backgroundColor: ['#FBBF24', '#60A5FA', '#34D399', '#A78BFA', '#4ADE80', '#9CA3AF'],
                    borderColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                    borderWidth: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        position: 'right',
                        labels: {
                            color: isDarkMode ? '#D1D5DB' : '#4B5563',
                            boxWidth: 12,
                        }
                     },
                },
            }
        });

        // Priority Chart Data
        const priorityCounts = calls.reduce((acc, call) => {
            acc[call.priority-1] = (acc[call.priority-1] || 0) + 1;
            return acc;
        }, [] as number[]);

        priorityChartInstance.current = new (window as any).Chart(priorityCtx, {
            type: 'bar',
            data: {
                labels: ['Priority 1', 'Priority 2', 'Priority 3', 'Priority 4'],
                datasets: [{
                    label: 'Calls by Priority',
                    data: priorityCounts,
                    backgroundColor: ['#EF4444', '#F59E0B', '#3B82F6', '#10B981'],
                    borderRadius: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { 
                        beginAtZero: true,
                        ticks: { color: isDarkMode ? '#9CA3AF' : '#6B7280', precision: 0 },
                        grid: { color: isDarkMode ? '#374151' : '#E5E7EB' }
                    },
                    x: {
                        ticks: { color: isDarkMode ? '#9CA3AF' : '#6B7280' },
                        grid: { display: false }
                    }
                }
            }
        });

    }, [calls, isDarkMode]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-64">
            <div className="relative">
                <canvas ref={statusChartRef}></canvas>
            </div>
            <div className="relative">
                <canvas ref={priorityChartRef}></canvas>
            </div>
        </div>
    );
};

export default CallAnalyticsCharts;