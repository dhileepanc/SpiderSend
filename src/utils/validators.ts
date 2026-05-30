import { CONSTANTS } from './constants';

/**
 * Field Validators
 * Standard utility validations for forms, inputs, and sanitization.
 */

/**
 * Validates if the given email matches a standard format.
 */
export const validateEmail = (email: string): boolean => {
  if (!email) return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
};

/**
 * Validates the password strength.
 * Requires: 1 uppercase, 1 lowercase, 1 number, and min character constraint from CONSTANTS.
 */
export const validatePassword = (password: string): { isValid: boolean; message: string } => {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }

  if (password.length < CONSTANTS.LIMITS.MIN_PASSWORD_LENGTH) {
    return {
      isValid: false,
      message: `Password must be at least ${CONSTANTS.LIMITS.MIN_PASSWORD_LENGTH} characters.`,
    };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasLowerCase || !hasUpperCase) {
    return { isValid: false, message: 'Must contain both uppercase and lowercase letters.' };
  }
  if (!hasNumber) {
    return { isValid: false, message: 'Must contain at least one number.' };
  }
  if (!hasSpecialChar) {
    return { isValid: false, message: 'Must contain at least one special character.' };
  }

  return { isValid: true, message: 'Password is strong.' };
};

/**
 * Validates whether the string is a valid numeric phone number.
 */
export const validatePhone = (phone: string): boolean => {
  if (!phone) return false;
  const sanitized = phone.replace(/[\s\-()]/g, '');
  const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 phone standard
  return (
    phoneRegex.test(sanitized) &&
    sanitized.length >= CONSTANTS.LIMITS.MIN_PHONE_LENGTH &&
    sanitized.length <= CONSTANTS.LIMITS.MAX_PHONE_LENGTH
  );
};

/**
 * Simple empty check validation.
 */
export const isRequired = (value: any): boolean => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};
