import { create } from 'zustand';

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

export const validateLoginId = (loginId, firstName = '', lastName = '') => {
  const trimmed = loginId.trim();
  if (!trimmed) {
    return { isValid: false, errorMessage: 'Login ID is required' };
  }

  // Length check (6 - 12 characters)
  if (trimmed.length < 6 || trimmed.length > 12) {
    return {
      isValid: false,
      errorMessage: `Login ID must be between 6 and 12 characters (currently ${trimmed.length})`,
    };
  }

  // Must consist of first name and last name
  const cleanFirst = firstName.trim().toLowerCase();
  const cleanLast = lastName.trim().toLowerCase();
  const cleanLogin = trimmed.toLowerCase();

  if (cleanFirst && cleanLast) {
    // Check if login ID incorporates both first and last names
    // (e.g. johndoe, john.doe, jdoe, or first name + last name)
    const hasFirst = cleanLogin.includes(cleanFirst) || cleanLogin.startsWith(cleanFirst[0]);
    const hasLast = cleanLogin.includes(cleanLast) || (cleanLast.length > 0 && cleanLogin.endsWith(cleanLast.slice(0, 4)));

    const directlyCombines = cleanLogin.replace(/[^a-z0-9]/g, '') === (cleanFirst + cleanLast).slice(0, cleanLogin.length);

    if (!directlyCombines && (!hasFirst || !hasLast)) {
      return {
        isValid: false,
        errorMessage: `Login ID must consist of your first name (${firstName.trim()}) and last name (${lastName.trim()})`,
      };
    }
  } else if (!cleanFirst || !cleanLast) {
    // If names not entered yet, ensure format has at least two name components (e.g. john.doe or letters)
    if (!/^[a-zA-Z0-9._-]+$/.test(trimmed)) {
      return {
        isValid: false,
        errorMessage: 'Login ID can only contain letters, numbers, dots, or underscores',
      };
    }
  }

  return { isValid: true, errorMessage: '' };
};

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

export const useSignupStore = create((set, get) => ({
  formData: {
    firstName: '',
    lastName: '',
    loginId: '',
    email: '',
    role: 'User',
    password: '',
    confirmPassword: '',
  },
  touched: {
    firstName: false,
    lastName: false,
    loginId: false,
    email: false,
    password: false,
    confirmPassword: false,
  },
  errors: {
    name: '',
    loginId: '',
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

  setField: (name, value) => {
    set((state) => {
      const nextFormData = { ...state.formData, [name]: value };
      const nextTouched = { ...state.touched, [name]: true };
      const nextErrors = { ...state.errors, submit: '' };

      // Real-time validation for modified fields
      if (name === 'loginId' || name === 'firstName' || name === 'lastName') {
        const loginCheck = validateLoginId(
          name === 'loginId' ? value : nextFormData.loginId,
          name === 'firstName' ? value : nextFormData.firstName,
          name === 'lastName' ? value : nextFormData.lastName
        );
        if (nextFormData.loginId) {
          nextErrors.loginId = loginCheck.errorMessage;
        }
      }

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

  setTouched: (name) => {
    set((state) => ({
      touched: { ...state.touched, [name]: true },
    }));
  },

  suggestLoginId: () => {
    const { firstName, lastName } = get().formData;
    if (!firstName && !lastName) return;
    const cleanFirst = firstName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanLast = lastName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    let combined = cleanFirst + cleanLast;
    if (combined.length < 6) {
      combined = (combined + '123456').slice(0, 6);
    } else if (combined.length > 12) {
      combined = combined.slice(0, 12);
    }
    get().setField('loginId', combined);
  },

  validateAll: () => {
    const { formData } = get();
    const nextErrors = {};

    if (!formData.firstName.trim()) {
      nextErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      nextErrors.lastName = 'Last name is required';
    }

    const loginCheck = validateLoginId(formData.loginId, formData.firstName, formData.lastName);
    if (!loginCheck.isValid) nextErrors.loginId = loginCheck.errorMessage;

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
        loginId: true,
        email: true,
        password: true,
        confirmPassword: true,
      },
    });

    return allValid;
  },

  setIsLoading: (isLoading) => set({ isLoading }),
  setSubmitError: (errorMsg) => set((state) => ({ errors: { ...state.errors, submit: errorMsg } })),

  resetForm: () =>
    set({
      formData: {
        firstName: '',
        lastName: '',
        loginId: '',
        email: '',
        role: 'User',
        password: '',
        confirmPassword: '',
      },
      touched: {
        firstName: false,
        lastName: false,
        loginId: false,
        email: false,
        password: false,
        confirmPassword: false,
      },
      errors: {
        name: '',
        loginId: '',
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
