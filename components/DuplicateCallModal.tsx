import React from 'react';
import { EmergencyCall } from '../types';
import { AlertIcon } from './icons/AlertIcon';

interface DuplicateCallModalProps {
  duplicateInfo: {
    existingCalls: EmergencyCall[];
    newCallData: Omit<EmergencyCall, 'id' | 'timestamp' | 'status'>;
  };
  onLink: (existingCallId: number) => void;
  onCreateNew: () => void;
  onCancel: () => void;
}

const DuplicateCallModal: React.FC<DuplicateCallModalProps> = ({ duplicateInfo, onLink, onCreateNew, onCancel }) => {
    const { existingCalls, newCallData } = duplicateInfo;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-2xl">
                <div className="flex items-start gap-4">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/50 sm:mx-0 sm:h-10 sm:w-10">
                        <AlertIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:text-left flex-grow">
                        <h3 className="text-lg leading-6 font-bold text-gray-900 dark:text-gray-100" id="modal-title">
                            Potential Duplicate Incident
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                An open incident was found from the same phone number (<span className="font-semibold">{newCallData.phone}</span>) within the last 2 hours. Please review.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-4 max-h-60 overflow-y-auto space-y-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">Existing Incident(s):</h4>
                    {existingCalls.map(call => (
                        <div key={call.id} className="text-sm border-l-4 border-yellow-500 pl-3 py-2 bg-white dark:bg-gray-800 rounded-r-md">
                            <p><strong>ID {call.id}:</strong> {call.location} ({call.status})</p>
                            <p className="text-gray-600 dark:text-gray-400">"{call.description}"</p>
                            <div className="text-right mt-1">
                                <button
                                    onClick={() => onLink(call.id)}
                                    className="text-sm bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-3 rounded-md shadow-sm transition-colors"
                                >
                                    Link New Report to This Incident
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">New Report Information:</h4>
                     <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">"{newCallData.description}"</p>
                </div>

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:col-start-2 sm:text-sm"
                        onClick={onCreateNew}
                    >
                        Create New Incident Anyway
                    </button>
                    <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-500 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none sm:mt-0 sm:col-start-1 sm:text-sm"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DuplicateCallModal;
