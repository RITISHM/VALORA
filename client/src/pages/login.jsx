/**
 * @file login.jsx
 * @description Authentication Login Page component for Valora ERP.
 * Provides user credential authentication against the backend /auth/login route,
 * local token persistence, and redirection into the application dashboard.
 * @module pages/Login
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Hexagon } from 'lucide-react';
import { BACKEND_URL } from '../api';
import '../styles/login.css';

/**
 * Login view component for authenticating registered users.
 * 
 * @component
 * @returns {JSX.Element} The rendered login interface with split branding and credential form.
 */
export default function Login() {
  const [formData, setFormData] = useState({
    loginId: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  /**
   * Updates controlled form input state and clears any existing validation error.
   * 
   * @function handleChange
   * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  /**
   * Submits user credentials to backend /auth/login, saves JWT and user profile, and navigates to /dashboard.
   * 
   * @async
   * @function handleMockLogin
   * @param {React.FormEvent} e - Form submission event.
   */
  const handleMockLogin = async (e) => {
    e.preventDefault();
    setError('');

    // Basic frontend validation
    if (!formData.loginId.trim() || !formData.password.trim()) {
      setError('Please enter both Login ID and Password.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login_id: formData.loginId,
          password: formData.password
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Invalid Login Id or Password');
        setIsLoading(false);
        return;
      }

      localStorage.setItem('valora_token', data.token);
      localStorage.setItem('valora_user', JSON.stringify(data.user));

      navigate('/dashboard');
    } catch (err) {
      setError('Network error. Please try again later.');
      setIsLoading(false);
    }
  };

  return (
    <div className="login-layout">
      {/* LEFT COLUMN: BRANDING & VISUAL */}
      <div className="login-brand-panel">
        <div className="brand-content">
          <div className="brand-logo">
            <Hexagon size={40} className="logo-icon" />
            <h1>VALORA</h1>
          </div>
          <div className="brand-messaging">
            <h2>Enterprise Resource Clarity</h2>
            <p>
              Streamline your financial master data, transaction flows, and 
              budgeting with our comprehensive business suite.
            </p>
          </div>
          <div className="brand-graphic">
            {/* Minimal abstract geometric representation */}
            <div className="abstract-shape shape-1"></div>
            <div className="abstract-shape shape-2"></div>
            <div className="abstract-shape shape-3"></div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: LOGIN FORM */}
      <div className="login-form-panel">
        <div className="form-container">
          
          <div className="form-header">
            <h2 className="welcome-text">Welcome Back</h2>
            <p className="subtitle-text">Sign in to your Valora workspace</p>
          </div>

          <form onSubmit={handleMockLogin} className="login-form" noValidate>
            
            {/* Login ID Input */}
            <div className="input-group">
              <label htmlFor="loginId">Login ID</label>
              <input
                id="loginId"
                name="loginId"
                type="text"
                placeholder="Enter your Login ID"
                value={formData.loginId}
                onChange={handleChange}
                disabled={isLoading}
                aria-invalid={!!error}
                autoComplete="username"
              />
            </div>

            {/* Password Input */}
            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="password-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  aria-invalid={!!error}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message" role="alert">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              className={`submit-btn ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="spinner" />
                  <span>Authenticating...</span>
                </>
              ) : (
                'SIGN IN'
              )}
            </button>

            {/* Form Footer Links */}
            <div className="form-footer">
              <a href="#forgot" className="footer-link">Forgot Password</a>
              <span className="divider">|</span>
              <Link to="/signup" className="footer-link">Sign Up</Link>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}