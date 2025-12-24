import React from 'react';
import { BrickWall, ChevronDown, Ruler } from 'lucide-react';
import ConfigTrigger from './ConfigTrigger';
import { useLanguage } from '../../context/LanguageContext';

const CalculatorInputs = ({ calculatorParams, setCalculatorParams }) => {
    const { t } = useLanguage();

    const handleSectionChange = (e) => {
        const newSectionType = e.target.value;
        let newTetes = calculatorParams.tetes;
        let newPuisard = calculatorParams.puisard;

        if (newSectionType !== '1x1') {
            newTetes = '2';
            newPuisard = '0';
        }

        setCalculatorParams({
            ...calculatorParams,
            sectionType: newSectionType,
            tetes: newTetes,
            puisard: newPuisard
        });
    };

    const handleConfigToggle = () => {
        const isPuisard = calculatorParams.puisard === '1';
        setCalculatorParams({
            ...calculatorParams,
            tetes: isPuisard ? '2' : '1',
            puisard: isPuisard ? '0' : '1'
        });
    };

    const handleLengthChange = (e) => {
        const val = e.target.value;
        const num = parseFloat(val);
        if (val === '') {
            setCalculatorParams({ ...calculatorParams, dalotLength: '' });
        } else if (!isNaN(num) && num >= 0) {
            setCalculatorParams({ ...calculatorParams, dalotLength: num });
        }
    };

    return (
        <div className="input-grid">
            <div className="form-group">
                <label>{t('sectionType')}</label>
                <div className="input-wrapper">
                    <BrickWall size={18} className="input-icon" />
                    <select
                        value={calculatorParams.sectionType}
                        onChange={handleSectionChange}
                    >
                        <option value="1x1">1x1</option>
                        <option value="2x2x1">2x2x1</option>
                        <option value="1x3x3">1x3x3</option>
                        <option value="2x1.5x2">2x1.5x2</option>
                        <option value="1x2x1">1x2x1</option>
                        <option value="1x1.5x2">1x1.5x2</option>
                    </select>
                    <ChevronDown size={16} className="select-arrow" />
                </div>
            </div>

            {/* Configuration Trigger for 1x1 Section */}
            {calculatorParams.sectionType === '1x1' && (
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>{t('configuration')}</label>
                    <ConfigTrigger
                        isPuisard={calculatorParams.puisard === '1'}
                        onToggle={handleConfigToggle}
                    />
                </div>
            )}

            <div className="form-group">
                <label>{t('specifyDalotLength')}</label>
                <div className="input-wrapper">
                    <Ruler size={18} className="input-icon" />
                    <input
                        type="number"
                        value={calculatorParams.dalotLength}
                        min="0"
                        onChange={handleLengthChange}
                    />
                </div>
            </div>
            <style>{`
                  .input-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2.5rem;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                    font-size: 0.9rem;
                }

                .input-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .input-icon {
                    position: absolute;
                    left: 0.75rem;
                    color: var(--text-secondary);
                    pointer-events: none;
                }

                .select-arrow {
                    position: absolute;
                    right: 0.75rem;
                    color: var(--text-secondary);
                    pointer-events: none;
                }

                select, 
                input {
                    width: 100%;
                    padding: 0.75rem 1rem 0.75rem 2.5rem;
                    border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                    font-size: 1rem;
                    background: white;
                    color: var(--text-main);
                    transition: border-color 0.2s;
                    appearance: none;
                }

                select:focus, 
                input:focus {
                    outline: none;
                    border-color: var(--primary);
                    box-shadow: 0 0 0 3px rgba(30, 41, 59, 0.1);
                }
            `}</style>
        </div>
    );
};

export default CalculatorInputs;
