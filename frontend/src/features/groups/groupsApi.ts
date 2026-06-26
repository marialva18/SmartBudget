import { apiRequest } from '../../lib/api';
import type {
  GroupFormValues,
  GroupInvitationFormValues,
} from './groupSchema';

export type GroupMember = {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  status: 'INVITED' | 'ACTIVE' | 'LEFT' | 'REMOVED';
  joinedAt: string;
  leftAt: string | null;
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

function normalizeGroup(values: GroupFormValues) {
  return {
    ...values,
    description: values.description || undefined,
  };
}
