import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const { setLanguage } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/auth/login', { passcode });
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        setLanguage('en');
        onLogin();
      }
    } catch (err) {
      setError('Invalid passcode. Please try again.');
      setPasscode('');
    }
  };

  return (
    <div className="login-container">
      <div className="card login-card">
        <div className="login-header">
          <img src="/logo.png" alt="Logo" className="login-logo" />
          <h2>Arab Contractors</h2>
          <p>Cameroon - Genie Civil</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ textAlign: 'center' }}>Enter Passcode</label>
            <input
              type="password"
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setError('');
              }}
              placeholder="••••"
              className="passcode-input"
              autoFocus
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="btn btn-primary btn-block">
            Access System
          </button>
        </form>
      </div>

      <style>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--primary-color);
          padding: 1rem;
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          padding: 2.5rem;
          text-align: center;
        }

        .login-header {
          margin-bottom: 2rem;
        }

        .login-logo {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 50%;
          margin-bottom: 1rem;
        }

        .login-header h2 {
          color: var(--primary-color);
          font-size: 1.5rem;
          margin-bottom: 0.25rem;
        }

        .login-header p {
          color: var(--text-secondary);
          font-weight: 500;
          text-transform: uppercase;
          font-size: 0.875rem;
          letter-spacing: 0.05em;
        }

        .passcode-input {
          text-align: center;
          font-size: 1.5rem;
          letter-spacing: 0.5rem;
          padding: 0.75rem;
          width: 100%;
          max-width: 100%;
        }

        .btn-block {
          width: 100%;
          padding: 0.75rem;
          font-size: 1rem;
          margin-top: 1rem;
        }

        .error-message {
          color: var(--danger-color);
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
};

export default Login;
