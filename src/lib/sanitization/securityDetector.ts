
export class SecurityDetector {
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
