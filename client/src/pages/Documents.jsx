import React, { useState } from 'react';
import DemandeAchatForm from '../components/Documents/DemandeAchatForm';
import { useLanguage } from '../context/LanguageContext';
import { FileText, Files } from 'lucide-react';

const Documents = () => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('demandeAchat');

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                    <Files className="text-blue-600" />
                    Documents Generator
                </h1>
                <p className="text-slate-500 mt-2">
                    Create and download official project documents.
                </p>
            </header>

            {/* Tabs for future documents */}
            <div className="flex gap-4 mb-8 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('demandeAchat')}
                    className={`pb-3 px-1 font-medium text-sm transition-colors border-b-2 ${activeTab === 'demandeAchat'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Demande d'Achat
                </button>
                {/* Future tabs can go here */}
            </div>

            <div className="content-area">
                {activeTab === 'demandeAchat' && <DemandeAchatForm />}
            </div>
        </div>
    );
};

export default Documents;
