import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Hexagon } from 'lucide-react';
import '../styles/signup.css';

export default function Signup() {
    const [formData, setFormData] = useState({
        name: '',
        loginId: '',
        email: '',
        role: 'User', // Default role based on wireframe
        password: '',
        confirmPassword: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear field-specific error when typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';

        // Login ID validation: 6-12 characters
        if (!formData.loginId) {
            newErrors.loginId = 'Login ID is required';
        } else if (formData.loginId.length < 6 || formData.loginId.length > 12) {
            newErrors.loginId = 'Login ID must be between 6 and 12 characters';
        }

        // Password validation: >8 chars, upper, lower, special
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{9,}$/;
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (!passwordRegex.test(formData.password)) {
            newErrors.password = 'Password must be >8 chars, with uppercase, lowercase, and special character';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleMockSignup = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);

        // Mock API request delay
        setTimeout(() => {
            setIsLoading(false);
            alert('Account created successfully! (Routing to login...)');
            navigate('/login');
        }, 1200);
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
                        <p className="subtitle-text">Register a new User or Administrator</p>
                    </div>

                    <form onSubmit={handleMockSignup} className="login-form" noValidate>

                        <div className="input-row">
                            {/* Name Input */}
                            <div className="input-group">
                                <label htmlFor="name">Full Name</label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    aria-invalid={!!errors.name}
                                />
                                {errors.name && <span className="field-error">{errors.name}</span>}
                            </div>

                            {/* Login ID Input */}
                            <div className="input-group">
                                <label htmlFor="loginId">Login ID</label>
                                <input
                                    id="loginId"
                                    name="loginId"
                                    type="text"
                                    placeholder="john123"
                                    value={formData.loginId}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    aria-invalid={!!errors.loginId}
                                />
                                {errors.loginId && <span className="field-error">{errors.loginId}</span>}
                            </div>
                        </div>

                        {/* Email Input */}
                        <div className="input-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="john@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={isLoading}
                                aria-invalid={!!errors.email}
                            />
                            {errors.email && <span className="field-error">{errors.email}</span>}
                        </div>

                        {/* Role Selection (Radio Buttons) */}
                        <div className="input-group">
                            <label>Role</label>
                            <div className="radio-group">
                                <label className="radio-label">
                                    <input
                                        type="radio"
                                        name="role"
                                        value="User"
                                        checked={formData.role === 'User'}
                                        onChange={handleChange}
                                        disabled={isLoading}
                                    />
                                    <span>User</span>
                                </label>
                                <label className="radio-label">
                                    <input
                                        type="radio"
                                        name="role"
                                        value="Administrator"
                                        checked={formData.role === 'Administrator'}
                                        onChange={handleChange}
                                        disabled={isLoading}
                                    />
                                    <span>Administrator</span>
                                </label>
                            </div>
                        </div>

                        <div className="input-row">
                            {/* Password Input */}
                            <div className="input-group">
                                <label htmlFor="password">Password</label>
                                <div className="password-wrapper">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Create password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        disabled={isLoading}
                                        aria-invalid={!!errors.password}
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
                                {errors.password && <span className="field-error">{errors.password}</span>}
                            </div>

                            {/* Confirm Password Input */}
                            <div className="input-group">
                                <label htmlFor="confirmPassword">Confirm Password</label>
                                <div className="password-wrapper">
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Re-enter password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        disabled={isLoading}
                                        aria-invalid={!!errors.confirmPassword}
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
                                {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className={`submit-btn ${isLoading ? 'loading' : ''}`}
                            disabled={isLoading}
                            style={{ marginTop: '12px' }}
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

                        {/* Form Footer Links */}
                        <div className="form-footer">
                            <span className="subtitle-text">Already have an account?</span>
                            <Link to="/login" className="footer-link">Sign In</Link>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}