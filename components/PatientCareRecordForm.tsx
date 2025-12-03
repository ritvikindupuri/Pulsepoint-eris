
import React, { useState } from 'react';
import { EmergencyCall, PatientCareRecord } from '../types';
import { FileTextIcon } from './icons/FileTextIcon';
import { GoogleGenAI } from "@google/genai";
import { SparklesIcon } from './icons/SparklesIcon';
import { DownloadIcon } from './icons/DownloadIcon';


interface PatientCareRecordFormProps {
  call: EmergencyCall;
  onSubmit: (pcrData: Omit<PatientCareRecord, 'id' | 'callId' | 'isSynced'>) => void;
  onCancel: () => void;
}

const PatientCareRecordForm: React.FC<PatientCareRecordFormProps> = ({ call, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    patientVitals: '',
    treatmentsAdministered: '',
    medications: '',
    transferDestination: '',
    notes: '',
  });

  const [generatedNarrative, setGeneratedNarrative] = useState('');
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleGenerateNarrative = async () => {
    setIsGeneratingNarrative(true);
    setGeneratedNarrative('');
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const rawNotes = `
            Vitals: ${formData.patientVitals || 'Not specified'}.
            Treatments: ${formData.treatmentsAdministered || 'Not specified'}.
            Medications: ${formData.medications || 'Not specified'}.
            Notes: ${formData.notes || 'Not specified'}.
            Destination: ${formData.transferDestination || 'Not specified'}.
            Incident: ${call.description}
        `;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: `You are an expert paramedic writing a patient care report. Convert the following raw notes into a professional, concise narrative suitable for an official PCR. Use standard medical terminology and abbreviations (e.g., "c/o" for "complains of", "Hx" for "history"). Ensure the narrative is clear, objective, and chronologically ordered. Raw Notes: \n${rawNotes}`
        });

        setGeneratedNarrative(response.text);

    } catch (error) {
        console.error("Error generating narrative:", error);
        setGeneratedNarrative("Error: Could not generate narrative.");
    } finally {
        setIsGeneratingNarrative(false);
    }
  };

  const handleUseNarrative = () => {
    setFormData(prev => ({...prev, notes: generatedNarrative}));
  };

  return (
    <div className="container mx-auto mt-10 p-6">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6 border-b dark:border-gray-700 pb-4">
            <FileTextIcon className="h-8 w-8 text-blue-500"/>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Patient Care Record</h2>
        </div>
        
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Incident Details</h3>
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-700 dark:text-gray-300">
                <p><span className="font-medium">Location:</span> {call.location}</p>
                <p><span className="font-medium">Time:</span> {call.timestamp.toLocaleString()}</p>
                <p><span className="font-medium">Caller:</span> {call.callerName}</p>
                <p><span className="font-medium">Priority:</span> {call.priority}</p>
            </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label htmlFor="patientVitals" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Patient Vitals</label>
              <textarea name="patientVitals" id="patientVitals" rows={3} value={formData.patientVitals} onChange={handleChange} required placeholder="e.g., BP: 120/80, HR: 85, SpO2: 98%" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-200"></textarea>
            </div>
             <div>
              <label htmlFor="treatmentsAdministered" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Treatments Administered</label>
              <textarea name="treatmentsAdministered" id="treatmentsAdministered" rows={3} value={formData.treatmentsAdministered} onChange={handleChange} required placeholder="e.g., Oxygen administered via nasal cannula at 2L/min" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-200"></textarea>
            </div>
             <div>
              <label htmlFor="medications" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Medications Given</label>
              <input type="text" name="medications" id="medications" value={formData.medications} onChange={handleChange} placeholder="e.g., Aspirin 324mg PO" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-200"/>
            </div>
             <div>
              <label htmlFor="transferDestination" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Transfer Destination</label>
              <input type="text" name="transferDestination" id="transferDestination" value={formData.transferDestination} onChange={handleChange} required placeholder="e.g., Mercy General Hospital" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-200"/>
            </div>
          </div>

          <div className="mt-6 border-t dark:border-gray-700 pt-6">
            <div className="flex justify-between items-center">
                <label htmlFor="generatedNarrative" className="block text-sm font-medium text-gray-700 dark:text-gray-300">AI Scribe</label>
                <button type="button" onClick={handleGenerateNarrative} disabled={isGeneratingNarrative} className="flex items-center gap-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1 px-3 rounded-md shadow-sm transition-colors disabled:opacity-50">
                    {isGeneratingNarrative ? <SparklesIcon className="h-4 w-4 animate-spin"/> : <SparklesIcon className="h-4 w-4" />}
                    {isGeneratingNarrative ? 'Generating...' : 'Generate Narrative'}
                </button>
            </div>
            <textarea name="generatedNarrative" id="generatedNarrative" rows={5} value={generatedNarrative} onChange={(e) => setGeneratedNarrative(e.target.value)} placeholder="Click 'Generate Narrative' to create a summary from the fields above, then review and edit as needed..." className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none sm:text-sm text-gray-900 dark:text-gray-200"></textarea>
             {generatedNarrative && (
                <div className="text-right mt-2">
                    <button type="button" onClick={handleUseNarrative} className="flex items-center gap-2 text-sm bg-teal-600 hover:bg-teal-700 text-white font-semibold py-1 px-3 rounded-md shadow-sm transition-colors">
                        <DownloadIcon className="h-4 w-4 transform -rotate-90"/> Use Narrative in Notes
                    </button>
                </div>
            )}
          </div>

          <div className="mt-6">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Final Narrative / Additional Notes</label>
            <textarea name="notes" id="notes" rows={4} value={formData.notes} onChange={handleChange} placeholder="The final narrative for the report. You can use the AI scribe above and copy the text here." className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-200"></textarea>
          </div>

          <div className="mt-8 flex justify-end space-x-4">
            <button type="button" onClick={onCancel} className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100 font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out">
              Cancel
            </button>
            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out">
              Submit Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientCareRecordForm;