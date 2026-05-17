import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Rocket, Package, Calculator, Menu, X, Globe, Files, Construction, Receipt } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import useScrollLock from '../hooks/useScrollLock';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  const { t, language, toggleLanguage } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useScrollLock(isMenuOpen);

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <aside className="sidebar" role="complementary" aria-label={t('navigation') || 'Main Navigation'}>
      <div className="logo-container">
        <Link to="/" className="logo-content" style={{ textDecoration: 'none', color: 'inherit' }} aria-label="Go to Dashboard - Arab Contractors Cameroon">
          <img src="/logo.png" alt="Arab Contractors Logo" className="logo-img" />
          <div>
            <h2 className="logo-text">Arab Contractors</h2>
            <h2 className="logo-text-sub">Cameroon</h2>
            <span className="logo-subtext">Genie Civil</span>
          </div>
        </Link>
        <div className="mobile-actions">
          <button
            onClick={toggleLanguage}
            className="mobile-lang-toggle"
            aria-label={language === 'en' ? 'Switch to Arabic' : 'Switch to English'}
          >
            <Globe size={20} aria-hidden="true" />
          </button>
          <button
            className="menu-toggle"
            onClick={toggleMenu}
            aria-expanded={isMenuOpen}
            aria-controls="nav-menu"
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {isMenuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile Backdrop */}
      <div
        className={`mobile-backdrop ${isMenuOpen ? 'open' : ''}`}
        onClick={closeMenu}
        aria-hidden="true"
      ></div>

      <nav
        id="nav-menu"
        className={`nav-menu ${isMenuOpen ? 'open' : ''}`}
        role="navigation"
        aria-label={t('mainNavigation') || 'Main Navigation'}
      >
        <div className="nav-header-mobile">
          <span className="nav-title-mobile" id="nav-menu-title">{t('menu')}</span>
          <button
            className="menu-close-btn"
            onClick={closeMenu}
            aria-label="Close navigation menu"
          >
            <X size={24} aria-hidden="true" />
          </button>
        </div>
        <Link to="/" className={`nav-item ${isActive('/')}`} onClick={closeMenu} aria-current={location.pathname === '/' ? 'page' : undefined}>
          <LayoutDashboard className="nav-icon" size={24} aria-hidden="true" />
          {t('dashboard')}
        </Link>
        <Link to="/employees" className={`nav-item ${isActive('/employees')}`} onClick={closeMenu} aria-current={location.pathname === '/employees' ? 'page' : undefined}>
          <Users className="nav-icon" size={24} aria-hidden="true" />
          {t('employees')}
        </Link>
        <Link to="/tasks" className={`nav-item ${isActive('/tasks')}`} onClick={closeMenu} aria-current={location.pathname === '/tasks' ? 'page' : undefined}>
          <Rocket className="nav-icon" size={24} aria-hidden="true" />
          {t('tasks')}
        </Link>
        <Link to="/storage" className={`nav-item ${isActive('/storage')}`} onClick={closeMenu} aria-current={location.pathname === '/storage' ? 'page' : undefined}>
          <Package className="nav-icon" size={24} aria-hidden="true" />
          {t('storage')}
        </Link>
        <Link to="/calculator" className={`nav-item ${isActive('/calculator')}`} onClick={closeMenu} aria-current={location.pathname === '/calculator' ? 'page' : undefined}>
          <Calculator className="nav-icon" size={24} aria-hidden="true" />
          {t('calculator')}
        </Link>
        <Link to="/documents" className={`nav-item ${isActive('/documents')}`} onClick={closeMenu} aria-current={location.pathname === '/documents' ? 'page' : undefined}>
          <Files className="nav-icon" size={24} aria-hidden="true" />
          {t('documents') || "Documents"}
        </Link>
        <Link to="/dalots" className={`nav-item ${isActive('/dalots')}`} onClick={closeMenu} aria-current={location.pathname === '/dalots' ? 'page' : undefined}>
          <Construction className="nav-icon" size={24} aria-hidden="true" />
          {t('dalots') || "Dalots"}
        </Link>
        <Link to="/dqe" className={`nav-item ${isActive('/dqe')}`} onClick={closeMenu} aria-current={location.pathname === '/dqe' ? 'page' : undefined}>
          <Receipt className="nav-icon" size={24} aria-hidden="true" />
          {"DQE / Prix"}
        </Link>
      </nav>

      <div className="sidebar-footer">
        <button
          onClick={toggleLanguage}
          className="lang-toggle"
          aria-label={language === 'en' ? 'Switch to Arabic' : 'Switch to English'}
        >
          <Globe size={16} aria-hidden="true" />
          {t('toggleLanguage')}
        </button>
        <p>{t('copyright')}</p>
      </div>

    </aside>
  );
};

export default Sidebar;
