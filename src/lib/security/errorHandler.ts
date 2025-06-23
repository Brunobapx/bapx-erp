
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
  
  static logSecureError(error: any, context: string, userId?: string) {
    const sanitizedError = {
      message: this.sanitizeErrorMessage(error),
      context,
      userId: userId || 'anonymous',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[SecureErrorHandler]', sanitizedError);
    }
    
    // In production, you would send this to your logging service
    // logToExternalService(sanitizedError);
  }
  
  static handleApiError(error: any, context: string = 'API'): never {
    this.logSecureError(error, context);
    throw new Error(this.sanitizeErrorMessage(error));
  }
}
