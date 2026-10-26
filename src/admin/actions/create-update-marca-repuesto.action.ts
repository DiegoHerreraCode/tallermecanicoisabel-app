import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { MarcaRepuestoItem } from '../interfaces/marca-repuesto.interface';

export interface CreateUpdateMarcaRepuestoPayload {
  nombre?: string;
}

export const createUpdateMarcaRepuestoAction = async (
  payload: CreateUpdateMarcaRepuestoPayload,
  id?: number | string
): Promise<MarcaRepuestoItem> => {
  const isUpdating = !!id && id !== 'new';

  if (isUpdating) {
    const { data } = await apiClient.put<ApiResponse<MarcaRepuestoItem> | MarcaRepuestoItem>(
      `/marcas-repuestos/${id}`,
      payload
    );
    return 'data' in data ? data.data : data;
  } else {
    const { data } = await apiClient.post<ApiResponse<MarcaRepuestoItem> | MarcaRepuestoItem>(
      '/marcas-repuestos',
      payload
    );
    return 'data' in data ? data.data : data;
  }
};
