import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { OrdenItem, AnularOrdenPayload } from '../interfaces/orden.interface';

export const anularOrdenAction = async (
  id: number | string,
  payload: AnularOrdenPayload
): Promise<OrdenItem> => {
  const { data } = await apiClient.post<ApiResponse<OrdenItem> | OrdenItem>(
    `/ordenes/${id}/anular`,
    payload
  );
  return 'data' in data ? data.data : data;
};
