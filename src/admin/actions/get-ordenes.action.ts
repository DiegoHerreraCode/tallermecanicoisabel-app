import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { OrdenItem } from '../interfaces/orden.interface';

export const getOrdenesAction = async (): Promise<OrdenItem[]> => {
  const { data } = await apiClient.get<ApiResponse<OrdenItem[]>>('/ordenes');
  return data.data || [];
};
