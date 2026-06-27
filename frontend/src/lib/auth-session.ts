export type Session = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    onboardingCompleted: boolean;
  };
};

const LOGGED_OUT_KEY = 'smartbudget_logged_out';

let currentSession: Session | null = null;

export function setAuthSession(session: Session) {
  currentSession = session;
  sessionStorage.removeItem(LOGGED_OUT_KEY);
}

export function getAuthSession() {
  return currentSession;
}

export function clearAuthSession() {
  currentSession = null;
}

export function markLoggedOut() {
  currentSession = null;
  sessionStorage.setItem(LOGGED_OUT_KEY, 'true');
}

export function wasLoggedOut() {
  return sessionStorage.getItem(LOGGED_OUT_KEY) === 'true';
}