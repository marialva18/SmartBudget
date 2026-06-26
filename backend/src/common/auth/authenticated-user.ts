export type AuthenticatedUser = {
  userId: string;
  email: string;
  sessionId: string;
  platform: 'WEB' | 'MOBILE';
};
