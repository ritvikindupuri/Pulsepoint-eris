import { User, EmergencyCall, Team, UserRole, CallStatus, TeamStatus, TeamGrade, EmtStatus, Schedule, Day, BaseStation, AuditLogEntry } from './types';

export const INITIAL_USERS: User[] = [
  { id: 1, username: 'dispatch1', password: 'password', role: UserRole.DISPATCHER, status: null },
  { id: 2, username: 'emt1', password: 'password', role: UserRole.EMT, status: EmtStatus.ON_DUTY, teamId: 1, certifications: ['EMT-P', 'ACLS'] },
  { id: 3, username: 'emt2', password: 'password', role: UserRole.EMT, status: EmtStatus.ON_DUTY, teamId: 1, certifications: ['EMT-B', 'PALS'] },
  { id: 4, username: 'emt3', password: 'password', role: UserRole.EMT, status: EmtStatus.ON_DUTY, teamId: 2, certifications: ['EMT-B'] },
  { id: 5, username: 'emt4', password: 'password', role: UserRole.EMT, status: EmtStatus.PENDING_CLOCK_IN, teamId: undefined, certifications: ['AEMT', 'BLS'] },
  { id: 6, username: 'supervisor1', password: 'password', role: UserRole.SUPERVISOR, status: null },
  { id: 7, username: 'coo1', password: 'password', role: UserRole.COO, status: null },
  { id: 8, username: 'admin1', password: 'password', role: UserRole.ADMIN, status: null },
];

export const INITIAL_TEAMS: Team[] = [
  { 
    id: 1, 
    name: 'Alpha Team', 
    grade: TeamGrade.ALS, 
    baseStation: 'North',
    status: TeamStatus.AVAILABLE, 
    members: INITIAL_USERS.filter(u => u.id === 2 || u.id === 3)
  },
  { 
    id: 2, 
    name: 'Bravo Team', 
    grade: TeamGrade.BLS,
    baseStation: 'South',
    status: TeamStatus.DISPATCHED, 
    members: INITIAL_USERS.filter(u => u.id === 4),
    assignedCallId: 1,
  },
];

const now = new Date();

export const INITIAL_CALLS: EmergencyCall[] = [
    {
        id: 1,
        callerName: 'John Doe',
        phone: '555-1234',
        location: '123 Main St, Anytown',
        description: 'Chest pain and difficulty breathing.',
        priority: 1,
        timestamp: new Date(now.getTime() - 10 * 60000), // 10 mins ago
        status: CallStatus.DISPATCHED,
        assignedTeamId: 2,
        dispatchTimestamp: new Date(now.getTime() - 8 * 60000),
        isSynced: true,
        notes: [],
    },
    {
        id: 2,
        callerName: 'Jane Smith',
        phone: '555-5678',
        location: '456 Oak Ave, Anytown',
        description: 'Fall from a ladder, possible broken leg.',
        priority: 2,
        timestamp: new Date(now.getTime() - 30 * 60000),
        status: CallStatus.PENDING,
        isSynced: true,
        notes: [],
    },
    {
        id: 3,
        callerName: 'Bob Johnson',
        phone: '555-8765',
        location: '789 Pine Ln, Anytown',
        description: 'Minor car accident, driver complaining of neck pain.',
        priority: 3,
        timestamp: new Date(now.getTime() - 60 * 60000),
        status: CallStatus.COMPLETED,
        assignedTeamId: 1,
        pcrId: 1,
        dispatchTimestamp: new Date(now.getTime() - 58 * 60000),
        onSceneTimestamp: new Date(now.getTime() - 45 * 60000),
        completedTimestamp: new Date(now.getTime() - 20 * 60000),
        isSynced: true,
        notes: [],
    },
];

export const INITIAL_SCHEDULE: Schedule = (['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as Day[]).map(day => ({
    day,
    shifts: {
        dayShift: { teamId: null },
        nightShift: { teamId: null },
    }
}));

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [];