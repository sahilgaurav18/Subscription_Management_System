import passwordRules from '@shared/config/password_rules.json';

export interface PasswordCheckResult {
  hasLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasSpecial: boolean;
  isValid: boolean;
}

export function validatePassword(password: string): PasswordCheckResult {
  const minLength = passwordRules.min_length || 8;
  const hasLength = password.length > minLength;
  const hasUpper = passwordRules.require_uppercase ? /[A-Z]/.test(password) : true;
  const hasLower = passwordRules.require_lowercase ? /[a-z]/.test(password) : true;
  const specialRegex = new RegExp(passwordRules.special_chars_regex || '[^a-zA-Z0-9]');
  const hasSpecial = passwordRules.require_special ? specialRegex.test(password) : true;

  return {
    hasLength,
    hasUpper,
    hasLower,
    hasSpecial,
    isValid: hasLength && hasUpper && hasLower && hasSpecial,
  };
}
