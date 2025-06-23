
import { ErrorHandler, StandardizedError, ERROR_CODES } from '@/lib/errors/ErrorHandler';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = ErrorHandler.getInstance();
    errorHandler.clearErrors();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = ErrorHandler.getInstance();
      const instance2 = ErrorHandler.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('StandardizedError', () => {
    it('should create standardized error with all properties', () => {
      const error = new StandardizedError(
        ERROR_CODES.VALIDATION_REQUIRED_FIELD,
        'Field is required',
        'TEST_CONTEXT',
        { field: 'name' },
        'user-123'
      );

      expect(error.code).toBe(ERROR_CODES.VALIDATION_REQUIRED_FIELD);
      expect(error.message).toBe('Field is required');
      expect(error.context).toBe('TEST_CONTEXT');
      expect(error.data).toEqual({ field: 'name' });
      expect(error.userId).toBe('user-123');
      expect(error.timestamp).toBeDefined();
    });
  });

  describe('handle', () => {
    it('should handle StandardizedError', () => {
      const originalError = new StandardizedError(
        ERROR_CODES.VALIDATION_REQUIRED_FIELD,
        'Name is required'
      );

      const appError = errorHandler.handle(originalError);

      expect(appError.code).toBe(ERROR_CODES.VALIDATION_REQUIRED_FIELD);
      expect(appError.message).toBe('Name is required');
      expect(appError.originalError).toBe(originalError);
    });

    it('should handle regular Error', () => {
      const originalError = new Error('Something went wrong');
      
      const appError = errorHandler.handle(originalError, 'TEST_CONTEXT', 'user-123');

      expect(appError.code).toBe('UNKNOWN_ERROR');
      expect(appError.message).toBe('Something went wrong');
      expect(appError.context).toBe('TEST_CONTEXT');
      expect(appError.userId).toBe('user-123');
      expect(appError.originalError).toBe(originalError);
    });

    it('should handle unknown error types', () => {
      const appError = errorHandler.handle('string error');

      expect(appError.code).toBe('UNKNOWN_ERROR');
      expect(appError.message).toBe('Erro desconhecido');
    });
  });

  describe('filtering', () => {
    beforeEach(() => {
      errorHandler.handle(
        new StandardizedError(ERROR_CODES.VALIDATION_REQUIRED_FIELD, 'Error 1'),
        'CONTEXT_A',
        'user-1'
      );
      errorHandler.handle(
        new StandardizedError(ERROR_CODES.API_NETWORK_ERROR, 'Error 2'),
        'CONTEXT_B',
        'user-2'
      );
      errorHandler.handle(
        new StandardizedError(ERROR_CODES.VALIDATION_REQUIRED_FIELD, 'Error 3'),
        'CONTEXT_A',
        'user-1'
      );
    });

    it('should filter errors by code', () => {
      const validationErrors = errorHandler.getErrors({ 
        code: ERROR_CODES.VALIDATION_REQUIRED_FIELD 
      });
      expect(validationErrors).toHaveLength(2);
    });

    it('should filter errors by context', () => {
      const contextAErrors = errorHandler.getErrors({ context: 'CONTEXT_A' });
      expect(contextAErrors).toHaveLength(2);
    });

    it('should filter errors by userId', () => {
      const user1Errors = errorHandler.getErrors({ userId: 'user-1' });
      expect(user1Errors).toHaveLength(2);
    });
  });
});
