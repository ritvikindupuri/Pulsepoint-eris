import React, { useEffect, useRef } from 'react';
import { EmergencyCall, BaseStation, Team } from '../types';

interface DemandReportProps {
    calls: EmergencyCall[];
    teams: Team[];
    isDarkMode: boolean;
}

const DemandReport: React.FC<DemandReportProps> = ({ calls, teams, isDarkMode }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    useEffect(() => {
        if (!chartRef.current) return;

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;

        const baseStations: BaseStation[] = ['North', 'South', 'East', 'West'];
        
        const stationCounts = calls.reduce((acc, call) => {
            const assignedTeam = teams.find(t => t.id === call.assignedTeamId);
            // If team is assigned, use its base station. Otherwise, fall back to simulation.
            const station = assignedTeam ? assignedTeam.baseStation : baseStations[call.id % 4];
            acc[station] = (acc[station] || 0) + 1;
            return acc;
        }, {} as Record<BaseStation, number>);

        chartInstance.current = new (window as any).Chart(ctx, {
            type: 'bar',
            data: {
                labels: baseStations,
                datasets: [{
                    label: 'Calls',
                    data: baseStations.map(station => stationCounts[station] || 0),
                    backgroundColor: '#6366F1',
                    borderColor: isDarkMode ? '#374151' : '#FFFFFF',
                    borderWidth: 2,
                    borderRadius: 4,
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        ticks: { color: isDarkMode ? '#9CA3AF' : '#6B7280' },
                        grid: { display: false }
                    },
                    x: {
                        beginAtZero: true,
                        ticks: { color: isDarkMode ? '#9CA3AF' : '#6B7280', precision: 0 },
                        grid: { color: isDarkMode ? '#374151' : '#E5E7EB' }
                    }
                }
            }
        });

    }, [calls, teams, isDarkMode]);

    return (
        <div className="h-48 relative">
            <canvas ref={chartRef}></canvas>
        </div>
    );
};

export default DemandReport;