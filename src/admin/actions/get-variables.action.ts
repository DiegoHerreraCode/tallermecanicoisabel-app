import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { VariableItem } from '../interfaces/variable.interface';

export const getVariablesAction = async (): Promise<VariableItem[]> => {
  const { data } = await apiClient.get<ApiResponse<VariableItem[]>>('/variables');
  return data.data || [];
};
