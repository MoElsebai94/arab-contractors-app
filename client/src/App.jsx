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

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const auth = sessionStorage.getItem('isAuthenticated');
        if (auth === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    const handleLogin = () => {
        sessionStorage.setItem('isAuthenticated', 'true');
        setIsAuthenticated(true);
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
