
import { v4 as uuidv4 } from 'uuid';

interface CSRFTokenStore {
  [sessionId: string]: {
    token: string;
    createdAt: number;
    used: boolean;
  };
}

class CSRFProtection {
  private tokenStore: CSRFTokenStore = {};
  private tokenLifetime: number = 60 * 60 * 1000; // 1 hora

  generateToken(sessionId: string): string {
    const token = uuidv4();
    this.tokenStore[sessionId] = {
      token,
      createdAt: Date.now(),
      used: false
    };
    
    // Limpar tokens expirados
    this.cleanupExpiredTokens();
    
    return token;
  }

  validateToken(sessionId: string, token: string, oneTimeUse: boolean = true): boolean {
    const record = this.tokenStore[sessionId];
    
    if (!record) {
      console.warn('CSRF: Token não encontrado para sessão', sessionId);
      return false;
    }

    const isExpired = Date.now() - record.createdAt > this.tokenLifetime;
    if (isExpired) {
      console.warn('CSRF: Token expirado para sessão', sessionId);
      delete this.tokenStore[sessionId];
      return false;
    }

    if (record.used && oneTimeUse) {
      console.warn('CSRF: Token já foi usado para sessão', sessionId);
      return false;
    }

    if (record.token !== token) {
      console.warn('CSRF: Token inválido para sessão', sessionId);
      return false;
    }

    if (oneTimeUse) {
      record.used = true;
    }

    return true;
  }

  private cleanupExpiredTokens(): void {
    const now = Date.now();
    Object.keys(this.tokenStore).forEach(sessionId => {
      if (now - this.tokenStore[sessionId].createdAt > this.tokenLifetime) {
        delete this.tokenStore[sessionId];
      }
    });
  }

  invalidateSession(sessionId: string): void {
    delete this.tokenStore[sessionId];
  }
}

export const csrfProtection = new CSRFProtection();

// Hook para usar proteção CSRF
export const useCSRFProtection = () => {
  const getToken = (sessionId: string): string => {
    return csrfProtection.generateToken(sessionId);
  };

  const validateToken = (sessionId: string, token: string): boolean => {
    return csrfProtection.validateToken(sessionId, token);
  };

  return { getToken, validateToken };
};
