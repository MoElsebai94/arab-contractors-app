import { useState, useEffect } from 'react';

/**
 * Shows a small banner when the user is offline.
 * Uses navigator.onLine + event listeners for real-time detection.
 */
export default function OfflineIndicator() {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const handleOffline = () => {
            setIsOffline(true);
            setDismissed(false); // Re-show when going offline again
        };
        const handleOnline = () => setIsOffline(false);

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    if (!isOffline || dismissed) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10000,
            background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
            color: '#fff',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            animation: 'slideDown 0.3s ease-out'
        }}>
            <span style={{ fontSize: '16px' }}>📡</span>
            <span>You&apos;re offline — showing cached data</span>
            <button
                onClick={() => setDismissed(true)}
                style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: '#fff',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    marginLeft: '8px'
                }}
                aria-label="Dismiss offline notification"
            >
                ✕
            </button>
            <style>{`
                @keyframes slideDown {
                    from { transform: translateY(-100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
