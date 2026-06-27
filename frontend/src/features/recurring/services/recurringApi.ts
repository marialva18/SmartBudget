import { apiRequest } from '../../../lib/api';
import type { RecurringScheduleFormValues } from '../schemas/recurringSchemas';

export type RecurringSchedule = {
  id: string;
  operationType: 'INCOME' | 'EXPENSE';
  amount: string;
  currency: 'PEN' | 'USD';
  description: string | null;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  intervalCount: number;
  startsOn: string;
  endsOn: string | null;
  nextDueOn: string;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  account: {
    id: string;
    name: string;
    currency: 'PEN' | 'USD';
  };
  category: {
    id: string;
    name: string;
    icon: string | null;
    type: 'INCOME' | 'EXPENSE';
  } | null;
};

export type RecurringDueOccurrence = {
  id: string;
  scheduleId: string;
  scheduledFor: string;
  status: 'PENDING' | 'CONFIRMED' | 'SKIPPED';
  transactionId: string | null;
  reviewedAt: string | null;
  schedule: RecurringSchedule;
};
export function getRecurringSchedules(params?: {
  status?: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
  operationType?: 'INCOME' | 'EXPENSE';
}) {
  const search = new URLSearchParams();

  if (params?.status) {
    search.set('status', params.status);
  }

  if (params?.operationType) {
    search.set('operationType', params.operationType);
  }

  const query = search.toString();

  return apiRequest<RecurringSchedule[]>(
    query ? `/recurring?${query}` : '/recurring',
  );
}

export function getRecurringDueOccurrences() {
  return apiRequest<RecurringDueOccurrence[]>('/recurring/due');
}

export function confirmRecurringDue(scheduleId: string) {
  return apiRequest<RecurringSchedule>(`/recurring/${scheduleId}/confirm`, {
    method: 'PATCH',
  });
}

export function skipRecurringDue(scheduleId: string) {
  return apiRequest<RecurringSchedule>(`/recurring/${scheduleId}/skip`, {
    method: 'PATCH',
  });
}

export function createRecurringSchedule(values: RecurringScheduleFormValues) {
  return apiRequest<RecurringSchedule>('/recurring', {
    method: 'POST',
    body: {
      ...values,
      description: values.description?.trim() || undefined,
      endsOn: values.endsOn || undefined,
    },
  });
}

export function pauseRecurringSchedule(scheduleId: string) {
  return apiRequest<RecurringSchedule>(`/recurring/${scheduleId}/pause`, {
    method: 'PATCH',
  });
}

export function resumeRecurringSchedule(scheduleId: string) {
  return apiRequest<RecurringSchedule>(`/recurring/${scheduleId}/resume`, {
    method: 'PATCH',
  });
}

export function cancelRecurringSchedule(scheduleId: string) {
  return apiRequest<RecurringSchedule>(`/recurring/${scheduleId}/cancel`, {
    method: 'PATCH',
  });
}