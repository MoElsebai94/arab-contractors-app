import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const ModernDropdown = ({ options, value, onChange, placeholder = "Select..." }) => {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Helper to get label consistently
    const getLabel = (option) => typeof option === 'object' ? option.label : option;
    const getValue = (option) => typeof option === 'object' ? option.value : option;

    const currentLabel = value === 'All' ? t('allRoles') :
        (options.find(o => getValue(o) === value) ? getLabel(options.find(o => getValue(o) === value)) : value);

    return (
        <div className="modern-dropdown" ref={dropdownRef} style={{ position: 'relative', minWidth: '200px', width: '100%' }}>
            <button
                type="button"
                className="dropdown-trigger"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    padding: '0.6rem 1rem',
                    background: 'white',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    color: 'var(--text-primary)',
                    transition: 'all 0.2s',
                    boxShadow: isOpen ? '0 0 0 2px var(--primary-color-light)' : 'none',
                    borderColor: isOpen ? 'var(--primary-color)' : 'var(--border-color)',
                    minHeight: '42px'
                }}
            >
                <span style={{ fontWeight: 500 }}>{currentLabel}</span>
                <ChevronDown size={16} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </button>

            {isOpen && (
                <div className="dropdown-menu" style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '0.5rem',
                    background: 'white',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 50,
                    maxHeight: '300px',
                    overflowY: 'auto',
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div
                        className="dropdown-item"
                        onClick={() => { onChange('All'); setIsOpen(false); }}
                        style={{
                            padding: '0.75rem 1rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            color: value === 'All' ? 'var(--primary-color)' : 'var(--text-primary)',
                            background: value === 'All' ? 'var(--bg-secondary)' : 'transparent',
                            fontSize: '0.9rem'
                        }}
                    >
                        <span>{t('allRoles')}</span>
                        {value === 'All' && <Check size={16} />}
                    </div>
                    {options.map((option, idx) => {
                        const optValue = getValue(option);
                        const optLabel = getLabel(option);
                        return (
                            <div
                                key={idx}
                                className="dropdown-item"
                                onClick={() => { onChange(optValue); setIsOpen(false); }}
                                style={{
                                    padding: '0.75rem 1rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    color: value === optValue ? 'var(--primary-color)' : 'var(--text-primary)',
                                    background: value === optValue ? 'var(--bg-secondary)' : 'transparent',
                                    fontSize: '0.9rem',
                                    borderTop: '1px solid var(--border-color-light)'
                                }}
                            >
                                <span>{optLabel}</span>
                                {value === optValue && <Check size={16} />}
                            </div>
                        );
                    })}
                </div>
            )}
            <style>{`
                .dropdown-item:hover {
                    background-color: var(--bg-secondary) !important;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default ModernDropdown;
