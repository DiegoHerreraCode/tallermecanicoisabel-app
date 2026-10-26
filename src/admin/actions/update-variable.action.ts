import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { VariableItem, UpdateVariablePayload } from '../interfaces/variable.interface';

export const updateVariableAction = async (payload: UpdateVariablePayload): Promise<VariableItem> => {
  const { id_variable, ...dataToUpdate } = payload;
  const { data } = await apiClient.put<ApiResponse<VariableItem>>(`/variables/${id_variable}`, dataToUpdate);
  return data.data;
};
