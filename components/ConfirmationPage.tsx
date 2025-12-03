import React from 'react';

interface ConfirmationPageProps {
    message: string;
    onBack: () => void;
    backButtonText?: string;
}

const ConfirmationPage: React.FC<ConfirmationPageProps> = ({ message, onBack, backButtonText = "Back to Dashboard" }) => {
    return (
        <div className="container mx-auto mt-10 p-6">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-lg mx-auto text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">{message}</h2>
                <button
                    onClick={onBack}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded transition duration-300 ease-in-out"
                >
                    {backButtonText}
                </button>
            </div>
        </div>
    );
};

export default ConfirmationPage;