
interface CSPDirectives {
  'default-src'?: string[];
  'script-src'?: string[];
  'style-src'?: string[];
  'img-src'?: string[];
  'connect-src'?: string[];
  'font-src'?: string[];
  'object-src'?: string[];
  'media-src'?: string[];
  'frame-src'?: string[];
  'base-uri'?: string[];
  'form-action'?: string[];
  'frame-ancestors'?: string[];
  'upgrade-insecure-requests'?: boolean;
  'block-all-mixed-content'?: boolean;
}

class ContentSecurityPolicy {
  private directives: CSPDirectives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Necessário para React em desenvolvimento
      "'unsafe-eval'", // Necessário para desenvolvimento
      'https://cdn.jsdelivr.net',
      'https://unpkg.com'
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Necessário para Tailwind e componentes
      'https://fonts.googleapis.com'
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:',
      'http:'
    ],
    'connect-src': [
      "'self'",
      'https://*.supabase.co',
      'wss://*.supabase.co'
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
      'data:'
    ],
    'object-src': ["'none'"],
    'media-src': ["'self'"],
    'frame-src': [
      "'self'",
      'https://www.youtube.com',
      'https://player.vimeo.com'
    ],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': true,
    'block-all-mixed-content': true
  };

  generateCSPHeader(): string {
    const cspParts: string[] = [];

    Object.entries(this.directives).forEach(([directive, value]) => {
      if (directive === 'upgrade-insecure-requests' && value === true) {
        cspParts.push('upgrade-insecure-requests');
      } else if (directive === 'block-all-mixed-content' && value === true) {
        cspParts.push('block-all-mixed-content');
      } else if (Array.isArray(value) && value.length > 0) {
        cspParts.push(`${directive} ${value.join(' ')}`);
      }
    });

    return cspParts.join('; ');
  }

  addSource(directive: keyof CSPDirectives, source: string): void {
    if (Array.isArray(this.directives[directive])) {
      const sources = this.directives[directive] as string[];
      if (!sources.includes(source)) {
        sources.push(source);
      }
    }
  }

  removeSource(directive: keyof CSPDirectives, source: string): void {
    if (Array.isArray(this.directives[directive])) {
      const sources = this.directives[directive] as string[];
      const index = sources.indexOf(source);
      if (index > -1) {
        sources.splice(index, 1);
      }
    }
  }

  setDevelopmentMode(isDevelopment: boolean): void {
    if (isDevelopment) {
      // Configurações mais permissivas para desenvolvimento
      this.addSource('script-src', "'unsafe-inline'");
      this.addSource('script-src', "'unsafe-eval'");
      this.addSource('connect-src', 'http://localhost:*');
      this.addSource('connect-src', 'ws://localhost:*');
    } else {
      // Configurações mais restritivas para produção
      this.removeSource('script-src', "'unsafe-inline'");
      this.removeSource('script-src', "'unsafe-eval'");
      this.removeSource('connect-src', 'http://localhost:*');
      this.removeSource('connect-src', 'ws://localhost:*');
    }
  }

  applyToDocument(): void {
    // Aplicar CSP via meta tag
    const cspHeader = this.generateCSPHeader();
    
    // Remover meta tag existente se houver
    const existingMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (existingMeta) {
      existingMeta.remove();
    }

    // Adicionar nova meta tag
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = cspHeader;
    document.head.appendChild(meta);

    console.log('[CSP] Content Security Policy aplicada:', cspHeader);
  }

  reportViolations(): void {
    // Escutar violações de CSP
    document.addEventListener('securitypolicyviolation', (event) => {
      console.warn('[CSP] Violação detectada:', {
        directive: event.violatedDirective,
        blockedURI: event.blockedURI,
        sourceFile: event.sourceFile,
        lineNumber: event.lineNumber
      });

      // Enviar para audit log
      auditSecurityEvent(
        'csp_violation',
        {
          directive: event.violatedDirective,
          blockedURI: event.blockedURI,
          sourceFile: event.sourceFile,
          lineNumber: event.lineNumber
        },
        undefined,
        navigator.userAgent,
        false,
        `CSP violation: ${event.violatedDirective}`
      );
    });
  }
}

export const csp = new ContentSecurityPolicy();

// Inicializar CSP baseado no ambiente
export const initializeCSP = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  csp.setDevelopmentMode(isDevelopment);
  csp.applyToDocument();
  csp.reportViolations();
};

// Importar audit logger
import { auditSecurityEvent } from './auditLogging';
