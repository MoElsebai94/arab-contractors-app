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

    return (
        <div className="custom-dropdown-container" ref={wrapperRef} style={{ width: '100%' }}>
            <div className="custom-dropdown-trigger" onClick={() => setIsOpen(!isOpen)}>
                <span>{allowAll && value === 'all' ? placeholder : (value || placeholder)}</span>
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
                    {options.map(option => (
                        <div
                            key={option}
                            className={`custom-dropdown-item ${value === option ? 'selected' : ''}`}
                            onClick={() => { onChange({ target: { value: option } }); setIsOpen(false); }}
                        >
                            {option}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomDropdown;
