import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const IronResults = ({ calculateIron }) => {
    const { t } = useLanguage();

    return (
        <div className="results-container">
            <h3>{t('calculatedRequirements')}</h3>
            <div className="results-grid">
                {['Φ6', 'Φ8', 'Φ10', 'Φ12', 'Φ14', 'Φ16'].map(phi => (
                    <div key={phi} className={`result-card ${calculateIron(phi) > 0 ? 'active' : ''} color-${phi.toLowerCase().replace('φ', 'phi')}`}>
                        <span className="result-label">{phi}</span>
                        <span className="result-value">{calculateIron(phi) || "-"}</span>
                        <span className="result-unit">{t('bars')}</span>
                    </div>
                ))}
            </div>
            <style>{`
                .results-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    gap: 1rem;
                }
                .result-card {
                    background: var(--bg-secondary);
                    padding: 1.5rem 1rem;
                    border-radius: var(--radius-md);
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                    border: 1px solid transparent;
                    transition: all 0.2s;
                }

                .result-card.active {
                    background: white;
                    border-color: var(--border);
                    box-shadow: var(--shadow-sm);
                }

                .color-phi6.active { border-bottom: 3px solid #f59e0b; }
                .color-phi8.active { border-bottom: 3px solid #1e293b; }
                .color-phi10.active { border-bottom: 3px solid #10b981; }
                .color-phi12.active { border-bottom: 3px solid #8b5cf6; }
                .color-phi14.active { border-bottom: 3px solid #ef4444; }
                .color-phi16.active { border-bottom: 3px solid #ec4899; }

                .result-label {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--text-secondary);
                }

                .result-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--text-main);
                }
                   .result-unit {
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                }
             `}</style>
        </div>
    );
};

export default IronResults;
