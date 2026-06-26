import { apiRequest } from '../../lib/api';
import type {
  GoalFormValues,
  GoalReservationFormValues,
} from './goalSchema';

export type GoalReservation = {
  id: string;
  account: {
    id: string;
    name: string;
    currency: 'PEN' | 'USD';
  };
  amount: string;
  status: 'ACTIVE' | 'INSUFFICIENT' | 'REVERSED';
  source: string;
  note: string | null;
  reservedAt: string;
  reversedAt: string | null;
};

export type Goal = {
  id: string;
  name: string;
  targetAmount: string;
  reservedAmount: string;
  remainingAmount: string;
  progressPercent: string;
  currency: 'PEN' | 'USD';
  targetDate: string | null;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  completedAt: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  reservations: GoalReservation[];
};

export function getGoals(filters: {
  currency?: 'PEN' | 'USD';
  status?: Goal['status'];
}) {
  const params = new URLSearchParams();
  if (filters.currency) params.set('currency', filters.currency);
  if (filters.status) params.set('status', filters.status);
  const query = params.toString();
  return apiRequest<Goal[]>(`/goals${query ? `?${query}` : ''}`);
}

export function createGoal(values: GoalFormValues) {
  return apiRequest<Goal>('/goals', {
    method: 'POST',
    body: normalizeGoal(values),
  });
}

export function updateGoal(goalId: string, values: GoalFormValues) {
  return apiRequest<Goal>(`/goals/${goalId}`, {
    method: 'PATCH',
    body: normalizeGoal(values),
  });
}

export function completeGoal(goalId: string) {
  return apiRequest<Goal>(`/goals/${goalId}/complete`, { method: 'PATCH' });
}

export function cancelGoal(goalId: string) {
  return apiRequest<Goal>(`/goals/${goalId}/cancel`, { method: 'PATCH' });
}

export function deleteGoal(goalId: string) {
  return apiRequest<{ message: string }>(`/goals/${goalId}`, {
    method: 'DELETE',
  });
}

export function reserveGoal(goalId: string, values: GoalReservationFormValues) {
  return apiRequest<Goal>(`/goals/${goalId}/reservations`, {
    method: 'POST',
    body: values,
  });
}

export function reverseGoalReservation(goalId: string, reservationId: string) {
  return apiRequest<Goal>(
    `/goals/${goalId}/reservations/${reservationId}/reverse`,
    { method: 'PATCH' },
  );
}

function normalizeGoal(values: GoalFormValues) {
  return {
    ...values,
    targetDate: values.targetDate || undefined,
  };
}
