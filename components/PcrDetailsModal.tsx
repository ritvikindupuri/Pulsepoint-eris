import React from 'react';
import { PatientCareRecord, EmergencyCall } from '../types';
import { FileTextIcon } from './icons/FileTextIcon';

interface PcrDetailsModalProps {
    pcr: PatientCareRecord;
    call: EmergencyCall | undefined;
    onClose: () => void;
}

const PcrDetailsModal: React.FC<PcrDetailsModalProps> = ({ pcr, call, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-2xl">
                <div className="flex items-center gap-3 mb-4 border-b dark:border-gray-700 pb-3">
                    <FileTextIcon className="h-6 w-6 text-blue-500" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Patient Care Record #{pcr.id}</h3>
                </div>

                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    {call && (
                        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Associated Incident (Call #{call.id})</h4>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700 dark:text-gray-300">
                                <p><strong>Location:</strong> {call.location}</p>
                                <p><strong>Time:</strong> {call.timestamp.toLocaleString()}</p>
                                <p><strong>Description:</strong> {call.description}</p>
                            </div>
                        </div>
                    )}

                    <DetailSection title="Patient Vitals" content={pcr.patientVitals} />
                    <DetailSection title="Treatments Administered" content={pcr.treatmentsAdministered} />
                    <DetailSection title="Medications Given" content={pcr.medications} />
                    <DetailSection title="Transfer Destination" content={pcr.transferDestination} />
                    {pcr.notes && <DetailSection title="Additional Notes" content={pcr.notes} />}
                </div>

                <div className="flex justify-end mt-6">
                    <button onClick={onClose} className="py-2 px-6 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition">Close</button>
                </div>
            </div>
        </div>
    );
};

const DetailSection: React.FC<{title: string, content: string}> = ({ title, content }) => (
    <div>
        <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</h4>
        <p className="mt-1 p-3 bg-gray-100 dark:bg-gray-900 rounded-md text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{content}</p>
    </div>
)


export default PcrDetailsModal;