/**
 * @file useSignupStore.js
 * @description Zustand state management store for the user registration and onboarding flow.
 * Handles form field states, touched tracking, real-time input validation, criteria analysis
 * for password security, and automated Login ID suggestion.
 * @module store/useSignupStore
 */

import { create } from 'zustand';

/**
 * Evaluates password string against enterprise security complexity criteria.
 * Criteria: length > 8, at least 1 lowercase letter, at least 1 uppercase letter, at least 1 special character.
 * 
 * @function validatePassword
 * @param {string} password - Raw password string entered by the user.
 * @returns {Object} Analysis result containing criteria boolean flags, missing criteria descriptions, and overall validity.
 * @property {Object} criteria - Individual requirement pass/fail flags.
 * @property {boolean} criteria.length - True if password length is strictly greater than 8 characters.
 * @property {boolean} criteria.lowercase - True if contains at least one lowercase letter.
 * @property {boolean} criteria.uppercase - True if contains at least one uppercase letter.
 * @property {boolean} criteria.special - True if contains at least one special symbol.
 * @property {Array<string>} missing - List of human-readable missing criteria.
 * @property {boolean} isValid - True if all criteria are satisfied.
 * @property {string} errorMessage - User-facing formatted error string.
 */
export const validatePassword = (password) => {
  const criteria = {
    length: password.length > 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>_~`\-+=\[\]\\;'/]/.test(password),
  };

  const missing = [];
  if (!criteria.length) missing.push('strictly >8 characters (9+ characters)');
  if (!criteria.uppercase) missing.push('at least 1 uppercase letter (A-Z)');
  if (!criteria.lowercase) missing.push('at least 1 lowercase letter (a-z)');
  if (!criteria.special) missing.push('at least 1 special character (!@#$%...)');

  return {
    criteria,
    missing,
    isValid: missing.length === 0,
    errorMessage: missing.length > 0 ? `Missing criteria: ${missing.join(', ')}` : '',
  };
};



/**
 * Validates a Login ID based on length and characters.
 * 
 * @function validateLoginId
 * @param {string} loginId - The login ID to validate.
 * @param {string} firstName - The first name.
 * @param {string} lastName - The last name.
 * @returns {Object} Object indicating validity and formatted error message.
 */
export const validateLoginId = (loginId, firstName, lastName) => {
  const trimmed = loginId ? loginId.trim() : '';
  if (!trimmed) {
    return { isValid: false, errorMessage: 'Login ID is required' };
  }
  if (trimmed.length < 6 || trimmed.length > 12) {
    return { isValid: false, errorMessage: 'Login ID must be 6-12 characters' };
  }
  const idRegex = /^[a-zA-Z0-9]+$/;
  if (!idRegex.test(trimmed)) {
    return { isValid: false, errorMessage: 'Login ID can only contain letters and numbers' };
  }
  return { isValid: true, errorMessage: '' };
};

/**
 * Validates email address format against standard RFC-compliant regex pattern.
 * 
 * @function validateEmail
 * @param {string} email - Email address string to test.
 * @returns {Object} Object indicating validity and formatted error message.
 * @property {boolean} isValid - True if email format is syntactically valid.
 * @property {string} errorMessage - Error description or empty string.
 */
export const validateEmail = (email) => {
  const trimmed = email.trim();
  if (!trimmed) {
    return { isValid: false, errorMessage: 'Email address is required' };
  }
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, errorMessage: 'Please enter a valid email address (e.g., name@company.com)' };
  }
  return { isValid: true, errorMessage: '' };
};

/**
 * Zustand Hook Store for Signup State and Form Management.
 */
export const useSignupStore = create((set, get) => ({
  /** @type {Object} Form field input values */
  formData: {
    firstName: '',
    lastName: '',
    email: '',
    role: 'User',
    password: '',
    confirmPassword: '',
  },
  /** @type {Object} Tracks whether an input field has been focused/blurred */
  touched: {
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    confirmPassword: false,
  },
  /** @type {Object} Field-level validation error messages */
  errors: {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    submit: '',
  },
  /** @type {Object} Real-time evaluation breakdown of password complexity */
  passwordAnalysis: {
    criteria: {
      length: false,
      lowercase: false,
      uppercase: false,
      special: false,
    },
    missing: [],
  },
  /** @type {boolean} Network submission loading indicator */
  isLoading: false,

  /**
   * Updates a specific form field value and executes real-time validation checks.
   * 
   * @function setField
   * @param {string} name - Field name identifier.
   * @param {string} value - New field value.
   */
  setField: (name, value) => {
    set((state) => {
      const nextFormData = { ...state.formData, [name]: value };
      const nextTouched = { ...state.touched, [name]: true };
      const nextErrors = { ...state.errors, submit: '' };



      if (name === 'email') {
        const emailCheck = validateEmail(value);
        nextErrors.email = emailCheck.errorMessage;
      }

      let passwordAnalysis = state.passwordAnalysis;
      if (name === 'password') {
        const pCheck = validatePassword(value);
        passwordAnalysis = {
          criteria: pCheck.criteria,
          missing: pCheck.missing,
        };
        nextErrors.password = pCheck.errorMessage;

        // Recheck confirm password if already touched
        if (nextFormData.confirmPassword) {
          nextErrors.confirmPassword =
            value !== nextFormData.confirmPassword ? 'Passwords do not match' : '';
        }
      }

      if (name === 'confirmPassword') {
        nextErrors.confirmPassword =
          value !== nextFormData.password ? 'Passwords do not match' : '';
      }

      return {
        formData: nextFormData,
        touched: nextTouched,
        errors: nextErrors,
        passwordAnalysis,
      };
    });
  },

  /**
   * Marks an input field as visited/touched to trigger validation display.
   * 
   * @function setTouched
   * @param {string} name - Field name identifier.
   */
  setTouched: (name) => {
    set((state) => ({
      touched: { ...state.touched, [name]: true },
    }));
  },



  /**
   * Validates all form fields simultaneously prior to form submission.
   * 
   * @function validateAll
   * @returns {boolean} True if all form inputs pass validation.
   */
  validateAll: () => {
    const { formData } = get();
    const nextErrors = {};

    if (!formData.firstName.trim()) {
      nextErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      nextErrors.lastName = 'Last name is required';
    }



    const emailCheck = validateEmail(formData.email);
    if (!emailCheck.isValid) nextErrors.email = emailCheck.errorMessage;

    const pCheck = validatePassword(formData.password);
    if (!pCheck.isValid) nextErrors.password = pCheck.errorMessage;

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = 'Confirm Password is required';
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }

    const allValid = Object.keys(nextErrors).length === 0;

    set({
      errors: { ...get().errors, ...nextErrors },
      touched: {
        firstName: true,
        lastName: true,
        email: true,
        password: true,
        confirmPassword: true,
      },
    });

    return allValid;
  },

  /**
   * Sets network loading state during authentication requests.
   * 
   * @function setIsLoading
   * @param {boolean} isLoading - Loading status flag.
   */
  setIsLoading: (isLoading) => set({ isLoading }),

  /**
   * Sets top-level server or network error message for display in form banner.
   * 
   * @function setSubmitError
   * @param {string} errorMsg - Error description from backend or network layer.
   */
  setSubmitError: (errorMsg) => set((state) => ({ errors: { ...state.errors, submit: errorMsg } })),

  /**
   * Resets form state, validation flags, and errors back to initial blank values.
   * 
   * @function resetForm
   */
  resetForm: () =>
    set({
      formData: {
        firstName: '',
        lastName: '',
        email: '',
        role: 'User',
        password: '',
        confirmPassword: '',
      },
      touched: {
        firstName: false,
        lastName: false,
        email: false,
        password: false,
        confirmPassword: false,
      },
      errors: {
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        submit: '',
      },
      passwordAnalysis: {
        criteria: {
          length: false,
          lowercase: false,
          uppercase: false,
          special: false,
        },
        missing: [],
      },
      isLoading: false,
    }),
}));
