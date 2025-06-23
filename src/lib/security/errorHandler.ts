
import { logger } from '@/lib/logging/Logger';
import { ErrorHandler, StandardizedError, ERROR_CODES } from '@/lib/errors/ErrorHandler';

// Centralized and secure error handling
export class SecureErrorHandler {
  private static readonly SENSITIVE_PATTERNS = [
    /password/i,
    /token/i,
    /secret/i,
    /key/i,
    /auth/i,
  ];
  
  static sanitizeErrorMessage(error: any): string {
    let message = 'Erro interno do sistema';
    
    if (error?.message) {
      message = error.message;
      
      // Remove sensitive information from error messages
      this.SENSITIVE_PATTERNS.forEach(pattern => {
        if (pattern.test(message)) {
          message = 'Erro de autenticação ou autorização';
        }
      });
    }
    
    return message;
  }
  
  static logSecureError(error: any, context: string, userId?: string): void {
    const sanitizedMessage = this.sanitizeErrorMessage(error);
    
    logger.error(
      sanitizedMessage,
      context,
      {
        originalMessage: process.env.NODE_ENV === 'development' ? error?.message : undefined,
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      },
      userId
    );
  }
  
  static handleApiError(error: any, context: string = 'API', userId?: string): never {
    this.logSecureError(error, context, userId);
    
    const errorCode = this.getErrorCode(error);
    const sanitizedMessage = this.sanitizeErrorMessage(error);
    
    const standardizedError = new StandardizedError(
      errorCode,
      sanitizedMessage,
      context,
      undefined,
      userId
    );
    
    throw standardizedError;
  }
  
  private static getErrorCode(error: any): string {
    if (error?.code) return error.code;
    
    // Map common error patterns to standardized codes
    const message = error?.message?.toLowerCase() || '';
    
    if (message.includes('network') || message.includes('fetch')) {
      return ERROR_CODES.API_NETWORK_ERROR;
    }
    
    if (message.includes('timeout')) {
      return ERROR_CODES.API_TIMEOUT;
    }
    
    if (message.includes('unauthorized') || message.includes('auth')) {
      return ERROR_CODES.AUTH_UNAUTHORIZED;
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return ERROR_CODES.VALIDATION_INVALID_FORMAT;
    }
    
    return 'UNKNOWN_ERROR';
  }
}
