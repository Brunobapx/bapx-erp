
import { sanitizer } from '@/lib/sanitization';

// Enhanced input sanitization with strict validation
export class InputSanitizer {
  
  // Sanitize and validate text inputs
  static sanitizeText(input: string, maxLength: number = 255): string {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }
    
    const sanitized = sanitizer.sanitizeText(input, maxLength);
    
    // Additional security checks
    if (sanitizer.detectXSS(sanitized) || sanitizer.detectSQLInjection(sanitized)) {
      throw new Error('Input contains potentially dangerous content');
    }
    
    return sanitized;
  }
  
  // Sanitize email with strict validation
  static sanitizeEmail(email: string): string {
    if (typeof email !== 'string') {
      throw new Error('Email must be a string');
    }
    
    const sanitized = sanitizer.sanitizeEmail(email);
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitized)) {
      throw new Error('Invalid email format');
    }
    
    return sanitized;
  }
  
  // Sanitize phone numbers
  static sanitizePhone(phone: string): string {
    if (typeof phone !== 'string') {
      throw new Error('Phone must be a string');
    }
    
    return sanitizer.sanitizePhone(phone);
  }
  
  // Sanitize numeric inputs
  static sanitizeNumeric(input: string | number, isInteger: boolean = false): string {
    const stringInput = String(input);
    const sanitized = sanitizer.sanitizeNumericString(stringInput, isInteger);
    
    if (isInteger && !Number.isInteger(Number(sanitized))) {
      throw new Error('Input must be an integer');
    }
    
    return sanitized;
  }
  
  // Sanitize search queries
  static sanitizeSearchQuery(query: string): string {
    if (typeof query !== 'string') {
      throw new Error('Search query must be a string');
    }
    
    const sanitized = sanitizer.sanitizeText(query, 200);
    
    // Log suspicious search attempts
    if (sanitizer.detectXSS(query) || sanitizer.detectSQLInjection(query)) {
      console.warn('[SECURITY] Suspicious search query detected:', query);
      throw new Error('Search query contains potentially dangerous content');
    }
    
    return sanitized;
  }
  
  // Validate and sanitize form data
  static sanitizeFormData<T extends Record<string, any>>(data: T): T {
    const sanitizedData = { ...data };
    
    for (const [key, value] of Object.entries(sanitizedData)) {
      if (typeof value === 'string') {
        try {
          if (key.toLowerCase().includes('email')) {
            sanitizedData[key] = this.sanitizeEmail(value);
          } else if (key.toLowerCase().includes('phone')) {
            sanitizedData[key] = this.sanitizePhone(value);
          } else {
            sanitizedData[key] = this.sanitizeText(value);
          }
        } catch (error) {
          console.error(`[SECURITY] Error sanitizing field ${key}:`, error);
          throw new Error(`Invalid ${key}: ${error.message}`);
        }
      }
    }
    
    return sanitizedData;
  }
}
