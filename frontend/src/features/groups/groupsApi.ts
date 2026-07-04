import { apiRequest } from '../../lib/api';
import type {
  GroupFormValues,
  GroupExpenseFormValues,
  GroupInvitationFormValues,
  GroupSettlementFormValues,
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
  settledOutAmount: string;
  settledInAmount: string;
  netAmount: string;
};

export type GroupSettlement = {
  id: string;
  groupId: string;
  amount: string;
  currency: 'PEN' | 'USD';
  note: string | null;
  settledAt: string;
  createdAt: string;
  fromMember: GroupMemberSummary;
  toMember: GroupMemberSummary;
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
  recentSettlements: GroupSettlement[];
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

export function createGroupSettlement(
  groupId: string,
  values: GroupSettlementFormValues,
) {
  return apiRequest<GroupSettlement>(`/groups/${groupId}/settlements`, {
    method: 'POST',
    body: normalizeSettlement(values),
  });
}

function normalizeGroup(values: GroupFormValues) {
  return {
    ...values,
    description: values.description || undefined,
  };
}

function normalizeExpense(values: GroupExpenseFormValues) {
  const splits = values.splits
    .filter((split) =>
      values.splitMode === 'CUSTOM_AMOUNTS'
        ? Number(split.amount ?? 0) > 0
        : Number(split.percentage ?? 0) > 0,
    )
    .map((split) => ({
      memberId: split.memberId,
      amount:
        values.splitMode === 'CUSTOM_AMOUNTS' ? split.amount : undefined,
      percentage:
        values.splitMode === 'PERCENTAGES' ? split.percentage : undefined,
    }));

  return {
    ...values,
    splits: values.splitMode === 'EQUAL' ? undefined : splits,
    occurredAt: values.occurredAt || undefined,
  };
}

function normalizeSettlement(values: GroupSettlementFormValues) {
  return {
    ...values,
    note: values.note || undefined,
    settledAt: values.settledAt || undefined,
  };
}
