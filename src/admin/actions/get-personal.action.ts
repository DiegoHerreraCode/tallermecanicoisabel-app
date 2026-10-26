import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { PersonalItem } from '../interfaces/personal.interface';

export const getPersonalAction = async (): Promise<PersonalItem[]> => {
  const { data } = await apiClient.get<ApiResponse<PersonalItem[]>>('/personal');
  return data.data || [];
};
