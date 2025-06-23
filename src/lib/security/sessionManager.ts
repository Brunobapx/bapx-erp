
// Session security management
export class SessionManager {
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private static readonly WARNING_TIME = 5 * 60 * 1000; // 5 minutes before timeout
  private static timeoutId: NodeJS.Timeout | null = null;
  private static warningId: NodeJS.Timeout | null = null;
  
  static startSession(onTimeout: () => void, onWarning: () => void) {
    this.clearTimers();
    
    // Set warning timer
    this.warningId = setTimeout(() => {
      onWarning();
    }, this.SESSION_TIMEOUT - this.WARNING_TIME);
    
    // Set timeout timer
    this.timeoutId = setTimeout(() => {
      onTimeout();
    }, this.SESSION_TIMEOUT);
  }
  
  static refreshSession(onTimeout: () => void, onWarning: () => void) {
    this.startSession(onTimeout, onWarning);
  }
  
  static clearSession() {
    this.clearTimers();
  }
  
  private static clearTimers() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    if (this.warningId) {
      clearTimeout(this.warningId);
      this.warningId = null;
    }
  }
  
  // Check if session is still valid
  static isSessionValid(): boolean {
    const lastActivity = localStorage.getItem('lastActivity');
    if (!lastActivity) return false;
    
    const timeSinceActivity = Date.now() - parseInt(lastActivity);
    return timeSinceActivity < this.SESSION_TIMEOUT;
  }
  
  // Update last activity timestamp
  static updateActivity() {
    localStorage.setItem('lastActivity', Date.now().toString());
  }
}
