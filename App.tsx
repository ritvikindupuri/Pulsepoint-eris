
import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';
import NavBar from './components/NavBar';
import DispatcherDashboard from './components/DispatcherDashboard';
import EmtDashboard from './components/EmtDashboard';
import SupervisorDashboard from './components/SupervisorDashboard';
import COODashboard from './components/COODashboard';
import AdminDashboard from './components/AdminDashboard';
import LogCallForm from './components/LogCallForm';
import PatientCareRecordForm from './components/PatientCareRecordForm';
import ConfirmationPage from './components/ConfirmationPage';
import DuplicateCallModal from './components/DuplicateCallModal';
import { User, EmergencyCall, Team, PatientCareRecord, UserRole, CallStatus, TeamStatus, TeamGrade, EmtStatus, Priority, Schedule, AuditLogEntry } from './types';
import { INITIAL_USERS, INITIAL_TEAMS, INITIAL_CALLS, INITIAL_SCHEDULE, INITIAL_AUDIT_LOGS } from './constants';

type AppView = 'login' | 'signup' | 'dashboard' | 'logCall' | 'filePCR' | 'confirmation';

// localStorage keys
const USERS_STORAGE_KEY = 'pulsepoint_eris_users';
const CALLS_STORAGE_KEY = 'pulsepoint_eris_calls';
const TEAMS_STORAGE_KEY = 'pulsepoint_eris_teams';
const PCRS_STORAGE_KEY = 'pulsepoint_eris_pcrs';
const SCHEDULE_STORAGE_KEY = 'pulsepoint_eris_schedule';
const AUDIT_LOG_STORAGE_KEY = 'pulsepoint_eris_audit_log';
const DARK_MODE_KEY = 'pulsepoint_eris_dark_mode';

const loadStateFromLocalStorage = () => {
    try {
        // Users
        const savedUsers = localStorage.getItem(USERS_STORAGE_KEY);
        const users: User[] = savedUsers ? JSON.parse(savedUsers) : INITIAL_USERS;

        // Calls (with date parsing)
        const savedCalls = localStorage.getItem(CALLS_STORAGE_KEY);
        let calls: EmergencyCall[] = INITIAL_CALLS;
        if (savedCalls) {
            const parsedCalls = JSON.parse(savedCalls);
            calls = parsedCalls.map((call: any) => ({
                ...call,
                timestamp: new Date(call.timestamp),
                dispatchTimestamp: call.dispatchTimestamp ? new Date(call.dispatchTimestamp) : undefined,
                onSceneTimestamp: call.onSceneTimestamp ? new Date(call.onSceneTimestamp) : undefined,
                completedTimestamp: call.completedTimestamp ? new Date(call.completedTimestamp) : undefined,
                isSynced: call.isSynced === false ? false : true,
            }));
        }

        // Teams (with hydration using the users we just loaded)
        const savedTeams = localStorage.getItem(TEAMS_STORAGE_KEY);
        let teams: Team[] = INITIAL_TEAMS;
        if (savedTeams) {
            const parsedTeams = JSON.parse(savedTeams) as Team[];
            teams = parsedTeams.map(team => ({
                ...team,
                members: team.members.map(member => users.find(u => u.id === member.id)).filter((u): u is User => !!u)
            }));
        }
        
        // PCRs
        const savedPcrs = localStorage.getItem(PCRS_STORAGE_KEY);
        let pcrs: PatientCareRecord[] = [];
        if (savedPcrs) {
            const parsedPcrs = JSON.parse(savedPcrs);
            // Backwards compatibility for PCRs saved before sync feature
            pcrs = parsedPcrs.map((pcr: any) => ({
                ...pcr,
                isSynced: pcr.isSynced === false ? false : true,
            }));
        }

        // Schedule
        const savedSchedule = localStorage.getItem(SCHEDULE_STORAGE_KEY);
        const schedule: Schedule = savedSchedule ? JSON.parse(savedSchedule) : INITIAL_SCHEDULE;

        // Audit Log (with date parsing)
        const savedLogs = localStorage.getItem(AUDIT_LOG_STORAGE_KEY);
        let auditLog: AuditLogEntry[] = INITIAL_AUDIT_LOGS;
        if (savedLogs) {
            const parsedLogs = JSON.parse(savedLogs);
            auditLog = parsedLogs.map((log: any) => ({
                ...log,
                timestamp: new Date(log.timestamp),
            }));
        }

        // Dark Mode
        const savedMode = localStorage.getItem(DARK_MODE_KEY);
        const isDarkMode = savedMode ? JSON.parse(savedMode) : false;

        return { users, calls, teams, pcrs, schedule, auditLog, isDarkMode };

    } catch (error) {
        console.error("Could not load state from localStorage. Falling back to initial state.", error);
        return { 
            users: INITIAL_USERS, 
            calls: INITIAL_CALLS, 
            teams: INITIAL_TEAMS, 
            pcrs: [], 
            schedule: INITIAL_SCHEDULE, 
            auditLog: INITIAL_AUDIT_LOGS,
            isDarkMode: false 
        };
    }
};


const App: React.FC = () => {
    const [initialState] = useState(loadStateFromLocalStorage);

    const [view, setView] = useState<AppView>('login');
    const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
    const [isOnline, setIsOnline] = useState(true); // For offline simulation
    
    const [isDarkMode, setIsDarkMode] = useState<boolean>(initialState.isDarkMode);
    const [users, setUsers] = useState<User[]>(initialState.users);
    const [calls, setCalls] = useState<EmergencyCall[]>(initialState.calls);
    const [teams, setTeams] = useState<Team[]>(initialState.teams);
    const [pcrs, setPcrs] = useState<PatientCareRecord[]>(initialState.pcrs);
    const [schedule, setSchedule] = useState<Schedule>(initialState.schedule);
    const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(initialState.auditLog);

    const [callToEdit, setCallToEdit] = useState<EmergencyCall | null>(null);
    const [confirmationMessage, setConfirmationMessage] = useState('');
    const [duplicateCallInfo, setDuplicateCallInfo] = useState<{ existingCalls: EmergencyCall[], newCallData: Omit<EmergencyCall, 'id' | 'timestamp' | 'status'> } | null>(null);

    // Effects for saving state to localStorage
    useEffect(() => {
        localStorage.setItem(DARK_MODE_KEY, JSON.stringify(isDarkMode));
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);
    
    useEffect(() => { /* In a production app, user data would be encrypted. */ localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users)); }, [users]);
    useEffect(() => { /* In a production app, call data would be encrypted. */ localStorage.setItem(CALLS_STORAGE_KEY, JSON.stringify(calls)); }, [calls]);
    useEffect(() => { localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams)); }, [teams]);
    useEffect(() => { /* In a production app, patient data (PHI) MUST be encrypted. */ localStorage.setItem(PCRS_STORAGE_KEY, JSON.stringify(pcrs)); }, [pcrs]);
    useEffect(() => { localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(schedule)); }, [schedule]);
    useEffect(() => { localStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify(auditLog)); }, [auditLog]);

    // Effect for simulating data sync when coming back online
    useEffect(() => {
        if (isOnline) {
            const unsyncedPcrs = pcrs.filter(p => !p.isSynced);
            if (unsyncedPcrs.length > 0) {
                console.log(`Syncing ${unsyncedPcrs.length} PCRs...`);
                setTimeout(() => {
                    setPcrs(prevPcrs => 
                        prevPcrs.map(p => p.isSynced ? p : { ...p, isSynced: true })
                    );
                    logAuditEvent('System Sync', `${unsyncedPcrs.length} offline PCR(s) synced.`);
                }, 2000);
            }
            
            const unsyncedCalls = calls.filter(c => !c.isSynced);
            if (unsyncedCalls.length > 0) {
                console.log(`Syncing ${unsyncedCalls.length} calls...`);
                setTimeout(() => {
                    setCalls(prevCalls => 
                        prevCalls.map(c => c.isSynced ? c : { ...c, isSynced: true })
                    );
                    logAuditEvent('System Sync', `${unsyncedCalls.length} offline call(s) synced.`);
                }, 2000);
            }
        }
    }, [isOnline]);

    const logAuditEvent = (action: string, details?: string) => {
        const newLogEntry: AuditLogEntry = {
            id: auditLog.length + 1,
            timestamp: new Date(),
            user: loggedInUser?.username || 'System',
            action,
            details
        };
        setAuditLog(prev => [newLogEntry, ...prev]);
    };

    const handleLogin = (username: string, password_used: string): boolean => {
        const user = users.find(u => u.username === username);
        if (user && user.password === password_used) {
            setLoggedInUser(user);
            setView('dashboard');
            logAuditEvent('User Login');
            return true;
        }
        return false;
    };
    
    const handleSignUp = (userData: Omit<User, 'id' | 'status'>): boolean => {
        if (users.some(u => u.username === userData.username)) {
            return false;
        }
        const newUser: User = { 
            id: users.map(u => u.id).reduce((maxId, currentId) => Math.max(maxId, currentId), 0) + 1,
            ...userData, 
            status: userData.role === UserRole.EMT ? EmtStatus.OFF_DUTY : null,
            certifications: userData.role === UserRole.EMT ? [] : undefined,
        };
        setUsers(prev => [...prev, newUser]);
        setLoggedInUser(newUser);
        setView('dashboard');
        logAuditEvent('User Signed Up', `New user: ${newUser.username}`);
        return true;
    };

    const handleLogout = () => {
        logAuditEvent('User Logout');
        setLoggedInUser(null);
        setView('login');
    };

    const handleLogCallSubmit = (callData: Omit<EmergencyCall, 'id' | 'timestamp' | 'status' | 'pcrId' | 'assignedTeamId'>) => {
        if (!isOnline) {
            const newCall: EmergencyCall = {
                id: Date.now(),
                ...callData,
                timestamp: new Date(),
                status: CallStatus.PENDING,
                isSynced: false,
                notes: [],
            };
            setCalls(prev => [newCall, ...prev]);
            setConfirmationMessage('Call saved locally! It will sync when you are back online.');
            setView('confirmation');
            logAuditEvent('Offline Call Logged', `Loc: ${newCall.location}`);
            return;
        }

        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        const potentialDuplicates = calls.filter(c => 
            c.phone === callData.phone &&
            c.timestamp >= twoHoursAgo &&
            c.status !== CallStatus.COMPLETED &&
            c.status !== CallStatus.CANCELLED
        );

        if (potentialDuplicates.length > 0) {
            setDuplicateCallInfo({ existingCalls: potentialDuplicates, newCallData: callData });
        } else {
            const newCall: EmergencyCall = {
                id: calls.map(c => c.id).reduce((maxId, currentId) => Math.max(maxId, currentId), 0) + 1,
                ...callData,
                timestamp: new Date(),
                status: CallStatus.PENDING,
                isSynced: true,
                notes: [],
            };
            setCalls(prev => [newCall, ...prev]);
            setConfirmationMessage(`Emergency call (ID: ${newCall.id}) logged successfully!`);
            setView('confirmation');
            logAuditEvent('Call Logged', `ID: ${newCall.id}, Loc: ${newCall.location}`);
        }
    };
    
    const handleLinkCall = (existingCallId: number) => {
        if (!duplicateCallInfo) return;
        const { newCallData } = duplicateCallInfo;

        setCalls(prevCalls => prevCalls.map(c => {
            if (c.id === existingCallId) {
                const newNote = `[${new Date().toLocaleString()}] New report from ${newCallData.callerName} (${newCallData.phone}): "${newCallData.description}"`;
                const updatedNotes = c.notes ? [...c.notes, newNote] : [newNote];
                logAuditEvent('Call Linked to Incident', `New info added to Incident ID: ${existingCallId}`);
                return { ...c, notes: updatedNotes };
            }
            return c;
        }));

        setConfirmationMessage(`New report linked to existing Incident ID: ${existingCallId}.`);
        setView('confirmation');
        setDuplicateCallInfo(null);
    };

    const handleCreateNewCallAnyway = () => {
        if (!duplicateCallInfo) return;
        const { newCallData } = duplicateCallInfo;
        
        const newCall: EmergencyCall = {
            id: calls.map(c => c.id).reduce((maxId, currentId) => Math.max(maxId, currentId), 0) + 1,
            ...newCallData,
            timestamp: new Date(),
            status: CallStatus.PENDING,
            isSynced: true,
            notes: [],
        };
        setCalls(prev => [newCall, ...prev]);
        setConfirmationMessage(`New emergency call (ID: ${newCall.id}) created successfully!`);
        setView('confirmation');
        logAuditEvent('Duplicate Call Logged as New', `ID: ${newCall.id}, Loc: ${newCall.location}`);
        setDuplicateCallInfo(null);
    };

    const handleCancelDuplicate = () => {
        setDuplicateCallInfo(null);
    };

    const handleUpdateCallStatus = (callId: number, status: CallStatus, teamId?: number) => {
        setCalls(prevCalls => prevCalls.map(c => {
            if (c.id === callId) {
                const updatedCall = { ...c, status };
                if (status === CallStatus.DISPATCHED) updatedCall.dispatchTimestamp = new Date();
                if (status === CallStatus.ON_SCENE) updatedCall.onSceneTimestamp = new Date();
                if (status === CallStatus.COMPLETED) updatedCall.completedTimestamp = new Date();
                logAuditEvent('Call Status Updated', `ID: ${callId}, New Status: ${status}`);
                return updatedCall;
            }
            return c;
        }));
        if (teamId !== undefined) {
            let teamStatus: TeamStatus;
            switch(status) {
                case CallStatus.DISPATCHED: teamStatus = TeamStatus.DISPATCHED; break;
                case CallStatus.ON_SCENE: teamStatus = TeamStatus.ON_SCENE; break;
                case CallStatus.TRANSPORTING: teamStatus = TeamStatus.TRANSPORTING; break;
                case CallStatus.COMPLETED: teamStatus = TeamStatus.AVAILABLE; break;
                default: teamStatus = teams.find(t => t.id === teamId)?.status || TeamStatus.AVAILABLE;
            }
            handleUpdateTeamStatus(teamId, teamStatus);
        }
    };
    
    const handleAssignTeam = (callId: number, teamId: number) => {
        setCalls(prev => prev.map(c => c.id === callId ? { ...c, assignedTeamId: teamId, status: CallStatus.DISPATCHED, dispatchTimestamp: new Date() } : c));
        handleUpdateTeamStatus(teamId, TeamStatus.DISPATCHED);
        logAuditEvent('Team Assigned', `Call ID: ${callId} to Team ID: ${teamId}`);
    };

    const handleUpdateTeamStatus = (teamId: number, status: TeamStatus) => {
        setTeams(prev => prev.map(t => t.id === teamId ? {...t, status: status} : t));
        logAuditEvent('Team Status Updated', `Team ID: ${teamId}, New Status: ${status}`);
    };

    const handleUpdateUserStatus = (userId: number, status: EmtStatus) => {
        const user = users.find(u => u.id === userId);
        if (!user || user.role !== UserRole.EMT) return;

        let finalStatus = status;
        // Intercept clock-in/out to set pending status
        if (status === EmtStatus.ON_DUTY) {
            finalStatus = EmtStatus.PENDING_CLOCK_IN;
        } else if (status === EmtStatus.OFF_DUTY) {
            finalStatus = EmtStatus.PENDING_CLOCK_OUT;
        }

        const newUsers = users.map(u => 
            u.id === userId ? { ...u, status: finalStatus } : u
        );
        setUsers(newUsers);

        if (loggedInUser && loggedInUser.id === userId) {
            const updatedUser = newUsers.find(u => u.id === userId);
            if (updatedUser) {
                setLoggedInUser(updatedUser);
            }
        }
        logAuditEvent('Shift Status Change Requested', `User ID: ${userId}, Requested: ${status}`);
    };
    
    const handleApproveClockInOut = (userId: number, isApproved: boolean) => {
        const user = users.find(u => u.id === userId);
        if (!user || (user.status !== EmtStatus.PENDING_CLOCK_IN && user.status !== EmtStatus.PENDING_CLOCK_OUT)) {
            return;
        }

        let newStatus: EmtStatus;
        if (isApproved) {
            newStatus = user.status === EmtStatus.PENDING_CLOCK_IN ? EmtStatus.ON_DUTY : EmtStatus.OFF_DUTY;
        } else {
            // Revert to the previous state
            newStatus = user.status === EmtStatus.PENDING_CLOCK_IN ? EmtStatus.OFF_DUTY : EmtStatus.ON_DUTY;
        }

        const newUsers = users.map(u => 
            u.id === userId ? { ...u, status: newStatus } : u
        );
        setUsers(newUsers);

        logAuditEvent('Shift Status Change Reviewed', `User ID: ${userId}, Status: ${newStatus}, Approved: ${isApproved}`);
    };

    const handleFilePCRSubmit = (pcrData: Omit<PatientCareRecord, 'id' | 'callId' | 'isSynced'>) => {
        if (!callToEdit) return;
        const newPcr: PatientCareRecord = {
            id: pcrs.reduce((maxId: number, p: PatientCareRecord) => Math.max(maxId, p.id), 0) + 1,
            callId: callToEdit.id,
            ...pcrData,
            isSynced: isOnline,
        };
        setPcrs(prev => [...prev, newPcr]);
        setCalls(prev => prev.map(c => c.id === callToEdit.id ? {...c, pcrId: newPcr.id} : c));
        setCallToEdit(null);
        setConfirmationMessage(isOnline ? 'Patient Care Record filed successfully!' : 'PCR saved locally! It will sync when you are back online.');
        setView('confirmation');
        logAuditEvent('PCR Filed', `Call ID: ${callToEdit.id}. Status: ${isOnline ? 'Synced' : 'Offline'}`);
    };
    
    const handleUpdateTeam = (updatedTeam: Team) => {
        const originalTeam = teams.find(t => t.id === updatedTeam.id)!;
        const originalMemberIds = new Set(originalTeam.members.map(m => m.id));
        const updatedMemberIds = new Set(updatedTeam.members.map(m => m.id));

        const addedUserIds = [...updatedMemberIds].filter((id: number) => !originalMemberIds.has(id));
        const removedUserIds = [...originalMemberIds].filter((id: number) => !updatedMemberIds.has(id));

        const newUsers = users.map(u => {
            if (addedUserIds.includes(u.id)) {
                return { ...u, teamId: updatedTeam.id };
            }
            if (removedUserIds.includes(u.id)) {
                return { ...u, teamId: undefined };
            }
            return u;
        });
        setUsers(newUsers);

        const newTeams = teams.map(t => {
            if (t.id === updatedTeam.id) {
                return {
                    ...updatedTeam,
                    members: newUsers.filter(u => updatedMemberIds.has(u.id))
                };
            }
            return {
                ...t,
                members: newUsers.filter(u => u.teamId === t.id)
            };
        });
        setTeams(newTeams);

        logAuditEvent('Team Updated', `Team ID: ${updatedTeam.id}`);
    };

    const handleAssignUserToTeam = (userId: number, teamId: number) => {
        const updatedUsers = users.map(u => 
            u.id === userId ? { ...u, teamId } : u
        );
        setUsers(updatedUsers);

        const updatedTeams = teams.map(team => ({
            ...team,
            members: updatedUsers.filter(u => u.teamId === team.id)
        }));
        setTeams(updatedTeams);

        logAuditEvent('User Assigned to Team', `User ID: ${userId} to Team ID: ${teamId}`);
    };

    const handleUpdateUser = (updatedUser: User) => {
        setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
        logAuditEvent('User Profile Updated', `User ID: ${updatedUser.id}`);
    };

    const handleUpdateSchedule = (updatedSchedule: Schedule) => {
        setSchedule(updatedSchedule);
        logAuditEvent('Schedule Published');
    };
    
    const renderDashboard = () => {
        if (!loggedInUser) return <LoginPage onLogin={handleLogin} onNavigateToSignUp={() => setView('signup')} />;
        switch (loggedInUser.role) {
            case UserRole.DISPATCHER:
                return <DispatcherDashboard calls={calls} teams={teams} onAssignTeam={handleAssignTeam} onUpdateCallStatus={handleUpdateCallStatus} onLogNewCall={() => setView('logCall')} />;
            case UserRole.EMT:
                return <EmtDashboard user={loggedInUser} calls={calls} teams={teams} pcrs={pcrs} onFilePCR={(call) => { setCallToEdit(call); setView('filePCR'); }} onUpdateCallStatus={handleUpdateCallStatus} onUpdateUserStatus={handleUpdateUserStatus} isDarkMode={isDarkMode} isOnline={isOnline} />;
            case UserRole.SUPERVISOR:
                return <SupervisorDashboard calls={calls} pcrs={pcrs} users={users} teams={teams} schedule={schedule} onUpdateTeam={handleUpdateTeam} onUpdateSchedule={handleUpdateSchedule} onAssignUserToTeam={handleAssignUserToTeam} onUpdateUser={handleUpdateUser} isDarkMode={isDarkMode} onApproveClockInOut={handleApproveClockInOut} logAuditEvent={logAuditEvent} />;
            case UserRole.COO:
                return <COODashboard calls={calls} teams={teams} isDarkMode={isDarkMode} logAuditEvent={logAuditEvent} />;
            case UserRole.ADMIN:
                return <AdminDashboard logs={auditLog} users={users} onBackup={() => { logAuditEvent("Manual System Backup Triggered"); alert("System backup completed successfully.");}} logAuditEvent={logAuditEvent} />;
            default:
                return <div>Dashboard not available for this role.</div>;
        }
    };
    
    const renderContent = () => {
        switch (view) {
            case 'login':
                return <LoginPage onLogin={handleLogin} onNavigateToSignUp={() => setView('signup')} />;
            case 'signup':
                return <SignUpPage onSignUp={handleSignUp} onNavigateToLogin={() => setView('login')} />;
            case 'logCall':
                return <LogCallForm onSubmit={handleLogCallSubmit} onCancel={() => setView('dashboard')} />;
            case 'filePCR':
                if (callToEdit) {
                    return <PatientCareRecordForm call={callToEdit} onSubmit={handleFilePCRSubmit} onCancel={() => setView('dashboard')} />;
                }
                return renderDashboard(); // fallback
            case 'confirmation':
                return <ConfirmationPage message={confirmationMessage} onBack={() => setView('dashboard')} />;
            case 'dashboard':
            default:
                return renderDashboard();
        }
    };

    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} font-sans`}>
            {loggedInUser && <NavBar user={loggedInUser} onLogout={handleLogout} isDarkMode={isDarkMode} onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} isOnline={isOnline} onToggleOnline={() => setIsOnline(!isOnline)} />}
            <main>
                {renderContent()}
            </main>
            {duplicateCallInfo && (
                <DuplicateCallModal 
                    duplicateInfo={duplicateCallInfo}
                    onLink={handleLinkCall}
                    onCreateNew={handleCreateNewCallAnyway}
                    onCancel={handleCancelDuplicate}
                />
            )}
        </div>
    );
};

export default App;
