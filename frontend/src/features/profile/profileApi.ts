import { apiRequest } from '../../lib/api';
import type { OnboardingObjective } from '../onboarding/schemas/onboardingSchemas';
import type { ProfileFormValues } from './profileSchema';

export type HighExpenseWarningPercent = 30 | 50 | 70;

export type Profile = {
  displayName: string;
  preferredCurrency: 'PEN' | 'USD';
  timezone: string;
  theme: 'LIGHT' | 'DARK' | 'SYSTEM';
  aiEnabled: boolean;
  highExpenseWarningPercent: HighExpenseWarningPercent;
  maxExpenseAmountPen: number | null;
  maxExpenseAmountUsd: number | null;
  onboardingCompleted: boolean;
  objectives: OnboardingObjective[];
};

export function getProfile() {
  return apiRequest<Profile>('/profile');
}

export function updateProfile(values: ProfileFormValues) {
  return apiRequest<Omit<Profile, 'objectives'>>('/profile', {
    method: 'PATCH',
    body: values,
  });
}

export function updateProfileObjectives(objectives: OnboardingObjective[]) {
  return apiRequest<{ objectives: OnboardingObjective[] }>(
    '/profile/objectives',
    {
      method: 'POST',
      body: { objectives },
    },
  );
}
