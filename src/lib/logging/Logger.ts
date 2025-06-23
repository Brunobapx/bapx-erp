
export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: string;
  data?: Record<string, any>;
  timestamp: string;
  userId?: string;
  sessionId?: string;
}

export class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private createLogEntry(
    level: LogEntry['level'],
    message: string,
    context?: string,
    data?: Record<string, any>,
    userId?: string
  ): LogEntry {
    return {
      level,
      message,
      context,
      data,
      timestamp: new Date().toISOString(),
      userId,
      sessionId: this.getSessionId(),
    };
  }

  private getSessionId(): string {
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('app_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('app_session_id', sessionId);
      }
      return sessionId;
    }
    return 'server_session';
  }

  debug(message: string, context?: string, data?: Record<string, any>, userId?: string): void {
    const entry = this.createLogEntry('debug', message, context, data, userId);
    this.addLog(entry);
    
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG][${context || 'APP'}]`, message, data);
    }
  }

  info(message: string, context?: string, data?: Record<string, any>, userId?: string): void {
    const entry = this.createLogEntry('info', message, context, data, userId);
    this.addLog(entry);
    
    console.info(`[INFO][${context || 'APP'}]`, message, data);
  }

  warn(message: string, context?: string, data?: Record<string, any>, userId?: string): void {
    const entry = this.createLogEntry('warn', message, context, data, userId);
    this.addLog(entry);
    
    console.warn(`[WARN][${context || 'APP'}]`, message, data);
  }

  error(message: string, context?: string, data?: Record<string, any>, userId?: string): void {
    const entry = this.createLogEntry('error', message, context, data, userId);
    this.addLog(entry);
    
    console.error(`[ERROR][${context || 'APP'}]`, message, data);
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);
    
    // Manter apenas os logs mais recentes
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  getLogs(filter?: Partial<Pick<LogEntry, 'level' | 'context' | 'userId'>>): LogEntry[] {
    if (!filter) return [...this.logs];
    
    return this.logs.filter(log => {
      if (filter.level && log.level !== filter.level) return false;
      if (filter.context && log.context !== filter.context) return false;
      if (filter.userId && log.userId !== filter.userId) return false;
      return true;
    });
  }

  clearLogs(): void {
    this.logs = [];
  }
}

export const logger = Logger.getInstance();
