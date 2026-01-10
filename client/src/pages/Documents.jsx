import React, { useState } from 'react';
import DemandeAchatForm from '../components/Documents/DemandeAchatForm';
import { useLanguage } from '../context/LanguageContext';
import { FileText, Files } from 'lucide-react';

const Documents = () => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('demandeAchat');

    return (
        <div className="app-container" style={{ flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <div className="main-content" style={{ padding: '2rem', overflowY: 'auto' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

                    {/* Header */}
                    <header style={{ marginBottom: '2.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                            <div style={{
                                backgroundColor: 'white',
                                padding: '0.75rem',
                                borderRadius: '1rem',
                                border: '1px solid var(--border-color)',
                                boxShadow: 'var(--shadow-sm)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Files size={32} color="var(--primary-color)" />
                            </div>
                            <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary-color)', margin: 0 }}>
                                Documents Generator
                            </h1>
                        </div>
                        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginLeft: '0.25rem' }}>
                            Create and download official project documents with ease.
                        </p>
                    </header>

                    {/* Tabs */}
                    <div style={{
                        display: 'flex',
                        gap: '2rem',
                        marginBottom: '2.5rem',
                        borderBottom: '1px solid var(--border-color)',
                        paddingBottom: '0.25rem'
                    }}>
                        <button
                            onClick={() => setActiveTab('demandeAchat')}
                            style={{
                                padding: '0 0.5rem 1rem 0.5rem',
                                background: 'none',
                                border: 'none',
                                borderBottom: activeTab === 'demandeAchat' ? '2px solid var(--primary-color)' : '2px solid transparent',
                                color: activeTab === 'demandeAchat' ? 'var(--primary-color)' : 'var(--text-secondary)',
                                fontWeight: activeTab === 'demandeAchat' ? '600' : '500',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                position: 'relative',
                                marginBottom: '-1px'
                            }}
                        >
                            Demande d'Achat
                        </button>
                    </div>

                    <div className="animate-fade-in">
                        {activeTab === 'demandeAchat' && <DemandeAchatForm />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Documents;
