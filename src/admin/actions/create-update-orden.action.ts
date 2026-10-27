import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type {
  OrdenItem,
  CreateOrdenPayload,
  UpdateOrdenPayload,
} from '../interfaces/orden.interface';

export type CreateUpdateOrdenPayload = CreateOrdenPayload | UpdateOrdenPayload;

export const createUpdateOrdenAction = async (
  payload: CreateUpdateOrdenPayload,
  id?: number | string
): Promise<OrdenItem> => {
  const isUpdating = !!id && id !== 'new';

  if (isUpdating) {
    const { data } = await apiClient.put<ApiResponse<OrdenItem> | OrdenItem>(
      `/ordenes/${id}`,
      payload
    );
    return 'data' in data ? data.data : data;
  } else {
    const { data } = await apiClient.post<ApiResponse<OrdenItem> | OrdenItem>(
      '/ordenes',
      payload
    );
    return 'data' in data ? data.data : data;
  }
};
