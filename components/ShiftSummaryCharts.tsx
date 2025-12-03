
import React, { useEffect, useRef } from 'react';
import { EmergencyCall } from '../types';

interface ShiftSummaryChartsProps {
    completedCalls: EmergencyCall[];
    isDarkMode: boolean;
}

const ShiftSummaryCharts: React.FC<ShiftSummaryChartsProps> = ({ completedCalls, isDarkMode }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    useEffect(() => {
        if (!chartRef.current) return;

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;

        const priorityCounts = completedCalls.reduce((acc, call) => {
            const priorityIndex = call.priority - 1;
            acc[priorityIndex] = (acc[priorityIndex] || 0) + 1;
            return acc;
        }, [0, 0, 0, 0] as number[]);
        
        const hasData = priorityCounts.some(count => count > 0);

        chartInstance.current = new (window as any).Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Priority 1', 'Priority 2', 'Priority 3', 'Priority 4'],
                datasets: [{
                    label: 'Calls by Priority',
                    data: priorityCounts,
                    backgroundColor: ['#EF4444', '#F59E0B', '#3B82F6', '#10B981'],
                    borderColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                    borderWidth: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: isDarkMode ? '#D1D5DB' : '#4B5563',
                            boxWidth: 12,
                        }
                    },
                    tooltip: {
                        enabled: hasData,
                    },
                },
                cutout: '60%',
            }
        });

    }, [completedCalls, isDarkMode]);
    
    const hasCalls = completedCalls.length > 0;

    return (
        <div className="h-48 relative flex items-center justify-center">
            {hasCalls ? (
                 <canvas ref={chartRef}></canvas>
            ) : (
                <div className="text-center text-gray-500 dark:text-gray-400">
                    <p>No completed calls yet for this shift.</p>
                </div>
            )}
        </div>
    );
};

export default ShiftSummaryCharts;
