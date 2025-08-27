/**
 * Form Validation Utilities
 * Comprehensive validation for authentication forms
 */

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  type?: 'error' | 'warning' | 'success';
}

export interface PasswordStrength {
  score: number; // 0-4
  level: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong';
  feedback: string[];
  color: string;
}

/**
 * Email validation with comprehensive checks
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email) {
    return { isValid: false, message: 'Email is required', type: 'error' };
  }

  if (email.length > 254) {
    return { isValid: false, message: 'Email is too long', type: 'error' };
  }

  // RFC 5322 compliant regex (simplified but robust)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address', type: 'error' };
  }

  // Additional checks
  const parts = email.split('@');
  if (parts[0].length > 64) {
    return { isValid: false, message: 'Email username is too long', type: 'error' };
  }

  // Common typos and issues
  const commonTypos = ['.con', '.conm', '.co', '.cm', '.om', 'gmial', 'yahooo', 'hotmial'];
  const domain = parts[1].toLowerCase();
  
  for (const typo of commonTypos) {
    if (domain.includes(typo)) {
      return { isValid: false, message: 'Please check your email for typos', type: 'warning' };
    }
  }

  return { isValid: true, type: 'success' };
};

/**
 * Password strength assessment
 */
export const assessPasswordStrength = (password: string): PasswordStrength => {
  if (!password) {
    return {
      score: 0,
      level: 'very-weak',
      feedback: ['Password is required'],
      color: 'red'
    };
  }

  let score = 0;
  const feedback: string[] = [];

  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Use at least 8 characters');
  }

  // Character variety checks
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include lowercase letters');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include uppercase letters');
  }

  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include numbers');
  }

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include special characters');
  }

  // Length bonus
  if (password.length >= 12) {
    score = Math.min(5, score + 1);
  }

  // Common password penalties
  const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'welcome'];
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    score = Math.max(0, score - 2);
    feedback.push('Avoid common passwords');
  }

  // Determine level and color
  let level: PasswordStrength['level'];
  let color: string;

  if (score <= 1) {
    level = 'very-weak';
    color = 'red';
  } else if (score === 2) {
    level = 'weak';
    color = 'orange';
  } else if (score === 3) {
    level = 'fair';
    color = 'yellow';
  } else if (score === 4) {
    level = 'good';
    color = 'blue';
  } else {
    level = 'strong';
    color = 'green';
  }

  return { score, level, feedback, color };
};

/**
 * Password validation for authentication
 */
export const validatePassword = (password: string, isSignUp: boolean = false): ValidationResult => {
  if (!password) {
    return { isValid: false, message: 'Password is required', type: 'error' };
  }

  if (isSignUp) {
    const strength = assessPasswordStrength(password);
    
    if (strength.score < 3) {
      return { 
        isValid: false, 
        message: `Password is ${strength.level.replace('-', ' ')}: ${strength.feedback.join(', ')}`, 
        type: 'error' 
      };
    }
  } else {
    // For sign-in, just check minimum length
    if (password.length < 1) {
      return { isValid: false, message: 'Password is required', type: 'error' };
    }
  }

  return { isValid: true, type: 'success' };
};

/**
 * Form field validation state
 */
export interface FieldState {
  value: string;
  validation: ValidationResult;
  touched: boolean;
  focused: boolean;
}

/**
 * Form validation utilities
 */
export const createInitialFieldState = (value: string = ''): FieldState => ({
  value,
  validation: { isValid: true },
  touched: false,
  focused: false
});

export const updateFieldState = (
  field: FieldState,
  updates: Partial<FieldState>,
  validator?: (value: string) => ValidationResult
): FieldState => {
  const newState = { ...field, ...updates };
  
  if (validator && (updates.value !== undefined || updates.touched)) {
    newState.validation = validator(newState.value);
  }
  
  return newState;
};

/**
 * Real-time validation debouncer
 */
export const createDebouncer = (fn: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Form submission validation
 */
export const validateAuthForm = (
  email: string,
  password: string,
  isSignUp: boolean = false
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.message || 'Invalid email';
  }
  
  const passwordValidation = validatePassword(password, isSignUp);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.message || 'Invalid password';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Common email domains for suggestions
 */
export const COMMON_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'protonmail.com',
  'aol.com'
];

/**
 * Email domain suggestion
 */
export const suggestEmailDomain = (email: string): string | null => {
  const parts = email.split('@');
  if (parts.length !== 2) return null;
  
  const [username, domain] = parts;
  const lowerDomain = domain.toLowerCase();
  
  // Find closest match using simple distance calculation
  let bestMatch = null;
  let minDistance = Infinity;
  
  for (const commonDomain of COMMON_EMAIL_DOMAINS) {
    const distance = calculateLevenshteinDistance(lowerDomain, commonDomain);
    if (distance < minDistance && distance <= 2 && distance > 0) {
      minDistance = distance;
      bestMatch = commonDomain;
    }
  }
  
  return bestMatch ? `${username}@${bestMatch}` : null;
};

/**
 * Simple Levenshtein distance calculation
 */
function calculateLevenshteinDistance(a: string, b: string): number {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  
  for (let i = 0; i <= a.length; i++) {
    matrix[0][i] = i;
  }
  
  for (let j = 0; j <= b.length; j++) {
    matrix[j][0] = j;
  }
  
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[b.length][a.length];
}