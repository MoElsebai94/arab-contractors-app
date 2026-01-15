import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const CustomDropdown = ({
    value,
    options,
    onChange,
    placeholder,
    isRTL,
    className = '',
    renderOption,
    renderTrigger
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(o => o.value === value);

    return (
        <div className={`custom-dropdown ${className}`} ref={dropdownRef}>
            <div
                className={`custom-dropdown-trigger ${isOpen ? 'open' : ''} ${value || ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {renderTrigger ? renderTrigger(selectedOption) : (
                    <>
                        <span>{selectedOption ? (isRTL ? selectedOption.labelAr : selectedOption.label) : placeholder}</span>
                        <ChevronDown size={16} className="dropdown-icon" />
                    </>
                )}
            </div>
            {isOpen && (
                <div className="custom-dropdown-menu">
                    {options.map(option => (
                        <div
                            key={option.value}
                            className={`custom-dropdown-option ${value === option.value ? 'selected' : ''}`}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                        >
                            {renderOption ? renderOption(option) : (
                                <>
                                    <span>{isRTL ? option.labelAr : option.label}</span>
                                    {value === option.value && <Check size={14} className="check-icon" />}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomDropdown;
