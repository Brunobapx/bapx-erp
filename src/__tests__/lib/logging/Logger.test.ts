
import { Logger } from '@/lib/logging/Logger';

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = Logger.getInstance();
    logger.clearLogs();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = Logger.getInstance();
      const instance2 = Logger.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('logging methods', () => {
    it('should create debug log entry', () => {
      logger.debug('Test debug message', 'TEST_CONTEXT', { key: 'value' });
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('debug');
      expect(logs[0].message).toBe('Test debug message');
      expect(logs[0].context).toBe('TEST_CONTEXT');
      expect(logs[0].data).toEqual({ key: 'value' });
    });

    it('should create info log entry', () => {
      logger.info('Test info message', 'TEST_CONTEXT');
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('info');
      expect(logs[0].message).toBe('Test info message');
    });

    it('should create warn log entry', () => {
      logger.warn('Test warn message');
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('warn');
    });

    it('should create error log entry', () => {
      logger.error('Test error message');
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('error');
    });
  });

  describe('filtering', () => {
    beforeEach(() => {
      logger.debug('Debug message', 'CONTEXT_A');
      logger.info('Info message', 'CONTEXT_B');
      logger.warn('Warn message', 'CONTEXT_A');
      logger.error('Error message', 'CONTEXT_C');
    });

    it('should filter logs by level', () => {
      const errorLogs = logger.getLogs({ level: 'error' });
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].level).toBe('error');
    });

    it('should filter logs by context', () => {
      const contextALogs = logger.getLogs({ context: 'CONTEXT_A' });
      expect(contextALogs).toHaveLength(2);
      expect(contextALogs.every(log => log.context === 'CONTEXT_A')).toBe(true);
    });
  });

  describe('log management', () => {
    it('should clear all logs', () => {
      logger.info('Test message');
      expect(logger.getLogs()).toHaveLength(1);
      
      logger.clearLogs();
      expect(logger.getLogs()).toHaveLength(0);
    });
  });
});
