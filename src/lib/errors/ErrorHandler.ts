
import { logger } from '@/lib/logging/Logger';

export interface AppError {
  code: string;
  message: string;
  context?: string;
  originalError?: Error;
  data?: Record<string, any>;
  timestamp: string;
  userId?: string;
}

export class StandardizedError extends Error {
  public readonly code: string;
  public readonly context?: string;
  public readonly data?: Record<string, any>;
  public readonly timestamp: string;
  public readonly userId?: string;

  constructor(
    code: string,
    message: string,
    context?: string,
    data?: Record<string, any>,
    userId?: string
  ) {
    super(message);
    this.name = 'StandardizedError';
    this.code = code;
    this.context = context;
    this.data = data;
    this.timestamp = new Date().toISOString();
    this.userId = userId;
  }
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errors: AppError[] = [];
  private maxErrors = 500;

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  handle(
    error: Error | StandardizedError | any,
    context?: string,
    userId?: string,
    data?: Record<string, any>
  ): AppError {
    const appError: AppError = {
      code: error instanceof StandardizedError ? error.code : 'UNKNOWN_ERROR',
      message: error?.message || 'Erro desconhecido',
      context: context || (error instanceof StandardizedError ? error.context : undefined),
      originalError: error instanceof Error ? error : undefined,
      data: data || (error instanceof StandardizedError ? error.data : undefined),
      timestamp: new Date().toISOString(),
      userId: userId || (error instanceof StandardizedError ? error.userId : undefined),
    };

    this.addError(appError);
    this.logError(appError);

    return appError;
  }

  private addError(error: AppError): void {
    this.errors.push(error);
    
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }
  }

  private logError(error: AppError): void {
    logger.error(
      error.message,
      error.context,
      {
        code: error.code,
        data: error.data,
        stack: error.originalError?.stack,
      },
      error.userId
    );
  }

  getErrors(filter?: Partial<Pick<AppError, 'code' | 'context' | 'userId'>>): AppError[] {
    if (!filter) return [...this.errors];
    
    return this.errors.filter(error => {
      if (filter.code && error.code !== filter.code) return false;
      if (filter.context && error.context !== filter.context) return false;
      if (filter.userId && error.userId !== filter.userId) return false;
      return true;
    });
  }

  clearErrors(): void {
    this.errors = [];
  }
}

export const errorHandler = ErrorHandler.getInstance();

// Códigos de erro padronizados
export const ERROR_CODES = {
  // Autenticação
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  
  // Validação
  VALIDATION_REQUIRED_FIELD: 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
  VALIDATION_INVALID_LENGTH: 'VALIDATION_INVALID_LENGTH',
  
  // Database
  DB_CONNECTION_ERROR: 'DB_CONNECTION_ERROR',
  DB_QUERY_ERROR: 'DB_QUERY_ERROR',
  DB_CONSTRAINT_VIOLATION: 'DB_CONSTRAINT_VIOLATION',
  
  // API
  API_NETWORK_ERROR: 'API_NETWORK_ERROR',
  API_TIMEOUT: 'API_TIMEOUT',
  API_SERVER_ERROR: 'API_SERVER_ERROR',
  
  // Business Logic
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
} as const;
