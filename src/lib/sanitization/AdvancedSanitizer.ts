
import { TextSanitizer } from './textSanitizer';
import { HtmlSanitizer } from './htmlSanitizer';
import { SecurityDetector } from './securityDetector';
import { SanitizationOptions } from './types';

export class AdvancedSanitizer {
  private textSanitizer: TextSanitizer;
  private htmlSanitizer: HtmlSanitizer;
  private securityDetector: SecurityDetector;

  constructor() {
    this.textSanitizer = new TextSanitizer();
    this.htmlSanitizer = new HtmlSanitizer();
    this.securityDetector = new SecurityDetector();
  }

  // Delegate text sanitization methods
  sanitizeText(input: string, maxLength?: number): string {
    return this.textSanitizer.sanitizeText(input, maxLength);
  }

  sanitizeEmail(email: string): string {
    return this.textSanitizer.sanitizeEmail(email);
  }

  sanitizePhone(phone: string): string {
    return this.textSanitizer.sanitizePhone(phone);
  }

  sanitizeNumericString(input: string, isInteger?: boolean): string {
    return this.textSanitizer.sanitizeNumericString(input, isInteger);
  }

  sanitizeFilename(filename: string): string {
    return this.textSanitizer.sanitizeFilename(filename);
  }

  sanitizeUrl(url: string): string {
    return this.textSanitizer.sanitizeUrl(url);
  }

  // Delegate HTML sanitization methods
  sanitizeHtml(input: string, options?: SanitizationOptions): string {
    return this.htmlSanitizer.sanitizeHtml(input, options);
  }

  // Delegate security detection methods
  detectXSS(input: string): boolean {
    return this.securityDetector.detectXSS(input);
  }

  detectSQLInjection(input: string): boolean {
    return this.securityDetector.detectSQLInjection(input);
  }
}
