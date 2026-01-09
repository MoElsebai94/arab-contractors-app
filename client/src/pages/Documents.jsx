import React, { useState } from 'react';
import DemandeAchatForm from '../components/Documents/DemandeAchatForm';
import { useLanguage } from '../context/LanguageContext';
import { FileText, Files } from 'lucide-react';

const Documents = () => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('demandeAchat');

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-12">
            <div className="max-w-5xl mx-auto">
                <header className="mb-10">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 flex items-center gap-4 mb-3 tracking-tight">
                        <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                            <Files className="text-blue-600 w-8 h-8" />
                        </div>
                        Documents Generator
                    </h1>
                    <p className="text-lg text-slate-500 ml-1">
                        Create and download official project documents with ease.
                    </p>
                </header>

                {/* Tabs */}
                <div className="flex gap-6 mb-10 border-b border-slate-200/60 pb-1">
                    <button
                        onClick={() => setActiveTab('demandeAchat')}
                        className={`pb-4 px-2 font-semibold text-sm transition-all relative ${activeTab === 'demandeAchat'
                            ? 'text-blue-600'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Demande d'Achat
                        {activeTab === 'demandeAchat' && (
                            <span className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-blue-600 rounded-full" />
                        )}
                    </button>
                    {/* Future tabs can go here */}
                </div>

                <div className="content-area animate-fade-in">
                    {activeTab === 'demandeAchat' && <DemandeAchatForm />}
                </div>
            </div>
        </div>
    );
};

export default Documents;
