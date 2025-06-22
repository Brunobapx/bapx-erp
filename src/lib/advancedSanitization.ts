
interface SanitizationOptions {
  allowHtml?: boolean;
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  maxLength?: number;
  preserveFormatting?: boolean;
}

class AdvancedSanitizer {
  private htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };

  private allowedTags = [
    'p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
  ];

  private allowedAttributes: Record<string, string[]> = {
    'a': ['href', 'title'],
    'img': ['src', 'alt', 'title', 'width', 'height'],
    'p': ['class'],
    'span': ['class']
  };

  // Sanitização básica para texto simples
  sanitizeText(input: string, maxLength: number = 1000): string {
    if (typeof input !== 'string') {
      return '';
    }

    let sanitized = input
      .trim()
      .substring(0, maxLength)
      .replace(/[&<>"'`=\/]/g, char => this.htmlEntities[char] || char);

    // Remove caracteres de controle
    sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

    // Remove sequências de espaços múltiplos
    sanitized = sanitized.replace(/\s+/g, ' ');

    return sanitized;
  }

  // Sanitização para HTML com whitelist
  sanitizeHtml(input: string, options: SanitizationOptions = {}): string {
    if (typeof input !== 'string') {
      return '';
    }

    const {
      allowHtml = false,
      allowedTags = this.allowedTags,
      allowedAttributes = this.allowedAttributes,
      maxLength = 5000,
      preserveFormatting = false
    } = options;

    let sanitized = input.substring(0, maxLength);

    if (!allowHtml) {
      return this.sanitizeText(sanitized, maxLength);
    }

    // Remove scripts e eventos
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/vbscript:/gi, '');
    sanitized = sanitized.replace(/data:text\/html/gi, '');

    // Whitelist de tags
    const tagRegex = /<(\/?)([\w-]+)([^>]*)>/gi;
    sanitized = sanitized.replace(tagRegex, (match, closing, tagName, attributes) => {
      const tag = tagName.toLowerCase();
      
      if (!allowedTags.includes(tag)) {
        return '';
      }

      if (closing) {
        return `</${tag}>`;
      }

      // Sanitizar atributos
      const sanitizedAttributes = this.sanitizeAttributes(attributes, tag, allowedAttributes);
      return `<${tag}${sanitizedAttributes}>`;
    });

    if (!preserveFormatting) {
      sanitized = sanitized.replace(/\s+/g, ' ').trim();
    }

    return sanitized;
  }

  private sanitizeAttributes(
    attributes: string, 
    tagName: string, 
    allowedAttributes: Record<string, string[]>
  ): string {
    const allowedAttrs = allowedAttributes[tagName] || [];
    
    if (allowedAttrs.length === 0) {
      return '';
    }

    const attrRegex = /(\w+)\s*=\s*["']([^"']*)["']/gi;
    const sanitizedAttrs: string[] = [];
    
    let match;
    while ((match = attrRegex.exec(attributes)) !== null) {
      const [, name, value] = match;
      const attrName = name.toLowerCase();
      
      if (allowedAttrs.includes(attrName)) {
        const sanitizedValue = this.sanitizeAttributeValue(attrName, value);
        if (sanitizedValue) {
          sanitizedAttrs.push(`${attrName}="${sanitizedValue}"`);
        }
      }
    }

    return sanitizedAttrs.length > 0 ? ' ' + sanitizedAttrs.join(' ') : '';
  }

  private sanitizeAttributeValue(attributeName: string, value: string): string {
    // Remover caracteres perigosos
    let sanitized = value.replace(/[<>"'`]/g, '');
    
    // Validações específicas por atributo
    switch (attributeName) {
      case 'href':
        // Apenas URLs seguras
        if (!/^(https?:\/\/|mailto:|tel:|#)/.test(sanitized)) {
          return '';
        }
        break;
      case 'src':
        // Apenas URLs de imagem seguras
        if (!/^(https?:\/\/|data:image\/)/.test(sanitized)) {
          return '';
        }
        break;
      case 'class':
        // Apenas classes alfanuméricas
        sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-_]/g, '');
        break;
    }

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

  // Detectar tentativas de XSS
  detectXSS(input: string): boolean {
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /expression\s*\(/i,
      /url\s*\(/i,
      /@import/i,
      /data:text\/html/i
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  // Detectar injeção SQL
  detectSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\bunion\b)/i,
      /(\bor\b|\band\b)\s+\w+\s*=\s*\w+/i,
      /['";][\s]*(\bor\b|\band\b|\bunion\b)/i,
      /\b(exec|execute|sp_|xp_)\b/i,
      /(\bselect\b.*\bfrom\b|\binsert\b.*\binto\b)/i
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }
}

export const sanitizer = new AdvancedSanitizer();

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

// Importar audit logger
import { auditSecurityEvent } from './auditLogging';
