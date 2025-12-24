import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const CustomDropdown = ({ options, value, onChange, placeholder, allowAll = true }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const getLabel = (option) => typeof option === 'object' ? option.label : option;
    const getValue = (option) => typeof option === 'object' ? option.value : option;

    const selectedOption = options.find(o => getValue(o) === value);
    const displayValue = value === 'all' && allowAll ? placeholder : (selectedOption ? getLabel(selectedOption) : value);

    return (
        <div className="custom-dropdown-container" ref={wrapperRef} style={{ width: '100%' }}>
            <div className="custom-dropdown-trigger" onClick={() => setIsOpen(!isOpen)}>
                <span>{displayValue || placeholder}</span>
                <ChevronDown size={16} className={`dropdown-arrow ${isOpen ? 'open' : ''}`} />
            </div>
            {isOpen && (
                <div className="custom-dropdown-menu">
                    {allowAll && (
                        <div
                            className={`custom-dropdown-item ${value === 'all' ? 'selected' : ''}`}
                            onClick={() => { onChange({ target: { value: 'all' } }); setIsOpen(false); }}
                        >
                            {placeholder}
                        </div>
                    )}
                    {options.map((option, idx) => {
                        const optValue = getValue(option);
                        const optLabel = getLabel(option);
                        return (
                            <div
                                key={idx}
                                className={`custom-dropdown-item ${value === optValue ? 'selected' : ''}`}
                                onClick={() => { onChange({ target: { value: optValue } }); setIsOpen(false); }}
                            >
                                {optLabel}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CustomDropdown;
