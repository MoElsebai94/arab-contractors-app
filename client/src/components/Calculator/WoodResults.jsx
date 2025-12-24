import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const WoodResults = ({ calculateWood }) => {
    const { t } = useLanguage();
    const results = calculateWood();

    return (
        <div className="results-container">
            <h3>{t('woodRequirements')}</h3>
            <div className="results-grid">
                {Object.entries(results).map(([key, value]) => {
                    if (key === 'totalPrice') return null;
                    return (
                        <div key={key} className={`result-card ${value > 0 ? 'active' : ''}`}>
                            <span className="result-label" style={{ textTransform: 'capitalize' }}>{key}</span>
                            <span className="result-value">{Math.ceil(value)}</span>
                            <span className="result-unit">{t('units')}</span>
                        </div>
                    );
                })}
            </div>

            <div className="total-price-card" style={{
                marginTop: '1.5rem',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                padding: '1.5rem',
                borderRadius: 'var(--radius-md)',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 6px -1px rgba(217, 119, 6, 0.2)'
            }}>
                <span style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>{t('estimatedTotalCost')}</span>
                <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                    {results.totalPrice?.toLocaleString()} FCFA
                </span>
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

export default WoodResults;
