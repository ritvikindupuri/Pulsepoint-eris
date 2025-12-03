


import React, { useMemo } from 'react';
import { EmergencyCall, CallStatus, User, Team, PatientCareRecord, EmtStatus } from '../types';
import { MapPinIcon } from './icons/MapPinIcon';
import { FileTextIcon } from './icons/FileTextIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import ShiftSummaryCharts from './ShiftSummaryCharts';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { AlertIcon } from './icons/AlertIcon';
import { WifiOffIcon } from './icons/WifiOffIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ClockIcon } from './icons/ClockIcon';

interface EmtDashboardProps {
  user: User;
  calls: EmergencyCall[];
  teams: Team[];
  pcrs: PatientCareRecord[];
  onFilePCR: (call: EmergencyCall) => void;
  onUpdateCallStatus: (callId: number, status: CallStatus, teamId: number) => void;
  onUpdateUserStatus: (userId: number, status: EmtStatus) => void;
  isDarkMode: boolean;
  isOnline: boolean;
}

const getPriorityClass = (priority: number) => {
  switch (priority) {
    case 1: return { border: 'border-red-500', bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-800 dark:text-red-200' };
    case 2: return { border: 'border-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/50', text: 'text-yellow-800 dark:text-yellow-200' };
    case 3: return { border: 'border-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-800 dark:text-blue-200' };
    case 4: return { border: 'border-green-500', bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-800 dark:text-green-200' };
    default: return { border: 'border-gray-500', bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-200' };
  }
};

const EmtDashboard: React.FC<EmtDashboardProps> = ({ user, calls, teams, pcrs, onFilePCR, onUpdateCallStatus, onUpdateUserStatus, isDarkMode, isOnline }) => {
  
  const myTeam = useMemo(() => teams.find(t => t.id === user.teamId), [teams, user.teamId]);
  
  const assignedCall = useMemo(() => {
    if (!myTeam) return null;
    return calls.find(call => call.assignedTeamId === myTeam.id && call.status !== CallStatus.PENDING && call.status !== CallStatus.COMPLETED && call.status !== CallStatus.CANCELLED);
  }, [calls, myTeam]);

  const completedCallsToday = useMemo(() => {
    if(!myTeam) return [];
    const today = new Date();
    today.setHours(0,0,0,0);
    return calls.filter(c => c.assignedTeamId === myTeam.id && c.status === CallStatus.COMPLETED && c.timestamp >= today);
  }, [calls, myTeam]);
  
  const unsyncedPcrCount = useMemo(() => {
      const myTeamCallIds = new Set(calls.filter(c => c.assignedTeamId === user.teamId).map(c => c.id));
      return pcrs.filter(p => !p.isSynced && myTeamCallIds.has(p.callId)).length;
  }, [pcrs, calls, user.teamId]);

  const priorityClass = assignedCall ? getPriorityClass(assignedCall.priority) : getPriorityClass(0);

  const handleClockIn = () => onUpdateUserStatus(user.id, EmtStatus.ON_DUTY);
  const handleClockOut = () => onUpdateUserStatus(user.id, EmtStatus.OFF_DUTY);

  if (user.status === EmtStatus.OFF_DUTY) {
    return (
        <div className="container mx-auto p-8 text-center">
            <div className="bg-white dark:bg-gray-800 p-10 rounded-lg shadow-xl max-w-md mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Clocked Out</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">You are currently off duty. Clock in to see your assignments.</p>
                <button 
                    onClick={handleClockIn}
                    className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out text-lg"
                >
                    Request Clock-In
                </button>
            </div>
        </div>
    )
  }

  if (user.status === EmtStatus.PENDING_CLOCK_IN || user.status === EmtStatus.PENDING_CLOCK_OUT) {
      return (
        <div className="container mx-auto p-8 text-center">
            <div className="bg-white dark:bg-gray-800 p-10 rounded-lg shadow-xl max-w-md mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Request Pending</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Your {user.status === EmtStatus.PENDING_CLOCK_IN ? 'Clock-In' : 'Clock-Out'} request is awaiting supervisor approval.
                </p>
                <div className="mt-6 text-blue-500 animate-pulse">
                    <ClockIcon className="h-12 w-12 mx-auto" />
                </div>
            </div>
        </div>
      )
  }


  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <header className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                {myTeam ? `${myTeam.name} Dashboard` : 'EMT Dashboard'}
            </h1>
            <button 
                onClick={handleClockOut}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out"
            >
                Request Clock-Out
            </button>
        </header>

        {!isOnline && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
                <p className="font-bold flex items-center gap-2"><span><WifiOffIcon className="h-5 w-5"/></span> You are currently offline.</p>
                <p>New Patient Care Records will be saved locally and synced when you reconnect.</p>
            </div>
        )}
        {isOnline && unsyncedPcrCount > 0 && (
             <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6" role="alert">
                <p className="font-bold">Syncing in progress...</p>
                <p>{unsyncedPcrCount} locally saved record(s) are being synced to the server.</p>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Current Assignment */}
            <div className="lg:col-span-2">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Current Assignment</h2>
                {assignedCall && myTeam ? (
                    <div className={`bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden border-l-8 ${priorityClass.border}`}>
                        <div className={`p-6 ${priorityClass.bg}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className={`text-2xl font-bold ${priorityClass.text}`}>{assignedCall.location}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
                                        <span><MapPinIcon className="h-4 w-4" /></span>
                                        {assignedCall.callerName} - {assignedCall.phone}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold text-lg px-3 py-1 rounded-full ${priorityClass.bg} ${priorityClass.text}`}>Priority {assignedCall.priority}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{assignedCall.timestamp.toLocaleString()}</p>
                                </div>
                            </div>
                            <p className="mt-4 text-gray-700 dark:text-gray-300">{assignedCall.description}</p>
                            {assignedCall.notes && assignedCall.notes.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-400/30">
                                    <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200">Linked Reports:</h4>
                                    <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                        {assignedCall.notes.map((note, index) => (
                                            <li key={index}>{note}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        <div className="p-6 bg-white dark:bg-gray-800">
                             <p className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-4">Update Status: <span className="text-blue-500">{assignedCall.status}</span></p>
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <button onClick={() => onUpdateCallStatus(assignedCall.id, CallStatus.ON_SCENE, myTeam.id)} disabled={assignedCall.status !== CallStatus.DISPATCHED} className="p-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition">On Scene</button>
                                <button onClick={() => onUpdateCallStatus(assignedCall.id, CallStatus.TRANSPORTING, myTeam.id)} disabled={assignedCall.status !== CallStatus.ON_SCENE} className="p-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition">Transporting</button>
                                <button onClick={() => onUpdateCallStatus(assignedCall.id, CallStatus.COMPLETED, myTeam.id)} disabled={assignedCall.status !== CallStatus.ON_SCENE && assignedCall.status !== CallStatus.TRANSPORTING} className="p-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition">Complete Call</button>
                                {assignedCall.pcrId ? (
                                     <div className="p-3 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-center font-semibold rounded-lg flex items-center justify-center gap-2">
                                        PCR Filed
                                        {(() => {
                                            const pcr = pcrs.find(p => p.id === assignedCall.pcrId);
                                            if (!pcr) return null;
                                            return pcr.isSynced 
                                                ? <span title="Synced"><CheckCircleIcon className="h-5 w-5 text-green-500" /></span>
                                                : <span title="Saved locally"><WifiOffIcon className="h-5 w-5 text-yellow-600" /></span>;
                                        })()}
                                     </div>
                                ) : (
                                    <button onClick={() => onFilePCR(assignedCall)} disabled={assignedCall.status !== CallStatus.COMPLETED} className="p-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2">
                                        <span><FileTextIcon className="h-5 w-5"/></span> File PCR
                                    </button>
                                )}
                             </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl h-full flex flex-col items-center justify-center">
                        <ShieldCheckIcon className="h-16 w-16 text-green-500 mb-4" />
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Ready for Dispatch</h3>
                        {myTeam ? (
                            <>
                                <p className="mt-2 text-md text-gray-600 dark:text-gray-400">
                                    <span className="font-semibold">{myTeam.name}</span> is currently <span className="font-bold text-green-600 dark:text-green-400">{myTeam.status}</span>.
                                </p>
                                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-left w-full max-w-xs mx-auto space-y-1">
                                    <p><strong>Base Station:</strong> {myTeam.baseStation}</p>
                                    <p><strong>Personnel:</strong> {myTeam.members.map(m => m.username).join(', ')}</p>
                                </div>
                                <p className="mt-6 text-sm text-gray-500 dark:text-gray-400 italic">
                                    Awaiting next assignment from dispatch.
                                </p>
                            </>
                        ) : (
                            <p className="mt-2 text-md text-gray-600 dark:text-gray-400">
                                You are not currently assigned to a team.
                            </p>
                        )}
                    </div>
                )}
            </div>

             {/* Shift Summary */}
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2"><span><ChartBarIcon/></span> Shift Summary</h2>
                <ShiftSummaryCharts completedCalls={completedCallsToday} isDarkMode={isDarkMode}/>
            </div>
        </div>
    </div>
  );
};

export default EmtDashboard;
