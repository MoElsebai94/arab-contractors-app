import { useState, useEffect } from 'react';

/**
 * PWA Install prompt — shows on mobile when the browser fires beforeinstallprompt.
 * Dismissible, only shows once per session.
 */
export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Don't show if already installed as PWA
        if (window.matchMedia('(display-mode: standalone)').matches) return;

        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Only show on mobile-ish screens
            if (window.innerWidth <= 768) {
                setShowPrompt(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        if (result.outcome === 'accepted') {
            setShowPrompt(false);
        }
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        setDeferredPrompt(null);
    };

    if (!showPrompt) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10000,
            background: '#1a1a2e',
            color: '#fff',
            padding: '14px 20px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            maxWidth: '90vw',
            animation: 'slideUp 0.3s ease-out'
        }}>
            <span style={{ fontSize: '24px' }}>📱</span>
            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>Install ACC App</div>
                <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '2px' }}>
                    Add to homescreen for quick access
                </div>
            </div>
            <button
                onClick={handleInstall}
                style={{
                    background: '#4ecca3',
                    border: 'none',
                    color: '#1a1a2e',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '13px',
                    whiteSpace: 'nowrap'
                }}
            >
                Install
            </button>
            <button
                onClick={handleDismiss}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.6)',
                    cursor: 'pointer',
                    fontSize: '18px',
                    padding: '4px'
                }}
                aria-label="Dismiss install prompt"
            >
                ✕
            </button>
            <style>{`
                @keyframes slideUp {
                    from { transform: translateX(-50%) translateY(100px); opacity: 0; }
                    to { transform: translateX(-50%) translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
