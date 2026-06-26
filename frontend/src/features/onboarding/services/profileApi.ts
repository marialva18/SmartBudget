import { apiRequest } from '../../../lib/api';
import type {
  OnboardingObjective,
  PreferencesFormValues,
} from '../schemas/onboardingSchemas';

export type Profile = {
  displayName: string;
  preferredCurrency: 'PEN' | 'USD';
  timezone: string;
  theme: 'LIGHT' | 'DARK' | 'SYSTEM';
  onboardingCompleted: boolean;
  objectives: OnboardingObjective[];
};

export function getProfile() {
  return apiRequest<Profile>('/profile');
}

export function updatePreferences(values: PreferencesFormValues) {
  return apiRequest<Pick<
    Profile,
    'preferredCurrency' | 'timezone' | 'theme' | 'onboardingCompleted'
  >>('/profile', {
    method: 'PATCH',
    body: values,
  });
}

export function updateObjectives(objectives: OnboardingObjective[]) {
  return apiRequest<{ objectives: OnboardingObjective[] }>(
    '/profile/objectives',
    {
      method: 'POST',
      body: { objectives },
    },
  );
}

export function completeOnboarding() {
  return apiRequest<{ onboardingCompleted: boolean }>(
    '/profile/complete-onboarding',
    {
      method: 'POST',
    },
  );
}
