import { useEffect } from 'react';

const useScrollLock = (isLocked) => {
    useEffect(() => {
        if (isLocked) {
            // Save original style only if not already locked to avoid overwriting with 'hidden'
            const originalStyle = window.getComputedStyle(document.body).overflow;
            const originalPaddingRight = window.getComputedStyle(document.body).paddingRight;

            // Prevent width shift
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.paddingRight = `${scrollbarWidth}px`;

            document.body.style.overflow = 'hidden';

            return () => {
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
            };
        }
    }, [isLocked]);
};

export default useScrollLock;
