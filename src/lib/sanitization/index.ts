
import { AdvancedSanitizer } from './AdvancedSanitizer';
import { auditSecurityEvent } from '../auditLogging';

export const sanitizer = new AdvancedSanitizer();

// Re-export types and utilities
export type { SanitizationOptions } from './types';
export { TextSanitizer } from './textSanitizer';
export { HtmlSanitizer } from './htmlSanitizer';
export { SecurityDetector } from './securityDetector';
export { AdvancedSanitizer } from './AdvancedSanitizer';

// Funções utilitárias para diferentes casos de uso
export const sanitizeUserInput = (input: string, options?: SanitizationOptions): string => {
  return sanitizer.sanitizeHtml(input, options);
};

export const sanitizeTextInput = (input: string): string => {
  return sanitizer.sanitizeText(input);
};

export const sanitizeSearchQuery = (query: string): string => {
  const sanitized = sanitizer.sanitizeText(query, 200);
  
  // Log tentativas suspeitas
  if (sanitizer.detectXSS(query) || sanitizer.detectSQLInjection(query)) {
    console.warn('[SECURITY] Tentativa de ataque detectada na busca:', query);
    auditSecurityEvent(
      'suspicious_search',
      { originalQuery: query, sanitizedQuery: sanitized },
      undefined,
      navigator.userAgent,
      false,
      'Possível tentativa de XSS ou SQL Injection'
    );
  }
  
  return sanitized;
};
