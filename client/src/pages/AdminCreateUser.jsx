/**
 * @file AdminCreateUser.jsx
 * @description Administrative user provisioning portal page for Valora ERP.
 * Allows administrators to create new internal users, set credentials, and explicitly
 * assign system permission roles (ADMIN, ACCOUNTANT, or CONTACT).
 * @module pages/AdminCreateUser
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, ShieldCheck, Check, X, AlertCircle, UserPlus, ArrowLeft } from 'lucide-react';
import { validatePassword, validateLoginId, validateEmail } from '../store/useSignupStore';
import { BACKEND_URL } from '../api';
import '../styles/signup.css';
import valoraLogoTransparent from '../assets/valora-logo-transparent.png';

/**
 * Admin view component for provisioning new system users with role assignment.
 * 
 * @component
 * @param {Object} props - Component properties.
 * @param {boolean} [props.isEmbedded=false] - Whether rendered embedded within settings or standalone.
 * @returns {JSX.Element} Rendered administrative user provisioning view.
 */
export default function AdminCreateUser({ isEmbedded = false }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    loginId: '',
    email: '',
    role: 'ACCOUNTANT', // Default to Accountant for admin user creation
    contactType: 'CUSTOMER',
    password: '',
    confirmPassword: '',
  });

  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Real-time password evaluation
  const passwordAnalysis = validatePassword(formData.password);

  /**
   * Controlled change handler executing real-time validation across inputs.
   * 
   * @function handleChange
   * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
    setSuccessMessage('');

    // Real-time validation
    if (name === 'loginId' || name === 'firstName' || name === 'lastName') {
      const loginCheck = validateLoginId(
        name === 'loginId' ? value : formData.loginId,
        name === 'firstName' ? value : formData.firstName,
        name === 'lastName' ? value : formData.lastName
      );
      setErrors((prev) => ({ ...prev, loginId: loginCheck.errorMessage }));
    }

    if (name === 'email') {
      const emailCheck = validateEmail(value);
      setErrors((prev) => ({ ...prev, email: emailCheck.errorMessage }));
    }

    if (name === 'password') {
      const pCheck = validatePassword(value);
      setErrors((prev) => ({
        ...prev,
        password: pCheck.errorMessage,
        confirmPassword:
          formData.confirmPassword && value !== formData.confirmPassword
            ? 'Passwords do not match'
            : '',
      }));
    }

    if (name === 'confirmPassword') {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: value !== formData.password ? 'Passwords do not match' : '',
      }));
    }
  };

  /**
   * Tracks field blur event to initiate validation state display.
   * 
   * @function handleBlur
   * @param {React.FocusEvent<HTMLInputElement>} e - Input blur event.
   */
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  /**
   * Derives a compliant Login ID (6-12 characters) based on currently entered first and last name.
   * 
   * @function suggestLoginId
   */
  const suggestLoginId = () => {
    const { firstName, lastName } = formData;
    if (!firstName && !lastName) return;
    const cleanFirst = firstName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanLast = lastName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    let combined = cleanFirst + cleanLast;
    if (combined.length < 6) {
      combined = (combined + '123456').slice(0, 6);
    } else if (combined.length > 12) {
      combined = combined.slice(0, 12);
    }
    setFormData((prev) => ({ ...prev, loginId: combined }));
    setTouched((prev) => ({ ...prev, loginId: true }));

    const loginCheck = validateLoginId(combined, firstName, lastName);
    setErrors((prev) => ({ ...prev, loginId: loginCheck.errorMessage }));
  };

  /**
   * Performs full form validation check across all fields before submission.
   * 
   * @function validateAll
   * @returns {boolean} True if all validation rules are satisfied.
   */
  const validateAll = () => {
    const nextErrors = {};

    if (!formData.firstName.trim()) nextErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) nextErrors.lastName = 'Last name is required';

    const loginCheck = validateLoginId(formData.loginId, formData.firstName, formData.lastName);
    if (!loginCheck.isValid) nextErrors.loginId = loginCheck.errorMessage;

    const emailCheck = validateEmail(formData.email);
    if (!emailCheck.isValid) nextErrors.email = emailCheck.errorMessage;

    const pCheck = validatePassword(formData.password);
    if (!pCheck.isValid) nextErrors.password = pCheck.errorMessage;

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = 'Confirm password is required';
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(nextErrors);
    setTouched({
      firstName: true,
      lastName: true,
      loginId: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    return Object.keys(nextErrors).length === 0;
  };

  /**
   * Handles submission of the user creation form to the backend /auth/signup endpoint.
   * 
   * @async
   * @function handleSubmit
   * @param {React.FormEvent} e - Form submission event.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateAll()) {
      return;
    }

    setIsLoading(true);
    setSuccessMessage('');
    setErrors((prev) => ({ ...prev, submit: '' }));

    try {
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
          role: formData.role, // ADMIN, ACCOUNTANT, or CONTACT
          contact_type: formData.role === 'CONTACT' ? formData.contactType : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (Array.isArray(data.error)) {
          setErrors((prev) => ({ ...prev, submit: data.error.map((err) => err.message).join(', ') }));
        } else {
          setErrors((prev) => ({ ...prev, submit: data.error || 'Failed to create user.' }));
        }
        setIsLoading(false);
        return;
      }

      setSuccessMessage(`User "${fullName}" (${formData.role}${formData.role === 'CONTACT' ? ` - ${formData.contactType}` : ''}) created successfully!`);
      setIsLoading(false);

      // Reset fields for the next creation
      setFormData({
        firstName: '',
        lastName: '',
        loginId: '',
        email: '',
        role: 'ACCOUNTANT',
        contactType: 'CUSTOMER',
        password: '',
        confirmPassword: '',
      });
      setTouched({});
      setErrors({});
    } catch (err) {
      setErrors((prev) => ({ ...prev, submit: 'Network error. Please verify backend server is running.' }));
      setIsLoading(false);
    }
  };

  const isLoginIdLengthInvalid =
    formData.loginId.length > 0 &&
    (formData.loginId.length < 6 || formData.loginId.length > 12);

  return (
    <div className="login-layout">
      {/* LEFT COLUMN: BRANDING & ADMIN VISUAL */}
      <div className="login-brand-panel">
        <div className="brand-content">
          <div className="brand-logo">
            <img src={valoraLogoTransparent} alt="Valora" className="brand-logo-img" />
          </div>
          <div className="brand-messaging">
            <h2>Administration Portal</h2>
            <p>
              Provision new user credentials, grant operational privileges, and configure role-based access for your enterprise team.
            </p>
          </div>

          <div className="brand-graphic">
            <div className="abstract-shape shape-1"></div>
            <div className="abstract-shape shape-2"></div>
            <div className="abstract-shape shape-3"></div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: ADMIN USER CREATION FORM */}
      <div className="login-form-panel">
        <div className="form-container signup-container">
          {/* Header */}
          <div className="form-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
              <span
                style={{
                  backgroundColor: 'var(--valora-primary-light)',
                  color: 'var(--valora-primary)',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                Admin Control
              </span>
            </div>
            <h2 className="welcome-text">Create User</h2>
            <p className="subtitle-text">Enter user details and assign an authorization role</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            {/* Success Message Banner */}
            {successMessage && (
              <div
                style={{
                  marginBottom: '16px',
                  padding: '12px 16px',
                  backgroundColor: '#EAF7EE',
                  borderRadius: '6px',
                  border: '1px solid #B8E7C4',
                  color: 'var(--valora-success)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                }}
              >
                <Check size={18} />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Error Message Banner */}
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

            {/* First Name & Last Name */}
            <div className="input-row">
              <div className="input-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="e.g. Alice"
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
                  placeholder="e.g. Smith"
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

            {/* Login ID Input */}
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
                placeholder="e.g. alicesmith (6-12 chars, first + last name)"
                value={formData.loginId}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isLoading}
                aria-invalid={!!errors.loginId && (touched.loginId || isLoginIdLengthInvalid)}
              />
              {errors.loginId && (touched.loginId || formData.loginId.length > 0) && (
                <span className="field-error">
                  <AlertCircle size={14} />
                  <span>{errors.loginId}</span>
                </span>
              )}
            </div>

            {/* Email Address */}
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="e.g. alice@company.com"
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

            {/* Role Selection (ADMIN SPECIFIC) */}
            <div className="input-group">
              <label style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Assigned Role</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--valora-text-muted)', fontWeight: 'normal' }}>
                  (Determines system permissions)
                </span>
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '10px',
                  marginTop: '6px',
                }}
              >
                {/* Administrator */}
                <label
                  style={{
                    border: `1.5px solid ${formData.role === 'ADMIN' ? 'var(--valora-primary)' : 'var(--valora-border)'}`,
                    backgroundColor: formData.role === 'ADMIN' ? 'var(--valora-primary-light)' : '#FFFFFF',
                    borderRadius: '8px',
                    padding: '10px 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: '4px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="role"
                    value="ADMIN"
                    checked={formData.role === 'ADMIN'}
                    onChange={handleChange}
                    disabled={isLoading}
                    style={{ display: 'none' }}
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--valora-text-main)' }}>
                    Admin
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--valora-text-muted)' }}>
                    Full System Access
                  </span>
                </label>

                {/* Accountant */}
                <label
                  style={{
                    border: `1.5px solid ${formData.role === 'ACCOUNTANT' ? 'var(--valora-primary)' : 'var(--valora-border)'}`,
                    backgroundColor: formData.role === 'ACCOUNTANT' ? 'var(--valora-primary-light)' : '#FFFFFF',
                    borderRadius: '8px',
                    padding: '10px 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: '4px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="role"
                    value="ACCOUNTANT"
                    checked={formData.role === 'ACCOUNTANT'}
                    onChange={handleChange}
                    disabled={isLoading}
                    style={{ display: 'none' }}
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--valora-text-main)' }}>
                    Accountant
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--valora-text-muted)' }}>
                    Ledgers & Reports
                  </span>
                </label>

                {/* Standard User / Contact */}
                <label
                  style={{
                    border: `1.5px solid ${formData.role === 'CONTACT' ? 'var(--valora-primary)' : 'var(--valora-border)'}`,
                    backgroundColor: formData.role === 'CONTACT' ? 'var(--valora-primary-light)' : '#FFFFFF',
                    borderRadius: '8px',
                    padding: '10px 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: '4px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="role"
                    value="CONTACT"
                    checked={formData.role === 'CONTACT'}
                    onChange={handleChange}
                    disabled={isLoading}
                    style={{ display: 'none' }}
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--valora-text-main)' }}>
                    User
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--valora-text-muted)' }}>
                    Standard Portal
                  </span>
                </label>
              </div>

              {formData.role === 'CONTACT' && (
                <div style={{ marginTop: '12px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--valora-text-muted)', marginBottom: '6px', display: 'block' }}>
                    Contact Classification (Customer / Vendor / Both)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    {[
                      { key: 'CUSTOMER', label: 'Customer' },
                      { key: 'VENDOR', label: 'Vendor' },
                      { key: 'BOTH', label: 'Customer & Vendor' }
                    ].map(({ key, label }) => (
                      <label
                        key={key}
                        style={{
                          border: `1.5px solid ${formData.contactType === key ? 'var(--valora-primary)' : 'var(--valora-border)'}`,
                          backgroundColor: formData.contactType === key ? 'var(--valora-primary-light)' : '#FFFFFF',
                          borderRadius: '6px',
                          padding: '6px 8px',
                          cursor: 'pointer',
                          textAlign: 'center',
                          fontSize: '0.78rem',
                          fontWeight: '600',
                          color: 'var(--valora-text-main)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <input
                          type="radio"
                          name="contactType"
                          value={key}
                          checked={formData.contactType === key}
                          onChange={handleChange}
                          disabled={isLoading}
                          style={{ display: 'none' }}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Password & Confirm Password */}
            <div className="input-row">
              <div className="input-group">
                <label htmlFor="password">Temporary Password</label>
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
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

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
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {touched.confirmPassword && errors.confirmPassword && (
              <span className="field-error" style={{ marginTop: '-8px' }}>
                <AlertCircle size={14} />
                <span>{errors.confirmPassword}</span>
              </span>
            )}

            {/* Password Criteria Checklist */}
            {(formData.password.length > 0 || touched.password) && (
              <div className="password-criteria-box">
                <div className="criteria-title">Password Security Requirements</div>
                <div className="criteria-list">
                  <div className={`criteria-item ${passwordAnalysis.criteria.length ? 'met' : 'missing'}`}>
                    {passwordAnalysis.criteria.length ? <Check size={14} /> : <X size={14} />}
                    <span>Strictly &gt; 8 characters (9+)</span>
                  </div>
                  <div className={`criteria-item ${passwordAnalysis.criteria.uppercase ? 'met' : 'missing'}`}>
                    {passwordAnalysis.criteria.uppercase ? <Check size={14} /> : <X size={14} />}
                    <span>Uppercase letter (A-Z)</span>
                  </div>
                  <div className={`criteria-item ${passwordAnalysis.criteria.lowercase ? 'met' : 'missing'}`}>
                    {passwordAnalysis.criteria.lowercase ? <Check size={14} /> : <X size={14} />}
                    <span>Lowercase letter (a-z)</span>
                  </div>
                  <div className={`criteria-item ${passwordAnalysis.criteria.special ? 'met' : 'missing'}`}>
                    {passwordAnalysis.criteria.special ? <Check size={14} /> : <X size={14} />}
                    <span>Special character (!@#$...)</span>
                  </div>
                </div>

                {passwordAnalysis.missing.length > 0 && formData.password.length > 0 && (
                  <div className="field-error" style={{ marginTop: '4px', fontSize: '0.725rem' }}>
                    <AlertCircle size={13} />
                    <span>Missing: {passwordAnalysis.missing.join(', ')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className={`submit-btn ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
              style={{ marginTop: '16px' }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="spinner" />
                  <span>Creating User...</span>
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  <span>CREATE USER (ADMIN)</span>
                </>
              )}
            </button>

            {/* Navigation Links */}
            <div className="form-footer" style={{ marginTop: '20px' }}>
              <Link to="/dashboard" className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ArrowLeft size={16} />
                <span>Return to Dashboard</span>
              </Link>
              <span className="divider">•</span>
              <Link to="/settings" className="footer-link">
                Settings
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
