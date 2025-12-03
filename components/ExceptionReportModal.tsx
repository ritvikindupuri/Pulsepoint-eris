
import React, { useState, useEffect } from 'react';
import { EmergencyCall, Team } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';
import { AlertIcon } from './icons/AlertIcon';
import { GoogleGenAI } from "@google/genai";
import { SparklesIcon } from './icons/SparklesIcon';

interface ExceptionReportModalProps {
    openIncidents: EmergencyCall[];
    teams: Team[];
    onClose: () => void;
}

const ExceptionReportModal: React.FC<ExceptionReportModalProps> = ({ openIncidents, teams, onClose }) => {
    const [handoverSummary, setHandoverSummary] = useState('');
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    
    const calculateAge = (timestamp: Date): string => {
        const diffMs = new Date().getTime() - timestamp.getTime();
        const diffMins = Math.round(diffMs / 60000);
        if (diffMins < 60) return `${diffMins}m`;
        const diffHours = (diffMins / 60).toFixed(1);
        return `${diffHours}h`;
    }

    const handleGenerateSummary = async () => {
        if (openIncidents.length === 0) {
            setHandoverSummary("No open incidents for summary.");
            return;
        }
        setIsGeneratingSummary(true);
        setHandoverSummary('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const incidentDataSummary = openIncidents.map(c => {
                const teamName = teams.find(t => t.id === c.assignedTeamId)?.name || 'Unassigned';
                return `- P${c.priority} at ${c.location} (${c.status}) assigned to ${teamName}. Age: ${calculateAge(c.timestamp)}. Desc: ${c.description}`;
            }).join('\n');
    
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `You are a shift supervisor for an EMS team. Based on the following list of open incidents, write a brief, actionable handover summary for the next shift supervisor. Use bullet points. Highlight high-priority calls and any calls that have been open for a long time.\n\nIncidents:\n${incidentDataSummary}`
            });
    
            setHandoverSummary(response.text);
        } catch (error) {
            console.error("Error generating summary:", error);
            setHandoverSummary("Error: Could not generate summary.");
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    useEffect(() => {
        handleGenerateSummary();
    }, []);
    
    const handleExportExceptions = () => {
        const headers = "ID,Priority,Status,Location,Description,Timestamp,Assigned Team\n";
        const csvData = openIncidents.map(c => {
            const teamName = teams.find(t => t.id === c.assignedTeamId)?.name || 'N/A';
            const description = `"${c.description.replace(/"/g, '""')}"`;
            return [c.id, c.priority, c.status, c.location, description, c.timestamp.toISOString(), teamName].join(',');
        }).join('\n');
        const blob = new Blob([headers + csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `pulsepoint_open_incidents_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-2xl">
                <div className="flex items-center gap-3 mb-4 border-b dark:border-gray-700 pb-3">
                    <AlertIcon className="h-6 w-6 text-red-500" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Shift Handover: Exception Report</h3>
                </div>

                <div className="mb-4">
                    <div className="flex gap-2">
                        <button type="button" onClick={handleGenerateSummary} disabled={isGeneratingSummary || openIncidents.length === 0} className="w-full flex items-center justify-center gap-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-3 rounded-md shadow-sm transition-colors disabled:opacity-50">
                            <SparklesIcon className="h-4 w-4" />
                            {isGeneratingSummary ? 'Generating...' : 'Regenerate Summary'}
                        </button>
                    </div>
                    {isGeneratingSummary && !handoverSummary && <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">Generating AI summary...</p>}
                    {handoverSummary && (
                        <div className="mt-3 p-3 text-sm bg-indigo-50 dark:bg-gray-700 rounded-md text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            <h4 className="font-bold mb-1">AI Summary:</h4>
                            {handoverSummary}
                        </div>
                    )}
                </div>
                
                <div className="space-y-4 my-4 max-h-[50vh] overflow-y-auto pr-2">
                    {openIncidents.length > 0 ? openIncidents.map(call => (
                         <div key={call.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                            <div className="flex justify-between items-start">
                                <p className="font-semibold text-gray-800 dark:text-gray-100">{call.location} <span className="text-xs font-normal text-gray-500">(P{call.priority})</span></p>
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Age: {calculateAge(call.timestamp)}</span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <span>Status: <span className="font-semibold">{call.status}</span></span>
                                <span className="mx-2">|</span>
                                <span>Team: <span className="font-semibold">{teams.find(t => t.id === call.assignedTeamId)?.name || 'Unassigned'}</span></span>
                            </div>
                        </div>
                    )) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8">No open incidents to report.</p>
                    )}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="py-2 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100 font-bold rounded-md transition">Close</button>
                    <button onClick={handleExportExceptions} className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md transition flex items-center gap-2">
                        <DownloadIcon /> Export as CSV
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExceptionReportModal;