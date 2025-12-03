import React, { useState, useMemo } from 'react';
import { EmergencyCall, Team, CallStatus, TeamStatus, Priority } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { SearchIcon } from './icons/SearchIcon';
import { NoResultsIcon } from './icons/NoResultsIcon';
import LiveMapPanel from './LiveMapPanel';
import EODReportModal from './EODReportModal';
import { ReportIcon } from './icons/ReportIcon';

interface DispatcherDashboardProps {
  calls: EmergencyCall[];
  teams: Team[];
  onAssignTeam: (callId: number, teamId: number) => void;
  onUpdateCallStatus: (callId: number, status: CallStatus, teamId?: number) => void;
  onLogNewCall: () => void;
}

const DispatcherDashboard: React.FC<DispatcherDashboardProps> = ({ calls, teams, onAssignTeam, onLogNewCall }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCall, setSelectedCall] = useState<EmergencyCall | null>(null);
  const [showEODReport, setShowEODReport] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');

  const pendingCalls = useMemo(() =>
    calls.filter(c => 
        c.status === CallStatus.PENDING &&
        (priorityFilter === 'all' || c.priority === priorityFilter) &&
        (c.location.toLowerCase().includes(searchTerm.toLowerCase()) || c.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => a.priority - b.priority || a.timestamp.getTime() - b.timestamp.getTime()),
    [calls, searchTerm, priorityFilter]
  );

  const activeCalls = useMemo(() =>
    calls.filter(c => c.status !== CallStatus.PENDING && c.status !== CallStatus.COMPLETED && c.status !== CallStatus.CANCELLED)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [calls]
  );
  
  const availableTeams = useMemo(() =>
    teams.filter(t => t.status === TeamStatus.AVAILABLE),
    [teams]
  );

  const handleAssign = (teamId: number) => {
    if (selectedCall) {
      onAssignTeam(selectedCall.id, teamId);
      setSelectedCall(null);
    }
  };

  const getPriorityClass = (priority: number) => {
    switch (priority) {
      case 1: return 'bg-red-100 text-red-800 border-red-500 dark:bg-red-900/50 dark:text-red-200';
      case 2: return 'bg-yellow-100 text-yellow-800 border-yellow-500 dark:bg-yellow-900/50 dark:text-yellow-200';
      case 3: return 'bg-blue-100 text-blue-800 border-blue-500 dark:bg-blue-900/50 dark:text-blue-200';
      case 4: return 'bg-green-100 text-green-800 border-green-500 dark:bg-green-900/50 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-500 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Main Content */}
      <div className="w-full lg:w-3/5 xl:w-2/3 flex flex-col p-4">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Dispatcher Dashboard</h1>
          <div className="flex gap-4">
             <button onClick={() => setShowEODReport(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out">
                <ReportIcon /> EOD Report
            </button>
            <button onClick={onLogNewCall} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out">
              <PlusIcon /> Log New Call
            </button>
          </div>
        </header>

        {/* Pending Calls */}
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-4 flex-grow flex flex-col">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Pending Incidents</h2>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-grow">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </span>
              <input
                type="text"
                placeholder="Search by location or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
              />
            </div>
             <div>
                <select 
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10) as Priority)}
                    className="w-full sm:w-auto p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 h-full"
                >
                    <option value="all">All Priorities</option>
                    <option value={1}>Priority 1</option>
                    <option value={2}>Priority 2</option>
                    <option value={3}>Priority 3</option>
                    <option value={4}>Priority 4</option>
                </select>
            </div>
          </div>
          <div className="overflow-y-auto flex-grow">
            {pendingCalls.length > 0 ? (
              pendingCalls.map(call => (
                <div key={call.id} onClick={() => setSelectedCall(call)} className={`p-3 mb-2 rounded-lg cursor-pointer border-l-4 ${getPriorityClass(call.priority)} ${selectedCall?.id === call.id ? 'ring-2 ring-indigo-500' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold">{call.location}</p>
                      <p className="text-sm">{call.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">P{call.priority}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(call.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
                <div className="text-center py-10">
                    <NoResultsIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No pending calls</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Try adjusting your search or filter.</p>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Side Panel */}
      <div className="hidden lg:block w-2/5 xl:w-1/3 bg-gray-50 dark:bg-gray-800/50 p-4 border-l border-gray-200 dark:border-gray-700 flex flex-col">
        <LiveMapPanel activeCalls={activeCalls} teams={teams} />
        <div className="mt-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 flex-grow flex flex-col">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">{selectedCall ? `Assign Team to: ${selectedCall.location}` : 'Available Teams'}</h3>
          <div className="overflow-y-auto flex-grow">
            {availableTeams.length > 0 ? (
              availableTeams.map(team => (
                <button
                  key={team.id}
                  onClick={() => handleAssign(team.id)}
                  disabled={!selectedCall}
                  className="w-full flex justify-between items-center p-3 mb-2 text-left bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <div>
                    <p className="font-semibold">{team.name} ({team.grade})</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{team.baseStation} Station</p>
                  </div>
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">{team.status}</span>
                </button>
              ))
            ) : (
                <div className="text-center py-10">
                    <p className="text-sm text-gray-500 dark:text-gray-400">No teams available.</p>
                </div>
            )}
          </div>
          {selectedCall && <button onClick={() => setSelectedCall(null)} className="mt-2 text-sm text-center w-full text-red-500">Cancel Assignment</button>}
        </div>
      </div>
      {showEODReport && <EODReportModal calls={calls} onClose={() => setShowEODReport(false)} />}
    </div>
  );
};

export default DispatcherDashboard;