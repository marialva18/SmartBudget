import { apiRequest } from '../../lib/api';

export type CoachProvider = 'GEMINI' | 'LOCAL';

export type CoachUsage = {
  enabled: boolean;
  limit: number;
  used: number;
  remaining: number;
};

export type CoachMessageResponse = {
  answer: string;
  provider: CoachProvider;
  usage: CoachUsage;
  generatedAt: string;
};

export function getCoachUsage() {
  return apiRequest<CoachUsage>('/coach/usage');
}

export function sendCoachMessage(message: string) {
  return apiRequest<CoachMessageResponse>('/coach/message', {
    method: 'POST',
    body: {
      message,
    },
  });
}