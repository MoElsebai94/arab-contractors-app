import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Rocket, Package, Calculator, Menu, X, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Sidebar = () => {
  const location = useLocation();
  const { t, language, toggleLanguage } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    <aside className="sidebar">
      <div className="logo-container">
        <Link to="/" className="logo-content" style={{ textDecoration: 'none', color: 'inherit' }}>
          <img src="/logo.png" alt="Arab Contractors Logo" className="logo-img" />
          <div>
            <h2 className="logo-text">Arab Contractors</h2>
            <h2 className="logo-text-sub">Cameroon</h2>
            <span className="logo-subtext">Genie Civil</span>
          </div>
        </Link>
        <button className="menu-toggle" onClick={toggleMenu}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      <div className={`mobile-backdrop ${isMenuOpen ? 'open' : ''}`} onClick={closeMenu}></div>

      <nav className={`nav-menu ${isMenuOpen ? 'open' : ''}`}>
        <div className="nav-header-mobile">
          <span className="nav-title-mobile">{t('menu')}</span>
          <button className="menu-close-btn" onClick={closeMenu}>
            <X size={24} />
          </button>
        </div>
        <Link to="/" className={`nav-item ${isActive('/')}`} onClick={closeMenu}>
          <LayoutDashboard className="nav-icon" size={24} />
          {t('dashboard')}
        </Link>
        <Link to="/employees" className={`nav-item ${isActive('/employees')}`} onClick={closeMenu}>
          <Users className="nav-icon" size={24} />
          {t('employees')}
        </Link>
        <Link to="/tasks" className={`nav-item ${isActive('/tasks')}`} onClick={closeMenu}>
          <Rocket className="nav-icon" size={24} />
          {t('tasks')}
        </Link>
        <Link to="/storage" className={`nav-item ${isActive('/storage')}`} onClick={closeMenu}>
          <Package className="nav-icon" size={24} />
          {t('storage')}
        </Link>
        <Link to="/calculator" className={`nav-item ${isActive('/calculator')}`} onClick={closeMenu}>
          <Calculator className="nav-icon" size={24} />
          {t('calculator')}
        </Link>
      </nav>

      <div className="sidebar-footer">
        <button onClick={toggleLanguage} className="lang-toggle">
          <Globe size={16} />
          {t('toggleLanguage')}
        </button>
        <p>{t('copyright')}</p>
      </div>

      <style>{`
        .sidebar {
          width: 260px;
          background-color: var(--primary-color);
          color: white;
          display: flex;
          flex-direction: column;
          height: 100vh;
          position: sticky;
          top: 0;
          box-shadow: var(--shadow-lg);
          z-index: 50;
        }

        .logo-container {
          padding: 2rem 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo-content {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .menu-toggle {
            display: none;
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 0.5rem;
        }

        .logo-img {
          width: 48px;
          height: 48px;
          object-fit: cover;
          border-radius: 50%;
        }

        .logo-text {
          font-size: 1.1rem;
          font-weight: 700;
          color: white;
          line-height: 1.2;
        }

        .logo-text-sub {
          font-size: 1.1rem;
          font-weight: 700;
          color: white;
          line-height: 1.2;
          margin-bottom: 0.25rem;
        }

        .logo-subtext {
          font-size: 0.75rem;
          color: var(--accent-color);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: block;
        }

        .nav-menu {
          padding: 1.5rem 1rem;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .nav-header-mobile {
            display: none;
        }
        
        .mobile-backdrop {
            display: none;
        }

        .nav-item {
          display: flex;
          align-items: center;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          color: #94a3b8;
          font-weight: 500;
          transition: all 0.2s;
          text-decoration: none;
        }

        .nav-item:hover {
          background-color: rgba(255, 255, 255, 0.05);
          color: white;
        }

        .nav-item.active {
          background-color: var(--accent-color);
          color: white;
          box-shadow: 0 4px 6px -1px rgba(245, 158, 11, 0.2);
        }

        .nav-icon {
          margin-inline-end: 0.75rem;
          font-size: 1.25rem;
        }

        .sidebar-footer {
          padding: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 0.75rem;
          color: #64748b;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          align-items: center;
        }

        .lang-toggle {
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.8rem;
            transition: background 0.2s;
        }

        .lang-toggle:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        @media (max-width: 768px) {
          .sidebar {
            width: 100%;
            height: auto;
            position: relative;
            flex-direction: column;
            z-index: 100;
          }

          .logo-container {
            padding: 0.75rem 1rem;
            justify-content: space-between;
            gap: 0;
            background-color: var(--primary-color);
            position: relative;
            z-index: 101;
          }
          
          .logo-content {
            gap: 0.75rem;
          }

          .menu-toggle {
            display: block;
          }

          .logo-img {
            width: 40px;
            height: 40px;
          }

          .logo-text {
            font-size: 1rem;
          }

          .logo-text-sub {
            font-size: 1rem;
          }

          .logo-subtext {
            font-size: 0.65rem;
          }
          
          /* Backdrop */
          .mobile-backdrop {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
            z-index: 98;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
          }
          
          .mobile-backdrop.open {
            opacity: 1;
            pointer-events: auto;
          }

          /* Side Drawer */
          .nav-menu {
            display: flex;
            flex-direction: column;
            position: fixed;
            top: 0;
            right: 0;
            width: 280px;
            height: 100vh;
            background-color: var(--primary-color);
            padding: 2rem 1.5rem;
            z-index: 99;
            transform: translateX(100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: -4px 0 15px rgba(0,0,0,0.3);
            border-top: none;
          }
          
          .nav-menu.open {
            transform: translateX(0);
          }
          
          .nav-header-mobile {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .nav-title-mobile {
            font-size: 1.25rem;
            font-weight: 700;
            color: white;
          }
          
          .menu-close-btn {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 0.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background 0.2s;
          }
          
          .menu-close-btn:hover {
            background: rgba(255,255,255,0.1);
          }

          .nav-item {
            padding: 1rem;
            font-size: 1.1rem;
            border-bottom: none;
            margin-bottom: 0.5rem;
          }
          
          .nav-icon {
            margin-inline-end: 1rem;
            font-size: 1.5rem;
          }

          .sidebar-footer {
            display: block;
            margin-top: auto;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
