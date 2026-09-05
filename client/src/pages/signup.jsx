import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Hexagon, Check, X, AlertCircle } from 'lucide-react';
import { useSignupStore } from '../store/useSignupStore';
import { BACKEND_URL } from '../api';
import '../styles/signup.css';

export default function Signup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    formData,
    touched,
    errors,
    passwordAnalysis,
    isLoading,
    setField,
    setTouched,
    suggestLoginId,
    validateAll,
    setIsLoading,
    setSubmitError,
  } = useSignupStore();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setField(name, value);
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(name);
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!validateAll()) {
      return;
    }

    setIsLoading(true);

    try {
      const mappedRole = 'CONTACT'; // Standard user signup (admin creation is handled separately)
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();

      const response = await fetch(`${BACKEND_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: fullName || formData.loginId,
          login_id: formData.loginId.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: mappedRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (Array.isArray(data.error)) {
          setSubmitError(data.error.map((err) => err.message).join(', '));
        } else {
          setSubmitError(data.error || 'Signup failed. Please try again.');
        }
        setIsLoading(false);
        return;
      }

      // Automatically store token & user info if returned
      if (data.token && data.user) {
        localStorage.setItem('valora_token', data.token);
        localStorage.setItem('valora_user', JSON.stringify(data.user));
      }

      // Signup successful -> redirect to login
      navigate('/login');
    } catch (err) {
      setSubmitError('Network error. Please try again later.');
      setIsLoading(false);
    }
  };

  const isLoginIdLengthInvalid =
    formData.loginId.length > 0 &&
    (formData.loginId.length < 6 || formData.loginId.length > 12);

  return (
    <div className="login-layout">
      {/* LEFT COLUMN: BRANDING & VISUAL (Matches Login page) */}
      <div className="login-brand-panel">
        <div className="brand-content">
          <div className="brand-logo">
            <Hexagon size={40} className="logo-icon" />
            <h1>VALORA</h1>
          </div>
          <div className="brand-messaging">
            <h2>Join the Platform</h2>
            <p>
              Create your account to access enterprise-grade accounting,
              budgeting, and master data management tools.
            </p>
          </div>
          <div className="brand-graphic">
            <div className="abstract-shape shape-1"></div>
            <div className="abstract-shape shape-2"></div>
            <div className="abstract-shape shape-3"></div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: SIGNUP FORM */}
      <div className="login-form-panel">
        <div className="form-container signup-container">
          <div className="form-header">
            <h2 className="welcome-text">Create Account</h2>
            <p className="subtitle-text">Sign up for your workspace account</p>
          </div>

          <form onSubmit={handleSignup} className="login-form" noValidate>
            {/* Submission Error Banner */}
            {errors.submit && (
              <div
                className="error-message"
                style={{
                  marginBottom: '16px',
                  padding: '10px 14px',
                  backgroundColor: '#FDEDED',
                  borderRadius: '6px',
                  border: '1px solid #F5C6CB',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={16} />
                <span>{errors.submit}</span>
              </div>
            )}

            {/* First Name & Last Name Row */}
            <div className="input-row">
              <div className="input-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="e.g. John"
                  value={formData.firstName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isLoading}
                  aria-invalid={touched.firstName && !!errors.firstName}
                />
                {touched.firstName && errors.firstName && (
                  <span className="field-error">{errors.firstName}</span>
                )}
              </div>

              <div className="input-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="e.g. Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isLoading}
                  aria-invalid={touched.lastName && !!errors.lastName}
                />
                {touched.lastName && errors.lastName && (
                  <span className="field-error">{errors.lastName}</span>
                )}
              </div>
            </div>

            {/* Login ID Input with Real-time Validation */}
            <div className="input-group">
              <div className="label-row">
                <label htmlFor="loginId">Login ID</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {formData.firstName && formData.lastName && (
                    <button
                      type="button"
                      className="suggest-btn"
                      onClick={suggestLoginId}
                      title="Auto-generate from first & last name"
                    >
                      Suggest ID
                    </button>
                  )}
                  {formData.loginId.length > 0 && (
                    <span
                      className={`char-counter ${
                        isLoginIdLengthInvalid ? 'invalid' : 'valid'
                      }`}
                    >
                      {formData.loginId.length}/12 chars
                    </span>
                  )}
                </div>
              </div>
              <input
                id="loginId"
                name="loginId"
                type="text"
                placeholder="e.g. johndoe (6-12 chars, first + last name)"
                value={formData.loginId}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isLoading}
                aria-invalid={!!errors.loginId && (touched.loginId || isLoginIdLengthInvalid)}
              />
              {/* Real-time error message if length outside 6-12 or missing first/last name */}
              {errors.loginId && (touched.loginId || formData.loginId.length > 0) && (
                <span className="field-error">
                  <AlertCircle size={14} />
                  <span>{errors.loginId}</span>
                </span>
              )}
            </div>

            {/* Email Address Input */}
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="e.g. john@company.com"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isLoading}
                aria-invalid={touched.email && !!errors.email}
              />
              {touched.email && errors.email && (
                <span className="field-error">
                  <AlertCircle size={14} />
                  <span>{errors.email}</span>
                </span>
              )}
            </div>

            {/* Password & Confirm Password Row */}
            <div className="input-row">
              {/* Password Input */}
              <div className="input-group">
                <label htmlFor="password">Password</label>
                <div className="password-wrapper">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={isLoading}
                    aria-invalid={touched.password && !passwordAnalysis.criteria.length}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="input-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="password-wrapper">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={isLoading}
                    aria-invalid={touched.confirmPassword && !!errors.confirmPassword}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex="-1"
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Confirm Password Error */}
            {touched.confirmPassword && errors.confirmPassword && (
              <span className="field-error" style={{ marginTop: '-8px' }}>
                <AlertCircle size={14} />
                <span>{errors.confirmPassword}</span>
              </span>
            )}

            {/* Password Real-time Criteria Checklist & Missing Error Messages */}
            {(formData.password.length > 0 || touched.password) && (
              <div className="password-criteria-box">
                <div className="criteria-title">Password Requirements</div>
                <div className="criteria-list">
                  {/* Length (>8) */}
                  <div
                    className={`criteria-item ${
                      passwordAnalysis.criteria.length ? 'met' : 'missing'
                    }`}
                  >
                    {passwordAnalysis.criteria.length ? (
                      <Check size={14} className="criteria-icon" />
                    ) : (
                      <X size={14} className="criteria-icon" />
                    )}
                    <span>Strictly &gt; 8 characters (9+)</span>
                  </div>

                  {/* Uppercase */}
                  <div
                    className={`criteria-item ${
                      passwordAnalysis.criteria.uppercase ? 'met' : 'missing'
                    }`}
                  >
                    {passwordAnalysis.criteria.uppercase ? (
                      <Check size={14} className="criteria-icon" />
                    ) : (
                      <X size={14} className="criteria-icon" />
                    )}
                    <span>Uppercase letter (A-Z)</span>
                  </div>

                  {/* Lowercase */}
                  <div
                    className={`criteria-item ${
                      passwordAnalysis.criteria.lowercase ? 'met' : 'missing'
                    }`}
                  >
                    {passwordAnalysis.criteria.lowercase ? (
                      <Check size={14} className="criteria-icon" />
                    ) : (
                      <X size={14} className="criteria-icon" />
                    )}
                    <span>Lowercase letter (a-z)</span>
                  </div>

                  {/* Special Character */}
                  <div
                    className={`criteria-item ${
                      passwordAnalysis.criteria.special ? 'met' : 'missing'
                    }`}
                  >
                    {passwordAnalysis.criteria.special ? (
                      <Check size={14} className="criteria-icon" />
                    ) : (
                      <X size={14} className="criteria-icon" />
                    )}
                    <span>Special character (!@#$...)</span>
                  </div>
                </div>

                {/* Specific missing criteria text message */}
                {passwordAnalysis.missing.length > 0 && formData.password.length > 0 && (
                  <div
                    className="field-error"
                    style={{ marginTop: '4px', fontSize: '0.725rem' }}
                  >
                    <AlertCircle size={13} />
                    <span>Missing: {passwordAnalysis.missing.join(', ')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Submit Button (Matches Login page .submit-btn) */}
            <button
              type="submit"
              className={`submit-btn ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
              style={{ marginTop: '14px' }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="spinner" />
                  <span>Creating Account...</span>
                </>
              ) : (
                'CREATE ACCOUNT'
              )}
            </button>

            {/* Form Footer (Matches Login page) */}
            <div className="form-footer">
              <span className="subtitle-text">Already have an account?</span>
              <Link to="/login" className="footer-link">
                Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}