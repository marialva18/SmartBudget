import { apiRequest } from '../../lib/api';
import type {
  GroupFormValues,
  GroupExpenseFormValues,
  GroupInvitationFormValues,
} from './groupSchema';

export type GroupMemberSummary = {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  status: 'INVITED' | 'ACTIVE' | 'LEFT' | 'REMOVED';
};

export type GroupMember = GroupMemberSummary & {
  joinedAt: string;
  leftAt: string | null;
};

export type GroupExpense = {
  id: string;
  groupId: string;
  description: string;
  amount: string;
  currency: 'PEN' | 'USD';
  occurredAt: string;
  createdAt: string;
  paidByMember: GroupMemberSummary;
  splits: Array<{
    id: string;
    amount: string;
    member: GroupMemberSummary;
  }>;
};

export type GroupBalance = {
  member: GroupMemberSummary;
  currency: 'PEN' | 'USD';
  paidAmount: string;
  owedAmount: string;
  netAmount: string;
};

export type FinancialGroup = {
  id: string;
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'ARCHIVED';
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  currentMemberRole: GroupMember['role'] | null;
  currentMemberStatus: GroupMember['status'] | null;
  canInvite: boolean;
  canArchive: boolean;
  notificationEmailSent?: boolean;
  balances: GroupBalance[];
  recentExpenses: GroupExpense[];
  members: GroupMember[];
};

export function getGroups() {
  return apiRequest<FinancialGroup[]>('/groups');
}

export function createGroup(values: GroupFormValues) {
  return apiRequest<FinancialGroup>('/groups', {
    method: 'POST',
    body: normalizeGroup(values),
  });
}

export function inviteGroupMember(
  groupId: string,
  values: GroupInvitationFormValues,
) {
  return apiRequest<FinancialGroup>(`/groups/${groupId}/invitations`, {
    method: 'POST',
    body: values,
  });
}

export function acceptGroupInvitation(groupId: string) {
  return apiRequest<FinancialGroup>(`/groups/${groupId}/accept`, {
    method: 'PATCH',
  });
}

export function declineGroupInvitation(groupId: string) {
  return apiRequest<{ message: string }>(`/groups/${groupId}/decline`, {
    method: 'PATCH',
  });
}

export function archiveGroup(groupId: string) {
  return apiRequest<FinancialGroup>(`/groups/${groupId}/archive`, {
    method: 'PATCH',
  });
}

export function getGroupExpenses(groupId: string) {
  return apiRequest<GroupExpense[]>(`/groups/${groupId}/expenses`);
}

export function createGroupExpense(
  groupId: string,
  values: GroupExpenseFormValues,
) {
  return apiRequest<GroupExpense>(`/groups/${groupId}/expenses`, {
    method: 'POST',
    body: normalizeExpense(values),
  });
}

function normalizeGroup(values: GroupFormValues) {
  return {
    ...values,
    description: values.description || undefined,
  };
}

function normalizeExpense(values: GroupExpenseFormValues) {
  return {
    ...values,
    occurredAt: values.occurredAt || undefined,
  };
}
