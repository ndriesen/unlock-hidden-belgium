/**
 * Password validation utilities
 * Enforces strong password requirements
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate password strength
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export function validatePasswordStrength(password: string): ValidationResult {
  if (!password) {
    return { valid: false, error: "Password is required" };
  }

  if (password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters" };
  }

  if (password.length > 128) {
    return { valid: false, error: "Password must be less than 128 characters" };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one uppercase letter" };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one lowercase letter" };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "Password must contain at least one number" };
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, error: "Password must contain at least one special character" };
  }

  return { valid: true };
}

/**
 * Map generic error messages to user-friendly messages
 * Anti-enumeration: Generic messages that don't reveal account existence
 */
export function mapAuthError(errorMessage: string): string {
  // Use generic message to prevent user enumeration
  const genericMessage = "Invalid email or password";
  
  // Only map known safe messages, otherwise return generic
  const errorMap: Record<string, string> = {
    "Invalid login credentials": genericMessage,
    "User already registered": "An account with this email already exists",
    "Email not confirmed": "Please confirm your email address",
    "Too many requests": "Too many attempts. Please try again later",
    "Network error": "Network error. Please check your connection",
  };

  // Check if we should reveal specific error (signup vs login context would be handled in component)
  const mapped = errorMap[errorMessage];
  return mapped || genericMessage;
}

/**
 * Map signup-specific errors (can be more specific for registration)
 */
export function mapSignupError(errorMessage: string): string {
  const errorMap: Record<string, string> = {
    "Invalid login credentials": "Invalid email or password",
    "User already registered": "An account with this email already exists",
    "Email not confirmed": "Please confirm your email address",
    "Too many requests": "Too many attempts. Please try again later",
    "Network error": "Network error. Please check your connection",
    "Password is too weak": "Password does not meet security requirements",
  };

  return errorMap[errorMessage] || "An error occurred. Please try again";
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { valid: false, error: "Email is required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: "Please enter a valid email address" };
  }

  return { valid: true };
}

