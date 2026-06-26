export type Session = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    onboardingCompleted: boolean;
  };
};

let currentSession: Session | null = null;

export function setAuthSession(session: Session) {
  currentSession = session;
}

export function getAuthSession() {
  return currentSession;
}

export function clearAuthSession() {
  currentSession = null;
}
