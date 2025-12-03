import React, { useMemo, useState } from 'react';
import { EmergencyCall } from '../types';
import { ReportIcon } from './icons/ReportIcon';
import { GoogleGenAI } from "@google/genai";
import { SparklesIcon } from './icons/SparklesIcon';

interface EODReportModalProps {
    calls: EmergencyCall[];
    onClose: () => void;
}

const EODReportModal: React.FC<EODReportModalProps> = ({ calls, onClose }) => {
    const [aiInsights, setAiInsights] = useState('');
    const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

    const todaysCalls = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return calls.filter(c => c.timestamp >= today);
    }, [calls]);

    const reportStats = useMemo(() => {
        const dispatchedToday = todaysCalls.filter(c => c.dispatchTimestamp);

        const priorityCounts = todaysCalls.reduce((acc, call) => {
            acc[call.priority] = (acc[call.priority] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        let totalDispatchSec = 0;
        dispatchedToday.forEach(call => {
            totalDispatchSec += (call.dispatchTimestamp!.getTime() - call.timestamp.getTime()) / 1000;
        });

        const avgDispatchMin = dispatchedToday.length > 0 ? (totalDispatchSec / dispatchedToday.length / 60).toFixed(1) : '0.0';

        return {
            totalCalls: todaysCalls.length,
            priorityCounts,
            avgDispatchMin,
        };
    }, [todaysCalls]);

    const handleGenerateInsights = async () => {
        if (todaysCalls.length === 0) {
            setAiInsights("No calls today to analyze.");
            return;
        }
        setIsGeneratingInsights(true);
        setAiInsights('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const callDataSummary = todaysCalls.map(c => 
                `Call at ${c.timestamp.toLocaleTimeString()} to ${c.location} for "${c.description}", Priority ${c.priority}, Status ${c.status}.`
            ).join('\n');
    
            const response = await ai.models.generateContent({
                model: "gemini-2.5-pro",
                contents: `You are an EMS operations analyst. Analyze the following call data for the day and provide a brief summary with 2-3 key insights. Look for trends, geographic clusters of incidents, unusual patterns in call types or priorities, and suggest one operational improvement. Keep the response concise and in markdown format. Data:\n${callDataSummary}`
            });
    
            setAiInsights(response.text);
    
        } catch (error) {
            console.error("Error generating insights:", error);
            setAiInsights("Error: Could not generate insights.");
        } finally {
            setIsGeneratingInsights(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-md">
                <div className="flex items-center gap-3 mb-4 border-b dark:border-gray-700 pb-3">
                    <ReportIcon className="h-6 w-6 text-blue-500" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">End of Day Report</h3>
                </div>
                
                <div className="space-y-4 text-gray-800 dark:text-gray-200">
                    <div className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-700/50 rounded-md">
                        <span className="font-semibold">Total Calls Today:</span>
                        <span className="text-2xl font-bold">{reportStats.totalCalls}</span>
                    </div>
                     <div className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-md">
                        <h4 className="font-semibold mb-2">Calls by Priority:</h4>
                        <div className="flex justify-around text-center">
                            <div>
                                <p className="text-xl font-bold text-red-500">{reportStats.priorityCounts[1] || 0}</p>
                                <p className="text-xs">P1</p>
                            </div>
                             <div>
                                <p className="text-xl font-bold text-yellow-500">{reportStats.priorityCounts[2] || 0}</p>
                                <p className="text-xs">P2</p>
                            </div>
                             <div>
                                <p className="text-xl font-bold text-blue-500">{reportStats.priorityCounts[3] || 0}</p>
                                <p className="text-xs">P3</p>
                            </div>
                             <div>
                                <p className="text-xl font-bold text-green-500">{reportStats.priorityCounts[4] || 0}</p>
                                <p className="text-xs">P4</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-700/50 rounded-md">
                        <span className="font-semibold">Avg. Dispatch Time:</span>
                        <span className="text-xl font-bold">{reportStats.avgDispatchMin} min</span>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t dark:border-gray-600">
                    <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">AI-Powered Insights</h4>
                        <button type="button" onClick={handleGenerateInsights} disabled={isGeneratingInsights} className="flex items-center gap-1 text-xs bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-1 px-2 rounded-md shadow-sm transition-colors disabled:opacity-50">
                            {isGeneratingInsights ? <SparklesIcon className="h-3 w-3 animate-spin"/> : <SparklesIcon className="h-3 w-3" />}
                            {isGeneratingInsights ? 'Analyzing...' : 'Analyze'}
                        </button>
                    </div>
                    {isGeneratingInsights && <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-2">Generating analysis...</p>}
                    {aiInsights && (
                        <div className="mt-2 p-3 text-sm bg-gray-50 dark:bg-gray-700/40 rounded-md text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {aiInsights}
                        </div>
                    )}
                </div>

                <div className="flex justify-end mt-6">
                    <button onClick={onClose} className="py-2 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition">Close</button>
                </div>
            </div>
        </div>
    );
};

export default EODReportModal;