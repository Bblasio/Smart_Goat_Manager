/**
 * Password Policy Evaluator for Smart Goat Management System
 * Enforces:
 * 1. Minimum 6 characters
 * 2. At least one capital letter (A-Z)
 * 3. At least one small letter (a-z)
 * 4. At least one number (0-9)
 * 5. At least one special character (!@#$%^&*...)
 */

export interface PasswordPolicyStatus {
  minLength: boolean;
  hasCapital: boolean;
  hasSmall: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  metCount: number;
  isValid: boolean;
  missingPolicies: string[];
}

export function evaluatePasswordPolicy(password: string): PasswordPolicyStatus {
  const minLength = password.length >= 6;
  const hasCapital = /[A-Z]/.test(password);
  const hasSmall = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  // Matches any special symbol / punctuation
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password);

  const missingPolicies: string[] = [];
  if (!minLength) missingPolicies.push('at least 6 characters');
  if (!hasCapital) missingPolicies.push('at least one capital letter (A-Z)');
  if (!hasSmall) missingPolicies.push('at least one small letter (a-z)');
  if (!hasNumber) missingPolicies.push('at least one number (0-9)');
  if (!hasSpecial) missingPolicies.push('at least one special character (e.g. !@#$%^&*)');

  const metCount = [minLength, hasCapital, hasSmall, hasNumber, hasSpecial].filter(Boolean).length;
  const isValid = metCount === 5;

  return {
    minLength,
    hasCapital,
    hasSmall,
    hasNumber,
    hasSpecial,
    metCount,
    isValid,
    missingPolicies,
  };
}
