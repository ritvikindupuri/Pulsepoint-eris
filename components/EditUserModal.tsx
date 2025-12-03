
import React, { useState } from 'react';
import { User } from '../types';

interface EditUserModalProps {
    user: User;
    onSave: (updatedUser: User) => void;
    onCancel: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onSave, onCancel }) => {
    const [certifications, setCertifications] = useState((user.certifications || []).join(', '));

    const handleSave = () => {
        const certsArray = certifications.split(',').map(c => c.trim()).filter(Boolean);
        onSave({ ...user, certifications: certsArray });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-md">
                <h3 className="text-lg font-bold mb-1 text-gray-900 dark:text-gray-100">Edit Personnel</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Editing profile for <span className="font-semibold">{user.username}</span>.</p>
                
                <div>
                    <label htmlFor="certifications" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Certifications</label>
                    <input
                        type="text"
                        id="certifications"
                        value={certifications}
                        onChange={e => setCertifications(e.target.value)}
                        className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                        placeholder="e.g., EMT-B, PALS, ACLS"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Enter certifications separated by commas.</p>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onCancel} className="py-2 px-4 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition">Cancel</button>
                    <button onClick={handleSave} className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

export default EditUserModal;