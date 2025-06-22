
import { HTML_ENTITIES } from './constants';

export class TextSanitizer {
  // Sanitização básica para texto simples
  sanitizeText(input: string, maxLength: number = 1000): string {
    if (typeof input !== 'string') {
      return '';
    }

    let sanitized = input
      .trim()
      .substring(0, maxLength)
      .replace(/[&<>"'`=\/]/g, char => HTML_ENTITIES[char] || char);

    // Remove caracteres de controle
    sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

    // Remove sequências de espaços múltiplos
    sanitized = sanitized.replace(/\s+/g, ' ');

    return sanitized;
  }

  // Sanitização para diferentes tipos de input
  sanitizeEmail(email: string): string {
    if (typeof email !== 'string') return '';
    
    return email
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9@._-]/g, '')
      .substring(0, 254);
  }

  sanitizePhone(phone: string): string {
    if (typeof phone !== 'string') return '';
    
    return phone
      .replace(/[^0-9+()-\s]/g, '')
      .trim()
      .substring(0, 20);
  }

  sanitizeNumericString(input: string, isInteger: boolean = false): string {
    if (typeof input !== 'string') return '';
    
    let sanitized = input.replace(/[^0-9.-]/g, '');
    
    if (isInteger) {
      sanitized = sanitized.replace(/[.-]/g, '');
    }
    
    return sanitized;
  }

  sanitizeFilename(filename: string): string {
    if (typeof filename !== 'string') return '';
    
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 255);
  }

  sanitizeUrl(url: string): string {
    if (typeof url !== 'string') return '';
    
    try {
      const parsedUrl = new URL(url);
      
      // Apenas protocolos seguros
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return '';
      }
      
      return parsedUrl.toString();
    } catch {
      return '';
    }
  }
}
