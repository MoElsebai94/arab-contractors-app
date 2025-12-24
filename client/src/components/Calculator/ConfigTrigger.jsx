import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ArrowRight, Box } from 'lucide-react';
import '../../index.css'; // Ensure we have styles

const ConfigTrigger = ({ isPuisard, onToggle }) => {
    const { t } = useLanguage();
    return (
        <button
            className={`trigger-btn ${isPuisard ? 'puisard-mode' : 'standard-mode'}`}
            onClick={onToggle}
            type="button"
        >
            <div className="trigger-content">
                {isPuisard ? (
                    <>
                        <ArrowRight size={20} />
                        <span>With Puisard (1 Tête + 1 Puisard)</span>
                    </>
                ) : (
                    <>
                        <Box size={20} />
                        <span>Standard (2 Têtes)</span>
                    </>
                )}
            </div>
            <div className="trigger-indicator">
                <div className="indicator-dot"></div>
            </div>
            <style>{`
                .trigger-btn {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border-radius: var(--radius-md);
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                }

                .standard-mode {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    color: white;
                    box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -1px rgba(37, 99, 235, 0.1);
                }

                .puisard-mode {
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    color: white;
                    box-shadow: 0 4px 6px -1px rgba(217, 119, 6, 0.2), 0 2px 4px -1px rgba(217, 119, 6, 0.1);
                }

                .trigger-btn:hover {
                    transform: translateY(-1px);
                    filter: brightness(1.1);
                }

                .trigger-btn:active {
                    transform: translateY(1px);
                }

                .trigger-content {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-weight: 600;
                    font-size: 0.95rem;
                }

                .indicator-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: white;
                    box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.2);
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
                    70% { box-shadow: 0 0 0 6px rgba(255, 255, 255, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
                }
            `}</style>
        </button>
    );
};

export default ConfigTrigger;
