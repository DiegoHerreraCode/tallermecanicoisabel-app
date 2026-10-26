import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { RepuestoItem, CreateUpdateRepuestoPayload } from '../interfaces/repuesto.interface';

export const createUpdateRepuestoAction = async (
  payload: CreateUpdateRepuestoPayload,
  id?: string | number
): Promise<RepuestoItem> => {
  const isCreating = !id || id === 'new';
  const url = isCreating ? '/repuestos' : `/repuestos/${id}`;
  const method = isCreating ? 'POST' : 'PUT';

  const { data } = await apiClient.request<ApiResponse<RepuestoItem>>({
    url,
    method,
    data: payload,
  });

  return data.data;
};
