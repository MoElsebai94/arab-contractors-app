/**
 * Accessible Component Library
 * Provides accessible versions of common UI components with proper ARIA attributes
 */

import { forwardRef, useId, useState, useEffect, useRef } from 'react';

/**
 * Accessible Button with proper ARIA attributes
 */
export const AccessibleButton = forwardRef(({
    children,
    onClick,
    disabled = false,
    loading = false,
    type = 'button',
    variant = 'primary',
    ariaLabel,
    ariaDescribedBy,
    ariaExpanded,
    ariaControls,
    ariaPressed,
    className = '',
    ...props
}, ref) => {
    return (
        <button
            ref={ref}
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`btn btn-${variant} ${className}`}
            aria-label={ariaLabel}
            aria-describedby={ariaDescribedBy}
            aria-expanded={ariaExpanded}
            aria-controls={ariaControls}
            aria-pressed={ariaPressed}
            aria-busy={loading}
            aria-disabled={disabled}
            {...props}
        >
            {loading ? (
                <span aria-hidden="true" className="loading-spinner" />
            ) : null}
            {children}
        </button>
    );
});

AccessibleButton.displayName = 'AccessibleButton';

/**
 * Accessible Input with label association
 */
export const AccessibleInput = forwardRef(({
    label,
    type = 'text',
    error,
    helperText,
    required = false,
    className = '',
    inputClassName = '',
    ...props
}, ref) => {
    const id = useId();
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;

    const ariaDescribedBy = [
        error ? errorId : null,
        helperText ? helperId : null
    ].filter(Boolean).join(' ') || undefined;

    return (
        <div className={`form-group ${className}`}>
            {label && (
                <label htmlFor={id} className="form-label">
                    {label}
                    {required && <span aria-hidden="true" className="required-indicator"> *</span>}
                </label>
            )}
            <input
                ref={ref}
                id={id}
                type={type}
                className={`form-input ${error ? 'error' : ''} ${inputClassName}`}
                aria-required={required}
                aria-invalid={!!error}
                aria-describedby={ariaDescribedBy}
                {...props}
            />
            {helperText && !error && (
                <span id={helperId} className="helper-text">
                    {helperText}
                </span>
            )}
            {error && (
                <span id={errorId} className="error-text" role="alert">
                    {error}
                </span>
            )}
        </div>
    );
});

AccessibleInput.displayName = 'AccessibleInput';

/**
 * Accessible Select/Dropdown
 */
export const AccessibleSelect = forwardRef(({
    label,
    options = [],
    error,
    required = false,
    placeholder,
    className = '',
    ...props
}, ref) => {
    const id = useId();
    const errorId = `${id}-error`;

    return (
        <div className={`form-group ${className}`}>
            {label && (
                <label htmlFor={id} className="form-label">
                    {label}
                    {required && <span aria-hidden="true" className="required-indicator"> *</span>}
                </label>
            )}
            <select
                ref={ref}
                id={id}
                className={`form-input ${error ? 'error' : ''}`}
                aria-required={required}
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
                {...props}
            >
                {placeholder && (
                    <option value="" disabled>
                        {placeholder}
                    </option>
                )}
                {options.map((option) => (
                    <option
                        key={option.value}
                        value={option.value}
                    >
                        {option.label}
                    </option>
                ))}
            </select>
            {error && (
                <span id={errorId} className="error-text" role="alert">
                    {error}
                </span>
            )}
        </div>
    );
});

AccessibleSelect.displayName = 'AccessibleSelect';

/**
 * Accessible Modal/Dialog
 */
export const AccessibleModal = ({
    isOpen,
    onClose,
    title,
    children,
    ariaDescribedBy,
    className = ''
}) => {
    const titleId = useId();
    const modalRef = useRef(null);
    const previousActiveElement = useRef(null);

    // Trap focus and handle escape key
    useEffect(() => {
        if (!isOpen) return;

        // Save previously focused element
        previousActiveElement.current = document.activeElement;

        // Focus the modal
        modalRef.current?.focus();

        // Handle escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        // Handle tab key for focus trapping
        const handleTab = (e) => {
            if (e.key !== 'Tab') return;

            const focusableElements = modalRef.current?.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );

            if (!focusableElements || focusableElements.length === 0) return;

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey && document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        };

        document.addEventListener('keydown', handleEscape);
        document.addEventListener('keydown', handleTab);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('keydown', handleTab);
            document.body.style.overflow = '';

            // Restore focus
            previousActiveElement.current?.focus();
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="modal-overlay"
            onClick={onClose}
            role="presentation"
        >
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={ariaDescribedBy}
                className={`modal-card ${className}`}
                onClick={(e) => e.stopPropagation()}
                tabIndex={-1}
            >
                {title && (
                    <h2 id={titleId} className="modal-title">
                        {title}
                    </h2>
                )}
                {children}
            </div>
        </div>
    );
};

/**
 * Accessible Alert/Notification
 */
export const AccessibleAlert = ({
    type = 'info', // 'info', 'success', 'warning', 'error'
    title,
    message,
    onDismiss,
    className = ''
}) => {
    const role = type === 'error' || type === 'warning' ? 'alert' : 'status';
    const ariaLive = type === 'error' ? 'assertive' : 'polite';

    return (
        <div
            role={role}
            aria-live={ariaLive}
            className={`alert alert-${type} ${className}`}
        >
            {title && <strong className="alert-title">{title}</strong>}
            <span className="alert-message">{message}</span>
            {onDismiss && (
                <button
                    onClick={onDismiss}
                    className="alert-dismiss"
                    aria-label="Dismiss alert"
                >
                    &times;
                </button>
            )}
        </div>
    );
};

/**
 * Accessible Table
 */
export const AccessibleTable = ({
    caption,
    headers = [],
    rows = [],
    className = ''
}) => {
    return (
        <table className={`accessible-table ${className}`} role="grid">
            {caption && <caption className="sr-only">{caption}</caption>}
            <thead>
                <tr role="row">
                    {headers.map((header, index) => (
                        <th
                            key={index}
                            scope="col"
                            role="columnheader"
                        >
                            {header}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.map((row, rowIndex) => (
                    <tr key={rowIndex} role="row">
                        {row.map((cell, cellIndex) => (
                            <td key={cellIndex} role="gridcell">
                                {cell}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

/**
 * Skip Link for keyboard navigation
 */
export const SkipLink = ({ targetId = 'main-content', children = 'Skip to main content' }) => {
    return (
        <a
            href={`#${targetId}`}
            className="skip-link"
        >
            {children}
        </a>
    );
};

/**
 * Visually Hidden (Screen Reader Only) component
 */
export const VisuallyHidden = ({ children, as: Component = 'span' }) => {
    return (
        <Component className="sr-only">
            {children}
        </Component>
    );
};

/**
 * Live Region for dynamic announcements
 */
export const LiveRegion = ({ message, priority = 'polite' }) => {
    return (
        <div
            role="status"
            aria-live={priority}
            aria-atomic="true"
            className="sr-only"
        >
            {message}
        </div>
    );
};

/**
 * Focus Trap Hook - for modals and dropdowns
 */
export const useFocusTrap = (isActive = true) => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!isActive || !containerRef.current) return;

        const container = containerRef.current;
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleKeyDown = (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey && document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        };

        container.addEventListener('keydown', handleKeyDown);
        firstElement.focus();

        return () => {
            container.removeEventListener('keydown', handleKeyDown);
        };
    }, [isActive]);

    return containerRef;
};

/**
 * Keyboard Navigation Hook
 */
export const useKeyboardNavigation = (items, onSelect) => {
    const [activeIndex, setActiveIndex] = useState(0);

    const handleKeyDown = (e) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setActiveIndex((prev) => (prev + 1) % items.length);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                onSelect(items[activeIndex], activeIndex);
                break;
            case 'Home':
                e.preventDefault();
                setActiveIndex(0);
                break;
            case 'End':
                e.preventDefault();
                setActiveIndex(items.length - 1);
                break;
            default:
                break;
        }
    };

    return { activeIndex, handleKeyDown, setActiveIndex };
};

export default {
    AccessibleButton,
    AccessibleInput,
    AccessibleSelect,
    AccessibleModal,
    AccessibleAlert,
    AccessibleTable,
    SkipLink,
    VisuallyHidden,
    LiveRegion,
    useFocusTrap,
    useKeyboardNavigation
};
