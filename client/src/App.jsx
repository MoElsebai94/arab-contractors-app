import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect, lazy, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingScreen from './components/LoadingScreen';
import { SkipLink } from './components/AccessibleComponents';
import './index.css';
import './styles/accessibility.css';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Employees = lazy(() => import('./pages/Employees'));
const Projects = lazy(() => import('./pages/Projects'));
const Storage = lazy(() => import('./pages/Storage'));
const CalculatorPage = lazy(() => import('./pages/Calculator'));
const Documents = lazy(() => import('./pages/Documents'));
const Dalots = lazy(() => import('./pages/Dalots'));

// Decode JWT payload without a library (base64url)
function decodeJwtPayload(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(base64));
    } catch {
        return null;
    }
}

function isTokenValid(token) {
    if (!token) return false;
    const payload = decodeJwtPayload(token);
    if (!payload || !payload.exp) return false;
    // exp is in seconds, Date.now() in ms
    return payload.exp * 1000 > Date.now();
}

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        // Use JWT token as single source of truth
        const token = localStorage.getItem('token');
        return isTokenValid(token);
    });

    useEffect(() => {
        // Check token validity on mount and sync sessionStorage
        const token = localStorage.getItem('token');
        if (isTokenValid(token)) {
            sessionStorage.setItem('isAuthenticated', 'true');
            setIsAuthenticated(true);
        } else {
            // Token missing or expired — clear everything
            localStorage.removeItem('token');
            sessionStorage.removeItem('isAuthenticated');
            setIsAuthenticated(false);
        }
    }, []);

    const handleLogin = () => {
        // Login component sets localStorage.token; we also set sessionStorage for backwards compat
        sessionStorage.setItem('isAuthenticated', 'true');
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('isAuthenticated');
        setIsAuthenticated(false);
    };

    if (!isAuthenticated) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <ErrorBoundary>
            <Router>
                <SkipLink targetId="main-content" />
                <div className="app-container">
                    <Sidebar />
                    <main id="main-content" className="main-content" role="main" tabIndex={-1}>
                        <Suspense fallback={<LoadingScreen />}>
                            <Routes>
                                <Route path="/" element={<Dashboard />} />
                                <Route path="/employees" element={<Employees />} />
                                <Route path="/tasks" element={<Projects />} />
                                <Route path="/storage" element={<Storage />} />
                                <Route path="/calculator" element={<CalculatorPage />} />
                                <Route path="/documents" element={<Documents />} />
                                <Route path="/dalots" element={<Dalots />} />
                                <Route path="*" element={<NotFound />} />
                            </Routes>
                        </Suspense>
                    </main>
                </div>
            </Router>
        </ErrorBoundary>
    );
}

export default App;
