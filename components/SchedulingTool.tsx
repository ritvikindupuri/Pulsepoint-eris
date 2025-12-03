
import React, { useState, useMemo, useEffect } from 'react';
import { Schedule, Team, Day, User, TeamGrade, BaseStation, UserRole } from '../types';
import { CalendarIcon } from './icons/CalendarIcon';
import { AlertIcon } from './icons/AlertIcon';

interface SchedulingToolProps {
    schedule: Schedule;
    teams: Team[];
    users: User[];
    onSave: (updatedSchedule: Schedule) => void;
    onCancel: () => void;
}

const ALS_CERTIFICATIONS = ['EMT-P', 'ACLS', 'PALS'];

type ValidationError = {
    day: Day;
    shift: 'dayShift' | 'nightShift';
    message: string;
};

const SchedulingTool: React.FC<SchedulingToolProps> = ({ schedule, teams, users, onSave, onCancel }) => {
    const [localSchedule, setLocalSchedule] = useState<Schedule>(JSON.parse(JSON.stringify(schedule)));
    const [gradeFilter, setGradeFilter] = useState<TeamGrade | 'all'>('all');
    const [stationFilter, setStationFilter] = useState<BaseStation | 'all'>('all');
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

    useEffect(() => {
        const errors: ValidationError[] = [];
        const emtSchedule: Record<Day, { dayShift: number[], nightShift: number[] }> = {} as any;

        // Populate EMT schedule map
        localSchedule.forEach(daySchedule => {
            emtSchedule[daySchedule.day] = { dayShift: [], nightShift: [] };
            ['dayShift', 'nightShift'].forEach(shift => {
                const teamId = daySchedule.shifts[shift as 'dayShift' | 'nightShift'].teamId;
                if (teamId) {
                    const team = teams.find(t => t.id === teamId);
                    if (team) {
                        emtSchedule[daySchedule.day][shift as 'dayShift' | 'nightShift'] = team.members.map(m => m.id);
                    }
                }
            });
        });

        // Run validations
        localSchedule.forEach(daySchedule => {
            const day = daySchedule.day;
            // BR-SCHED-01: No EMT > 12 hours (i.e., on both shifts in one day)
            const dayMembers = emtSchedule[day].dayShift;
            const nightMembers = emtSchedule[day].nightShift;
            const overlappingMembers = dayMembers.filter(id => nightMembers.includes(id));
            if (overlappingMembers.length > 0) {
                const usernames = users.filter(u => overlappingMembers.includes(u.id)).map(u => u.username).join(', ');
                errors.push({ day, shift: 'dayShift', message: `Conflict: ${usernames} double-booked.` });
                errors.push({ day, shift: 'nightShift', message: `Conflict: ${usernames} double-booked.` });
            }

            // BR-SCHED-02: ALS team needs at least 1 ALS cert
            ['dayShift', 'nightShift'].forEach(shiftKey => {
                const shift = shiftKey as 'dayShift' | 'nightShift';
                const teamId = daySchedule.shifts[shift].teamId;
                const team = teams.find(t => t.id === teamId);
                if (team && team.grade === TeamGrade.ALS) {
                    const hasALSCert = team.members.some(member => member.certifications?.some(cert => ALS_CERTIFICATIONS.includes(cert)));
                    if (!hasALSCert) {
                        errors.push({ day, shift, message: 'ALS team requires paramedic.' });
                    }
                }
            });
        });
        setValidationErrors(errors);
    }, [localSchedule, teams, users]);

    const filteredTeams = useMemo(() => {
        return teams.filter(team => 
            (gradeFilter === 'all' || team.grade === gradeFilter) &&
            (stationFilter === 'all' || team.baseStation === stationFilter)
        );
    }, [teams, gradeFilter, stationFilter]);

    const handleShiftChange = (day: Day, shiftType: 'dayShift' | 'nightShift', teamId: string) => {
        const newSchedule = localSchedule.map(d => {
            if (d.day === day) {
                return { ...d, shifts: { ...d.shifts, [shiftType]: { teamId: teamId ? parseInt(teamId) : null } } };
            }
            return d;
        });
        setLocalSchedule(newSchedule);
    };
    
    const handlePublish = () => {
        const hasEmptySlots = localSchedule.some(d => d.shifts.dayShift.teamId === null || d.shifts.nightShift.teamId === null);
        if (hasEmptySlots) {
            if (window.confirm("Warning: Some shifts are unassigned. Do you want to publish anyway?")) {
                onSave(localSchedule);
            }
        } else {
            onSave(localSchedule);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-6xl">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4">
                    <div className="flex items-center gap-3">
                        <CalendarIcon className="h-6 w-6 text-purple-500" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Weekly Schedule</h3>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <select onChange={e => setStationFilter(e.target.value as BaseStation | 'all')} value={stationFilter} className="text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md py-1">
                            <option value="all">Filter Station...</option>
                            <option value="North">North</option><option value="South">South</option><option value="East">East</option><option value="West">West</option>
                        </select>
                        <select onChange={e => setGradeFilter(e.target.value as TeamGrade | 'all')} value={gradeFilter} className="text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md py-1">
                            <option value="all">Filter Grade...</option><option value={TeamGrade.ALS}>ALS</option><option value={TeamGrade.BLS}>BLS</option>
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-200 dark:border-gray-700">
                        <thead>
                            <tr className="bg-gray-100 dark:bg-gray-700/50">
                                <th className="p-2 border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300">Shift</th>
                                {localSchedule.map(({ day }) => <th key={day} className="p-2 border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300">{day}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {['dayShift', 'nightShift'].map(shiftTypeStr => {
                                const shiftType = shiftTypeStr as 'dayShift' | 'nightShift';
                                return (
                                <tr key={shiftType} className="text-center">
                                    <td className="p-2 border border-gray-200 dark:border-gray-600 font-semibold text-sm capitalize text-gray-700 dark:text-gray-200">{shiftType.replace('Shift', ' Shift')}</td>
                                    {localSchedule.map(({ day, shifts }) => {
                                        const error = validationErrors.find(e => e.day === day && e.shift === shiftType);
                                        return (
                                        <td key={`${day}-${shiftType}`} className="p-1 border border-gray-200 dark:border-gray-600">
                                            <select 
                                                value={shifts[shiftType].teamId || ''}
                                                onChange={(e) => handleShiftChange(day, shiftType, e.target.value)}
                                                className={`w-full p-1.5 border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md text-xs focus:ring-indigo-500 focus:border-indigo-500 ${error ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                            >
                                                <option value="">Unassigned</option>
                                                {filteredTeams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                                            </select>
                                            {error && <p title={error.message} className="text-xs text-red-500 mt-1 flex items-center justify-center gap-1"><AlertIcon className="h-3 w-3" /> {error.message}</p>}
                                        </td>
                                    )})}
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onCancel} className="py-2 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100 font-bold rounded-md transition">Cancel</button>
                    <button onClick={handlePublish} disabled={validationErrors.length > 0} className="py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed">Publish Schedule</button>
                </div>
            </div>
        </div>
    );
};

export default SchedulingTool;
