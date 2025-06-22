
import { HTML_ENTITIES, ALLOWED_TAGS, ALLOWED_ATTRIBUTES } from './constants';
import { SanitizationOptions } from './types';

export class HtmlSanitizer {
  // Sanitização para HTML com whitelist
  sanitizeHtml(input: string, options: SanitizationOptions = {}): string {
    if (typeof input !== 'string') {
      return '';
    }

    const {
      allowHtml = false,
      allowedTags = ALLOWED_TAGS,
      allowedAttributes = ALLOWED_ATTRIBUTES,
      maxLength = 5000,
      preserveFormatting = false
    } = options;

    let sanitized = input.substring(0, maxLength);

    if (!allowHtml) {
      return this.sanitizeTextOnly(sanitized, maxLength);
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

  private sanitizeTextOnly(input: string, maxLength: number): string {
    return input
      .trim()
      .substring(0, maxLength)
      .replace(/[&<>"'`=\/]/g, char => HTML_ENTITIES[char] || char)
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
      .replace(/\s+/g, ' ');
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
}
