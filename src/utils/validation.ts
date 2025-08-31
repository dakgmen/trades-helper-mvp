// Comprehensive validation utilities for forms and data

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => string | null;
  email?: boolean;
  phone?: boolean;
  url?: boolean;
  number?: boolean;
  min?: number;
  max?: number;
  fileSize?: number; // in bytes
  fileTypes?: string[]; // MIME types
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  firstError?: string;
}

export class FormValidator {
  private rules: Record<string, ValidationRule> = {};
  private customMessages: Record<string, Record<string, string>> = {};

  // Set validation rules for fields
  setRules(rules: Record<string, ValidationRule>): FormValidator {
    this.rules = rules;
    return this;
  }

  // Set custom error messages
  setMessages(messages: Record<string, Record<string, string>>): FormValidator {
    this.customMessages = messages;
    return this;
  }

  // Validate data against rules
  validate(data: Record<string, unknown>): ValidationResult {
    const errors: Record<string, string[]> = {};

    Object.keys(this.rules).forEach(field => {
      const value = data[field];
      const rule = this.rules[field];
      const fieldErrors: string[] = [];

      // Required validation
      if (rule.required && this.isEmpty(value)) {
        fieldErrors.push(this.getMessage(field, 'required', 'This field is required'));
      }

      // Skip other validations if field is empty and not required
      if (!rule.required && this.isEmpty(value)) {
        return;
      }

      // String length validations
      if (typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          fieldErrors.push(this.getMessage(field, 'minLength', `Must be at least ${rule.minLength} characters`));
        }

        if (rule.maxLength && value.length > rule.maxLength) {
          fieldErrors.push(this.getMessage(field, 'maxLength', `Must not exceed ${rule.maxLength} characters`));
        }
      }

      // Email validation
      if (rule.email && typeof value === 'string' && !this.isValidEmail(value)) {
        fieldErrors.push(this.getMessage(field, 'email', 'Please enter a valid email address'));
      }

      // Phone validation (Australian format)
      if (rule.phone && typeof value === 'string' && !this.isValidPhone(value)) {
        fieldErrors.push(this.getMessage(field, 'phone', 'Please enter a valid Australian phone number'));
      }

      // URL validation
      if (rule.url && typeof value === 'string' && !this.isValidURL(value)) {
        fieldErrors.push(this.getMessage(field, 'url', 'Please enter a valid URL'));
      }

      // Number validation
      if (rule.number && !this.isValidNumber(value)) {
        fieldErrors.push(this.getMessage(field, 'number', 'Please enter a valid number'));
      }

      // Min/Max number validation
      if (rule.number && typeof value === 'number') {
        if (rule.min !== undefined && value < rule.min) {
          fieldErrors.push(this.getMessage(field, 'min', `Must be at least ${rule.min}`));
        }

        if (rule.max !== undefined && value > rule.max) {
          fieldErrors.push(this.getMessage(field, 'max', `Must not exceed ${rule.max}`));
        }
      }

      // Pattern validation
      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        fieldErrors.push(this.getMessage(field, 'pattern', 'Invalid format'));
      }

      // File size validation
      if (rule.fileSize && value instanceof File && value.size > rule.fileSize) {
        const maxSizeMB = Math.round(rule.fileSize / (1024 * 1024));
        fieldErrors.push(this.getMessage(field, 'fileSize', `File must be smaller than ${maxSizeMB}MB`));
      }

      // File type validation
      if (rule.fileTypes && value instanceof File && !rule.fileTypes.includes(value.type)) {
        fieldErrors.push(this.getMessage(field, 'fileTypes', 'Invalid file type'));
      }

      // Custom validation
      if (rule.custom) {
        const customError = rule.custom(value);
        if (customError) {
          fieldErrors.push(customError);
        }
      }

      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
      }
    });

    const isValid = Object.keys(errors).length === 0;
    const firstError = isValid ? undefined : Object.values(errors)[0][0];

    return { isValid, errors, firstError };
  }

  // Get custom message or default
  private getMessage(field: string, rule: string, defaultMessage: string): string {
    return this.customMessages[field]?.[rule] || defaultMessage;
  }

  // Check if value is empty
  private isEmpty(value: unknown): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  // Email validation
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Australian phone validation
  private isValidPhone(phone: string): boolean {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    
    // Australian mobile: 04xxxxxxxx (10 digits)
    // Australian landline: 0x xxxx xxxx (10 digits)
    // International format: +61 4xx xxx xxx
    if (cleaned.startsWith('61')) {
      return cleaned.length === 11 && cleaned.startsWith('614');
    }
    
    return cleaned.length === 10 && cleaned.startsWith('0');
  }

  // URL validation
  private isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Number validation
  private isValidNumber(value: unknown): boolean {
    return !isNaN(Number(value)) && isFinite(Number(value));
  }
}

// Pre-defined validation rules for common fields
export const CommonValidationRules = {
  email: {
    required: true,
    email: true,
    maxLength: 255,
  },

  password: {
    required: true,
    minLength: 8,
    custom: (value: string) => {
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
        return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
      }
      return null;
    },
  },

  phone: {
    required: true,
    phone: true,
  },

  fullName: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s'-]+$/,
  },

  jobTitle: {
    required: true,
    minLength: 3,
    maxLength: 100,
  },

  jobDescription: {
    required: true,
    minLength: 20,
    maxLength: 2000,
  },

  hourlyRate: {
    required: true,
    number: true,
    min: 20,
    max: 200,
  },

  whiteCardFile: {
    required: true,
    fileSize: 10 * 1024 * 1024, // 10MB
    fileTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  },

  profileImage: {
    fileSize: 5 * 1024 * 1024, // 5MB
    fileTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
};

// Utility functions for common validations
export const ValidationUtils = {
  // Validate ABN (Australian Business Number)
  validateABN(abn: string): boolean {
    const cleaned = abn.replace(/\s/g, '');
    if (!/^\d{11}$/.test(cleaned)) return false;

    const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
    const digits = cleaned.split('').map(Number);
    digits[0] -= 1;

    const sum = digits.reduce((acc, digit, index) => acc + digit * weights[index], 0);
    return sum % 89 === 0;
  },

  // Validate credit card number (Luhn algorithm)
  validateCreditCard(number: string): boolean {
    const cleaned = number.replace(/\s/g, '');
    if (!/^\d+$/.test(cleaned)) return false;

    let sum = 0;
    let shouldDouble = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);

      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
  },

  // Validate Australian postcode
  validatePostcode(postcode: string): boolean {
    return /^\d{4}$/.test(postcode);
  },

  // Sanitize HTML input
  sanitizeHTML(html: string): string {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  },

  // Validate date is in future
  isFutureDate(date: string): boolean {
    return new Date(date) > new Date();
  },

  // Validate age (must be 18+)
  validateAge(birthDate: string): boolean {
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1 >= 18;
    }
    
    return age >= 18;
  },
};

// Hook for form validation
export const useFormValidation = (rules: Record<string, ValidationRule>) => {
  const validator = new FormValidator().setRules(rules);

  const validate = (data: Record<string, unknown>) => {
    return validator.validate(data);
  };

  const validateField = (field: string, value: unknown) => {
    const fieldRules = { [field]: rules[field] };
    const fieldValidator = new FormValidator().setRules(fieldRules);
    const result = fieldValidator.validate({ [field]: value });
    
    return {
      isValid: result.isValid,
      error: result.errors[field]?.[0],
    };
  };

  return { validate, validateField };
};