import { useEffect } from 'react';

const useScrollLock = (isLocked) => {
    useEffect(() => {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        if (isLocked) {
            document.body.style.overflow = 'hidden';
            // Also handle mobile safari specific scroll locking if needed
            // But basic overflow: hidden usually works for modern browsers
        }

        return () => {
            document.body.style.overflow = originalStyle === 'hidden' ? '' : originalStyle;
            if (!isLocked) {
                document.body.style.overflow = '';
            }
        };
    }, [isLocked]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            document.body.style.overflow = '';
        };
    }, []);
};

export default useScrollLock;
