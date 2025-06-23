
import React, { useEffect, useState } from 'react';
import { AuthProvider } from './AuthProvider';
import { SessionManager } from '@/lib/security/sessionManager';
import { SessionTimeoutWarning } from '@/components/Security/SessionTimeoutWarning';
import { useAuth } from './AuthProvider';

const SessionWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (!user) return;

    const handleSessionTimeout = () => {
      signOut();
    };

    const handleSessionWarning = () => {
      setShowTimeoutWarning(true);
      setTimeRemaining(300); // 5 minutes warning
    };

    SessionManager.startSession(handleSessionTimeout, handleSessionWarning);

    // Update activity on user interactions
    const updateActivity = () => {
      SessionManager.updateActivity();
      SessionManager.refreshSession(handleSessionTimeout, handleSessionWarning);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      SessionManager.clearSession();
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, [user, signOut]);

  const handleExtendSession = () => {
    setShowTimeoutWarning(false);
    SessionManager.refreshSession(
      () => signOut(),
      () => {
        setShowTimeoutWarning(true);
        setTimeRemaining(300);
      }
    );
  };

  const handleLogout = () => {
    setShowTimeoutWarning(false);
    signOut();
  };

  return (
    <>
      {children}
      <SessionTimeoutWarning
        isOpen={showTimeoutWarning}
        onExtendSession={handleExtendSession}
        onLogout={handleLogout}
        timeRemaining={timeRemaining}
      />
    </>
  );
};

export const EnhancedAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <SessionWrapper>
        {children}
      </SessionWrapper>
    </AuthProvider>
  );
};
