
export enum UserRole {
  DISPATCHER = 'Dispatcher',
  EMT = 'EMT',
  SUPERVISOR = 'Supervisor',
  COO = 'COO',
  ADMIN = 'Admin',
}

export enum EmtStatus {
    ON_DUTY = 'On Duty',
    OFF_DUTY = 'Off Duty',
    ON_BREAK = 'On Break',
    PENDING_CLOCK_IN = 'Pending Clock-In',
    PENDING_CLOCK_OUT = 'Pending Clock-Out',
}

export interface User {
  id: number;
  username: string;
  password?: string;
  role: UserRole;
  status: EmtStatus | null;
  teamId?: number;
  certifications?: string[];
}

export enum CallStatus {
  PENDING = 'Pending',
  DISPATCHED = 'Dispatched',
  ON_SCENE = 'On Scene',
  TRANSPORTING = 'Transporting',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

export type Priority = 1 | 2 | 3 | 4;

export interface EmergencyCall {
  id: number;
  callerName: string;
  phone: string;
  location: string;
  landmark?: string;
  description: string;
  priority: Priority;
  timestamp: Date;
  status: CallStatus;
  assignedTeamId?: number;
  pcrId?: number;
  dispatchTimestamp?: Date;
  onSceneTimestamp?: Date;
  completedTimestamp?: Date;
  isSynced?: boolean;
  notes?: string[];
}

export interface PatientCareRecord {
  id: number;
  callId: number;
  patientVitals: string;
  treatmentsAdministered: string;
  medications: string;
  transferDestination: string;
  notes?: string;
  isSynced: boolean;
}

export enum TeamStatus {
    AVAILABLE = 'Available',
    DISPATCHED = 'Dispatched',
    ON_SCENE = 'On Scene',
    TRANSPORTING = 'Transporting',
    AT_HOSPITAL = 'At Hospital',
    CLEARING = 'Clearing',
}

export enum TeamGrade {
    ALS = 'ALS',
    BLS = 'BLS',
}

export type BaseStation = 'North' | 'South' | 'East' | 'West';

export interface Team {
    id: number;
    name: string;
    grade: TeamGrade;
    baseStation: BaseStation;
    status: TeamStatus;
    members: User[];
    assignedCallId?: number;
}

export interface Shift {
  teamId: number | null;
}

export type Day = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface DaySchedule {
  day: Day;
  shifts: {
    dayShift: Shift;
    nightShift: Shift;
  };
}

export type Schedule = DaySchedule[];

export interface AuditLogEntry {
    id: number;
    timestamp: Date;
    user: string;
    action: string;
    details?: string;
}