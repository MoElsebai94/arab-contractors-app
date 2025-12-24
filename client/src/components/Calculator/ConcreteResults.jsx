import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const ConcreteResults = ({ calculatorParams, calculateConcreteVolume, calculateTotalVolume, calculateBags, calculateTotalBags }) => {
    const { t } = useLanguage();

    return (
        <div className="results-container">
            <h3>{t('volumeM3')}</h3>
            <div className="concrete-grid mb-8">
                {['bp', 'radier', 'piedroit', 'dalle'].map(part => (
                    <div className="concrete-card" key={part}>
                        <span className="result-label" style={{ textTransform: 'capitalize' }}>{part === 'bp' ? 'B.P' : part}</span>
                        <span className="result-value">{calculateConcreteVolume(part)}</span>
                        <span className="result-unit">m³</span>
                    </div>
                ))}
                <div className="concrete-card total">
                    <span className="result-label">Total</span>
                    <span className="result-value">{calculateTotalVolume()}</span>
                    <span className="result-unit">m³</span>
                </div>
            </div>

            <h3>{t('cementBags')}</h3>
            <div className="concrete-grid">
                {['bp', 'radier', 'piedroit', 'dalle'].map(part => (
                    <div className="concrete-card" key={part}>
                        <span className="result-label" style={{ textTransform: 'capitalize' }}>{part === 'bp' ? 'B.P' : part}</span>
                        <span className="result-value">{calculateBags(part)}</span>
                        <span className="result-unit">{t('bags')}</span>
                    </div>
                ))}
                <div className="concrete-card total">
                    <span className="result-label">Total</span>
                    <span className="result-value">{calculateTotalBags()}</span>
                    <span className="result-unit">{t('bags')}</span>
                </div>
            </div>
            <style>{`
                 .concrete-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
                    gap: 1rem;
                }

                .mb-8 {
                    margin-bottom: 2rem;
                }

                .concrete-card {
                    background: var(--bg-secondary);
                    padding: 1rem;
                    border-radius: var(--radius-md);
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.25rem;
                    border: 1px solid transparent;
                }

                .concrete-card.total {
                    background: var(--primary-light);
                    color: white;
                }

                 .concrete-card.total .result-label,
                .concrete-card.total .result-value,
                .concrete-card.total .result-unit {
                    color: white;
                }
            `}</style>
        </div>
    );
};

export default ConcreteResults;
