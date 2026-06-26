import { apiRequest } from '../../lib/api';
import type { CategoryFormValues } from './categorySchema';

export type Category = {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  icon: string | null;
  isSystem: boolean;
  status: 'ACTIVE' | 'ARCHIVED';
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export function getCategories(
  type?: Category['type'],
  status: Category['status'] | 'ALL' = 'ACTIVE',
) {
  const params = new URLSearchParams({ status });
  if (type) params.set('type', type);
  return apiRequest<Category[]>(`/categories?${params.toString()}`);
}

export function createCategory(values: CategoryFormValues) {
  return apiRequest<Category>('/categories', {
    method: 'POST',
    body: values,
  });
}

export function updateCategory(
  categoryId: string,
  values: CategoryFormValues,
) {
  const { name, icon } = values;
  return apiRequest<Category>(`/categories/${categoryId}`, {
    method: 'PATCH',
    body: { name, icon },
  });
}

export function archiveCategory(categoryId: string) {
  return apiRequest<Category>(`/categories/${categoryId}/archive`, {
    method: 'PATCH',
  });
}
