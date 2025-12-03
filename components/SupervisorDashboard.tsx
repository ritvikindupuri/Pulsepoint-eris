
import React, { useMemo, useState } from 'react';
import { EmergencyCall, CallStatus, User, UserRole, Team, TeamGrade, TeamStatus, BaseStation, Schedule, EmtStatus, PatientCareRecord, Priority } from '../types';
import { UsersIcon } from './icons/UsersIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { AlertIcon } from './icons/AlertIcon';
import { AnalyticsIcon } from './icons/AnalyticsIcon';
import { FileTextIcon } from './icons/FileTextIcon';
import { SearchIcon } from './icons/SearchIcon';
import SchedulingTool from './SchedulingTool';
import PcrDetailsModal from './PcrDetailsModal';
import CallAnalyticsCharts from './CallAnalyticsCharts';
import DemandReport from './DemandReport';
import PerformanceReportModal from './PerformanceReportModal';
import ExceptionReportModal from './ExceptionReportModal';
import EditUserModal from './EditUserModal';
import { PencilIcon } from './icons/PencilIcon';
import { ClockIcon } from './icons/ClockIcon';

interface SupervisorDashboardProps {
  calls: EmergencyCall[];
  pcrs: PatientCareRecord[];
  users: User[];
  teams: Team[];
  schedule: Schedule;
  onUpdateTeam: (team: Team) => void;
  onUpdateSchedule: (schedule: Schedule) => void;
  onAssignUserToTeam: (userId: number, teamId: number) => void;
  onUpdateUser: (user: User) => void;
  isDarkMode: boolean;
  onApproveClockInOut: (userId: number, isApproved: boolean) => void;
  logAuditEvent: (action: string, details?: string) => void;
}

const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({ calls, pcrs, users, teams, schedule, onUpdateTeam, onUpdateSchedule, onAssignUserToTeam, onUpdateUser, isDarkMode, onApproveClockInOut, logAuditEvent }) => {
  const [activeTab, setActiveTab] = useState('teams');
  
  // State
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [assigningUser, setAssigningUser] = useState<User | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showPerformanceReport, setShowPerformanceReport] = useState(false);
  const [showExceptionReport, setShowExceptionReport] = useState(false);
  const [selectedPcr, setSelectedPcr] = useState<PatientCareRecord | null>(null);

  // Filters - Team
  const [teamGradeFilter, setTeamGradeFilter] = useState<TeamGrade | 'all'>('all');
  const [teamBaseStationFilter, setTeamBaseStationFilter] = useState<BaseStation | 'all'>('all');
  
  // Filters - Personnel
  const [personnelSearchTerm, setPersonnelSearchTerm] = useState('');

  // Filters - PCR (UC-S5-B)
  const [pcrSearchTerm, setPcrSearchTerm] = useState('');
  const [pcrDateStart, setPcrDateStart] = useState('');
  const [pcrDateEnd, setPcrDateEnd] = useState('');
  const [pcrPriorityFilter, setPcrPriorityFilter] = useState<'all' | string>('all');
  const [pcrEmtFilter, setPcrEmtFilter] = useState('');


  const todaysCallTimestamps = useMemo(() => {
    const todayString = new Date().toDateString();
    const map = new Map<number, boolean>();
    calls.forEach(call => {
        if (new Date(call.timestamp).toDateString() === todayString) {
            map.set(call.id, true);
        }
    });
    return map;
  }, [calls]);

  const pcrsFiledTodayCount = useMemo(() => {
    return pcrs.filter(pcr => todaysCallTimestamps.has(pcr.callId)).length;
  }, [pcrs, todaysCallTimestamps]);

  const stats = useMemo(() => ({
    openIncidents: calls.filter(c => c.status !== CallStatus.COMPLETED && c.status !== CallStatus.CANCELLED).length,
    pcrFiled: pcrs.length,
    personnelOnDuty: users.filter(u => u.role === UserRole.EMT && u.status === EmtStatus.ON_DUTY).length,
    teamsAvailable: teams.filter(t => t.status === TeamStatus.AVAILABLE).length,
  }), [calls, pcrs, users, teams]);

  const filteredTeams = useMemo(() => {
    return teams.filter(team => 
      (teamGradeFilter === 'all' || team.grade === teamGradeFilter) &&
      (teamBaseStationFilter === 'all' || team.baseStation === teamBaseStationFilter)
    );
  }, [teams, teamGradeFilter, teamBaseStationFilter]);
  
  const unassignedEmts = useMemo(() => {
    return users.filter(u => u.role === UserRole.EMT && (u.teamId === undefined || u.teamId === null) && u.status === EmtStatus.ON_DUTY);
  }, [users]);
  
  const filteredPersonnel = useMemo(() => {
    const lowercasedTerm = personnelSearchTerm.toLowerCase();
    return users.filter(u => u.role === UserRole.EMT && u.username.toLowerCase().includes(lowercasedTerm));
  }, [users, personnelSearchTerm]);

  // UC-S5-B Search and Review Logic
  const filteredPcrs = useMemo(() => {
      const lowercasedTerm = pcrSearchTerm.toLowerCase();
      const lowercasedEmt = pcrEmtFilter.toLowerCase();

      return pcrs.filter(pcr => {
          const call = calls.find(c => c.id === pcr.callId);
          if (!call) return false;

          // 1. Search Term (Incident ID, Location, Destination)
          const matchesTerm = 
              pcr.id.toString().includes(lowercasedTerm) ||
              pcr.callId.toString().includes(lowercasedTerm) ||
              call.location.toLowerCase().includes(lowercasedTerm) ||
              pcr.transferDestination.toLowerCase().includes(lowercasedTerm);

          // 2. Date Range (using Call Timestamp)
          let matchesDate = true;
          if (pcrDateStart) {
              matchesDate = matchesDate && call.timestamp >= new Date(pcrDateStart);
          }
          if (pcrDateEnd) {
             const end = new Date(pcrDateEnd);
             end.setHours(23, 59, 59, 999);
             matchesDate = matchesDate && call.timestamp <= end;
          }

          // 3. Priority Filter
          const matchesPriority = pcrPriorityFilter === 'all' || call.priority.toString() === pcrPriorityFilter;

          // 4. EMT Filter (Check members of the assigned team)
          let matchesEmt = true;
          if (lowercasedEmt) {
              const team = teams.find(t => t.id === call.assignedTeamId);
              if (team) {
                  const memberNames = team.members.map(m => m.username.toLowerCase()).join(' ');
                  matchesEmt = memberNames.includes(lowercasedEmt);
              } else {
                  matchesEmt = false;
              }
          }

          return matchesTerm && matchesDate && matchesPriority && matchesEmt;
      }).sort((a,b) => b.id - a.id);
  }, [pcrs, calls, teams, pcrSearchTerm, pcrDateStart, pcrDateEnd, pcrPriorityFilter, pcrEmtFilter]);
  
  const pendingRequests = useMemo(() => {
    return users.filter(u => u.status === EmtStatus.PENDING_CLOCK_IN || u.status === EmtStatus.PENDING_CLOCK_OUT);
  }, [users]);

  // Handlers
  const handleEditTeam = (team: Team) => setEditingTeam({ ...team });
  const handleSaveTeam = () => { if (editingTeam) { onUpdateTeam(editingTeam); setEditingTeam(null); } };
  const handleSaveUser = (updatedUser: User) => { onUpdateUser(updatedUser); setEditingUser(null); };
  const handleMemberChange = (userId: number, isChecked: boolean) => {
    if (!editingTeam) return;
    let newMembers = isChecked 
        ? [...editingTeam.members, users.find(u => u.id === userId)!]
        : editingTeam.members.filter(m => m.id !== userId);
    setEditingTeam({ ...editingTeam, members: newMembers });
  };
  const handleSaveSchedule = (updatedSchedule: Schedule) => { onUpdateSchedule(updatedSchedule); setShowScheduler(false); };
  const handleSaveAssignment = (teamId: number) => { if (assigningUser) { onAssignUserToTeam(assigningUser.id, teamId); setAssigningUser(null); } };
  
  const handleViewPcr = (pcr: PatientCareRecord) => {
      logAuditEvent('PCR Viewed', `Supervisor viewed PCR ID: ${pcr.id} for Incident ID: ${pcr.callId}`);
      setSelectedPcr(pcr);
  };

  const renderTabContent = () => {
    switch (activeTab) {
        case 'analytics':
            return (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3 bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6">
                        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Call Volume & Status</h3>
                       <CallAnalyticsCharts calls={calls} isDarkMode={isDarkMode} />
                    </div>
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6">
                         <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Demand by Base Station</h3>
                       <DemandReport calls={calls} teams={teams} isDarkMode={isDarkMode} />
                        <button onClick={() => setShowPerformanceReport(true)} className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition">
                            Generate Performance Report
                        </button>
                    </div>
                </div>
            );
        case 'records':
            return (
                <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Patient Care Records Review</h3>
                    
                    {/* Advanced PCR Filters (UC-S5-B) */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Incident Date Range</label>
                            <div className="flex gap-2">
                                <input type="date" value={pcrDateStart} onChange={e => setPcrDateStart(e.target.value)} className="w-full text-sm p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" />
                                <input type="date" value={pcrDateEnd} onChange={e => setPcrDateEnd(e.target.value)} className="w-full text-sm p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" />
                            </div>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">EMT Name</label>
                             <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon className="h-4 w-4 text-gray-400" /></span>
                                <input type="text" placeholder="Search EMT..." value={pcrEmtFilter} onChange={e => setPcrEmtFilter(e.target.value)} className="w-full pl-9 p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" />
                             </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Incident Priority</label>
                            <select value={pcrPriorityFilter} onChange={e => setPcrPriorityFilter(e.target.value)} className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                                <option value="all">All Priorities</option>
                                <option value="1">Priority 1</option>
                                <option value="2">Priority 2</option>
                                <option value="3">Priority 3</option>
                                <option value="4">Priority 4</option>
                            </select>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">General Search</label>
                             <div className="relative">
                                 <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon className="h-4 w-4 text-gray-400" /></span>
                                 <input type="text" placeholder="ID, Location, Dest..." value={pcrSearchTerm} onChange={e => setPcrSearchTerm(e.target.value)} className="w-full pl-9 p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"/>
                             </div>
                        </div>
                         <div className="col-span-1 md:col-span-4 flex justify-end">
                            <button onClick={() => { setPcrDateStart(''); setPcrDateEnd(''); setPcrEmtFilter(''); setPcrPriorityFilter('all'); setPcrSearchTerm(''); }} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Clear Filters</button>
                        </div>
                    </div>

                     <div className="overflow-x-auto max-h-[60vh]">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                             <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">PCR ID</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Date</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Call Location</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Priority</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Destination</th>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300">Actions</th>
                                </tr>
                            </thead>
                             <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredPcrs.map(pcr => {
                                    const call = calls.find(c => c.id === pcr.callId);
                                    return (
                                    <tr key={pcr.id}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{pcr.id}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{call?.timestamp.toLocaleDateString()}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{call?.location}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">P{call?.priority}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{pcr.transferDestination}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                                            <button onClick={() => handleViewPcr(pcr)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">View Details</button>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                        {filteredPcrs.length === 0 && <p className="text-center py-8 text-gray-500 dark:text-gray-400">No records match your search criteria.</p>}
                    </div>
                </div>
            );
        case 'personnel':
            return (
                 <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                         <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Personnel Management</h3>
                         <div className="relative w-full max-w-xs">
                             <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon className="h-5 w-5 text-gray-400" /></span>
                             <input type="text" placeholder="Search EMTs..." value={personnelSearchTerm} onChange={e => setPersonnelSearchTerm(e.target.value)} className="w-full p-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"/>
                         </div>
                    </div>
                     <div className="overflow-x-auto max-h-[60vh]">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                             <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Username</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Assigned Team</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Certifications</th>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300">Actions</th>
                                </tr>
                            </thead>
                             <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredPersonnel.map(user => (
                                    <tr key={user.id}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{user.username}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{teams.find(t => t.id === user.teamId)?.name || 'Unassigned'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.certifications?.join(', ') || 'None'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                                            <button onClick={() => setEditingUser(user)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 flex items-center gap-1 mx-auto"><PencilIcon className="h-4 w-4"/> Edit</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        case 'teams':
        default:
            return (
                <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2"><UsersIcon/> Team Roster & Status</h2>
                        <div className="flex flex-wrap gap-2">
                            <select onChange={(e) => setTeamBaseStationFilter(e.target.value as BaseStation | 'all')} value={teamBaseStationFilter} className="text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md py-1">
                                <option value="all">All Stations</option>
                                <option value="North">North</option><option value="South">South</option><option value="East">East</option><option value="West">West</option>
                            </select>
                            <select onChange={(e) => setTeamGradeFilter(e.target.value as TeamGrade | 'all')} value={teamGradeFilter} className="text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md py-1">
                                <option value="all">All Grades</option><option value={TeamGrade.ALS}>ALS</option><option value={TeamGrade.BLS}>BLS</option>
                            </select>
                        </div>
                    </div>
                    <div className="overflow-x-auto max-h-[60vh]">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                             <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Team</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Members & Certs</th>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300">Status</th>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredTeams.map(team => (
                                <tr key={team.id}>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{team.name} ({team.grade} / {team.baseStation})</td>
                                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">
                                        {team.members.map(m => `${m.username} (${m.certifications?.join(', ') || 'N/A'})`).join('; ')}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-center">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${team.status === TeamStatus.AVAILABLE ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200'}`}>{team.status}</span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                                        <button onClick={() => handleEditTeam(team)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">Edit</button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <header className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Supervisor Dashboard</h1>
        <div className="flex gap-4">
            <button onClick={() => setShowExceptionReport(true)} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out">
                <AlertIcon className="h-5 w-5"/> Shift Handover
            </button>
            <button onClick={() => setShowScheduler(true)} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out">
                <CalendarIcon /> Manage Schedule
            </button>
        </div>
      </header>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard title="Open Incidents" value={stats.openIncidents} />
          <StatCard title="PCRs Filed Today" value={pcrsFiledTodayCount} />
          <StatCard title="Personnel On Duty" value={stats.personnelOnDuty} />
          <StatCard title="Teams Available" value={stats.teamsAvailable} />
      </div>

      {pendingRequests.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-400 dark:border-orange-600 rounded-lg p-4 mb-6 shadow-md">
            <h3 className="font-bold text-lg text-orange-800 dark:text-orange-200 flex items-center gap-2"><ClockIcon className="h-5 w-5"/> Action Required: Shift Change Requests</h3>
            <ul className="mt-2 divide-y divide-orange-200 dark:divide-orange-800">
                {pendingRequests.map(user => (
                    <li key={user.id} className="flex flex-col sm:flex-row justify-between items-center py-2 gap-2">
                        <div>
                            <span className="text-gray-800 dark:text-gray-200 font-medium">{user.username}</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400 sm:ml-2">requests to <span className="font-semibold">{user.status === EmtStatus.PENDING_CLOCK_IN ? 'Clock In' : 'Clock Out'}</span></span>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                            <button onClick={() => onApproveClockInOut(user.id, false)} className="text-sm bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded-md shadow-sm transition-colors">Deny</button>
                            <button onClick={() => onApproveClockInOut(user.id, true)} className="text-sm bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-3 rounded-md shadow-sm transition-colors">Approve</button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
      )}
      
      {unassignedEmts.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-600 rounded-lg p-4 mb-6 shadow-md">
            <h3 className="font-bold text-lg text-yellow-800 dark:text-yellow-200 flex items-center gap-2"><AlertIcon/> Action Required: Unassigned Personnel</h3>
            <ul className="mt-2 divide-y divide-yellow-200 dark:divide-yellow-800">
                {unassignedEmts.map(user => (
                    <li key={user.id} className="flex justify-between items-center py-2">
                        <span className="text-gray-800 dark:text-gray-200 font-medium">{user.username}</span>
                        <button onClick={() => setAssigningUser(user)} className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1 px-3 rounded-md shadow-sm transition-colors">Assign...</button>
                    </li>
                ))}
            </ul>
        </div>
      )}

       <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              <TabButton name="Team Management" icon={<UsersIcon/>} active={activeTab === 'teams'} onClick={() => setActiveTab('teams')} />
              <TabButton name="Personnel" icon={<UsersIcon/>} active={activeTab === 'personnel'} onClick={() => setActiveTab('personnel')} />
              <TabButton name="Operational Analytics" icon={<AnalyticsIcon/>} active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
              <TabButton name="Record Review" icon={<FileTextIcon/>} active={activeTab === 'records'} onClick={() => setActiveTab('records')} />
          </nav>
      </div>
      
      {renderTabContent()}
      
      {/* Modals */}
      {editingTeam && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-lg">
                  <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Edit Team: {editingTeam.name}</h3>
                  <div className="space-y-4">
                      <input type="text" value={editingTeam.name} onChange={e => setEditingTeam({...editingTeam, name: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700" placeholder="Team Name"/>
                      <select value={editingTeam.grade} onChange={e => setEditingTeam({...editingTeam, grade: e.target.value as TeamGrade})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700">
                          <option value={TeamGrade.ALS}>ALS</option><option value={TeamGrade.BLS}>BLS</option>
                      </select>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Members</label>
                          <div className="mt-2 grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                            {users.filter(u => u.role === UserRole.EMT).map(user => {
                                const isAssignedToOtherTeam = user.teamId !== undefined && user.teamId !== editingTeam.id;
                                const otherTeam = teams.find(t => t.id === user.teamId);
                                return (
                                    <label key={user.id} className={`flex items-center space-x-2 text-sm ${isAssignedToOtherTeam ? 'opacity-50' : ''}`}>
                                        <input type="checkbox" checked={editingTeam.members.some(m => m.id === user.id)} onChange={e => handleMemberChange(user.id, e.target.checked)} disabled={isAssignedToOtherTeam}/>
                                        <span>
                                            {user.username} <span className="text-xs text-gray-400">({user.certifications?.join(', ') || 'N/A'})</span>
                                            {isAssignedToOtherTeam && otherTeam && <span className="text-xs text-gray-400 ml-1">({otherTeam.name})</span>}
                                        </span>
                                    </label>
                                );
                            })}
                          </div>
                      </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                      <button onClick={() => setEditingTeam(null)} className="py-2 px-4 bg-gray-200 dark:bg-gray-600 rounded-md">Cancel</button>
                      <button onClick={handleSaveTeam} className="py-2 px-4 bg-blue-600 text-white rounded-md">Save Changes</button>
                  </div>
              </div>
          </div>
      )}
        
      {showScheduler && <SchedulingTool schedule={schedule} teams={teams} users={users} onSave={handleSaveSchedule} onCancel={() => setShowScheduler(false)} />}
      {showPerformanceReport && <PerformanceReportModal calls={calls} teams={teams} onClose={() => setShowPerformanceReport(false)} />}
      {showExceptionReport && <ExceptionReportModal openIncidents={calls.filter(c => c.status !== CallStatus.COMPLETED && c.status !== CallStatus.CANCELLED)} teams={teams} onClose={() => setShowExceptionReport(false)} />}
      {selectedPcr && <PcrDetailsModal pcr={selectedPcr} call={calls.find(c => c.id === selectedPcr.callId)} onClose={() => setSelectedPcr(null)} />}
      {assigningUser && <AssignUserToTeamModal user={assigningUser} teams={teams} onSave={handleSaveAssignment} onCancel={() => setAssigningUser(null)} />}
      {editingUser && <EditUserModal user={editingUser} onSave={handleSaveUser} onCancel={() => setEditingUser(null)} />}
    </div>
  );
};

const StatCard: React.FC<{title: string; value: string | number}> = ({title, value}) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
);

const TabButton: React.FC<{name: string, icon: React.ReactNode, active: boolean, onClick: () => void}> = ({ name, icon, active, onClick }) => (
    <button onClick={onClick} className={`flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${active ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'}`}>
        <div className="h-5 w-5">{icon}</div>
        {name}
    </button>
);

const AssignUserToTeamModal: React.FC<{ user: User; teams: Team[]; onSave: (teamId: number) => void; onCancel: () => void; }> = ({ user, teams, onSave, onCancel }) => {
    const [selectedTeamId, setSelectedTeamId] = useState<string>('');
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-md">
                <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Assign {user.username} to a Team</h3>
                <select value={selectedTeamId} onChange={e => setSelectedTeamId(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                    <option value="" disabled>Select a team...</option>
                    {teams.map(team => (<option key={team.id} value={team.id}>{team.name} ({team.grade})</option>))}
                </select>
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onCancel} className="py-2 px-4 bg-gray-200 dark:bg-gray-600 rounded-md">Cancel</button>
                    <button onClick={() => onSave(parseInt(selectedTeamId))} disabled={!selectedTeamId} className="py-2 px-4 bg-blue-600 text-white rounded-md disabled:opacity-50">Save Assignment</button>
                </div>
            </div>
        </div>
    );
};

export default SupervisorDashboard;
