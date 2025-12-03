
import React, { useState, useEffect, useRef } from 'react';
import { EmergencyCall, Team, TeamStatus } from '../types';
import { GpsIcon } from './icons/GpsIcon';
import { TeamIcon } from './icons/TeamIcon';

interface LiveMapPanelProps {
  activeCalls: EmergencyCall[];
  teams: Team[];
}

interface Position {
    top: number;
    left: number;
}

type PositionsState = Record<string, Position>;

const LiveMapPanel: React.FC<LiveMapPanelProps> = ({ activeCalls, teams }) => {
    const [positions, setPositions] = useState<PositionsState>({});
    const mapRef = useRef<HTMLDivElement>(null);

    // Helper to generate a random position within the map bounds
    const getRandomPosition = (): Position => ({
        top: Math.random() * 90 + 5, // Keep icons away from the very edge
        left: Math.random() * 90 + 5,
    });
    
    // Initialize positions on mount or when teams/calls change
    useEffect(() => {
        setPositions(prev => {
            const newPositions: PositionsState = {};
            const allEntities = [
                ...teams.map(t => ({ id: `team-${t.id}`})),
                ...activeCalls.map(c => ({ id: `call-${c.id}`}))
            ];
            allEntities.forEach(entity => {
                newPositions[entity.id] = prev[entity.id] || getRandomPosition();
            });
            return newPositions;
        });
    }, [teams, activeCalls]);

    // Simulation effect for movement
    useEffect(() => {
        const interval = setInterval(() => {
            setPositions(currentPositions => {
                const newPositions = { ...currentPositions };
                
                teams.forEach(team => {
                    const teamKey = `team-${team.id}`;
                    const currentPos = newPositions[teamKey];
                    if (!currentPos) return;

                    let newTop = currentPos.top;
                    let newLeft = currentPos.left;

                    if (team.status === TeamStatus.DISPATCHED && team.assignedCallId) {
                        const callKey = `call-${team.assignedCallId}`;
                        const callPos = newPositions[callKey];
                        // Only move if team is not yet at destination
                        if (callPos && (Math.abs(callPos.top - currentPos.top) > 2 || Math.abs(callPos.left - currentPos.left) > 2)) {
                            // Move towards the call
                            newTop += (callPos.top - currentPos.top) * 0.15;
                            newLeft += (callPos.left - currentPos.left) * 0.15;
                        }
                    } else if (team.status === TeamStatus.AVAILABLE) {
                        // Random "patrol" movement for available teams
                        newTop += (Math.random() - 0.5) * 4;
                        newLeft += (Math.random() - 0.5) * 4;
                    }
                    
                    // Clamp values to stay within bounds [5, 95]
                    newPositions[teamKey] = {
                        top: Math.max(5, Math.min(95, newTop)),
                        left: Math.max(5, Math.min(95, newLeft)),
                    };
                });
                
                return newPositions;
            });
        }, 2000); // Update every 2 seconds

        return () => clearInterval(interval);
    }, [teams]);

    const getTeamColor = (status: TeamStatus) => {
        switch(status) {
            case TeamStatus.AVAILABLE: return 'text-green-500';
            case TeamStatus.DISPATCHED: return 'text-blue-500';
            case TeamStatus.ON_SCENE: return 'text-yellow-500';
            case TeamStatus.TRANSPORTING: return 'text-purple-500';
            default: return 'text-gray-500';
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 flex-1 flex flex-col min-h-[300px]">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Live Status Map</h3>
            <div ref={mapRef} className="flex-grow bg-gray-800 dark:bg-gray-900 rounded-md relative overflow-hidden bg-[radial-gradient(#4a5568_1px,transparent_1px)] [background-size:16px_16px]">
                {/* Render Calls */}
                {activeCalls.map(call => {
                    const pos = positions[`call-${call.id}`];
                    if (!pos) return null;
                    return (
                        <div 
                            key={`call-${call.id}`}
                            className="absolute group"
                            style={{ top: `${pos.top}%`, left: `${pos.left}%`, transform: 'translate(-50%, -50%)' }}
                        >
                            <GpsIcon className={`h-7 w-7 ${call.priority === 1 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`} />
                             <div className="absolute bottom-full mb-2 w-56 bg-gray-900/90 backdrop-blur-sm text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg text-left">
                                <p className="font-bold border-b border-gray-700 pb-1 mb-1">P{call.priority}: {call.location}</p>
                                <p><span className="font-semibold text-gray-400">Caller:</span> {call.callerName}</p>
                                <p><span className="font-semibold text-gray-400">Desc:</span> {call.description.substring(0, 40)}{call.description.length > 40 ? '...' : ''}</p>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900/90"></div>
                            </div>
                        </div>
                    );
                })}
                {/* Render Teams */}
                {teams.map(team => {
                    const pos = positions[`team-${team.id}`];
                    const assignedCall = team.assignedCallId ? activeCalls.find(c => c.id === team.assignedCallId) : null;
                    if (!pos) return null;
                    return (
                        <div
                            key={`team-${team.id}`}
                            className="absolute group transition-all duration-2000 ease-linear z-10"
                            style={{ top: `${pos.top}%`, left: `${pos.left}%`, transform: 'translate(-50%, -50%)' }}
                        >
                            <TeamIcon className={`h-8 w-8 ${getTeamColor(team.status)}`} />
                            <div className="absolute bottom-full mb-2 w-56 bg-gray-900/90 backdrop-blur-sm text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg text-left">
                                <p className="font-bold border-b border-gray-700 pb-1 mb-1">{team.name} ({team.grade})</p>
                                <p><span className="font-semibold text-gray-400">Status:</span> {team.status}</p>
                                <p><span className="font-semibold text-gray-400">Members:</span> {team.members.map(m => m.username).join(', ')}</p>
                                {assignedCall && (
                                    <p><span className="font-semibold text-gray-400">Assigned:</span> {assignedCall.location}</p>
                                )}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900/90"></div>
                            </div>
                        </div>
                    );
                })}

                 <div className="absolute bottom-2 left-2 bg-white/80 dark:bg-gray-900/80 p-2 rounded-md text-xs text-gray-800 dark:text-gray-200 z-10">
                    <h4 className="font-bold mb-1">Legend</h4>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div> Team Available</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Team Dispatched</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500"></div> Team On Scene</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500"></div> Team Transporting</div>
                    <div className="w-full h-[1px] bg-gray-400/50 my-1"></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div> P1 Call</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-400"></div> Other Calls</div>
                </div>
            </div>
        </div>
    );
};

export default LiveMapPanel;
