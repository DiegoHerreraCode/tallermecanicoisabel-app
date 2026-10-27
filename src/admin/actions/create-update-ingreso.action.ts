import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { IngresoItem, CreateIngresoPayload } from '../interfaces/ingreso.interface';

export interface UpdateIngresoPayload {
  id_tipo_orden?: number;
  id_vehiculo?: number;
  observaciones_cliente?: string | null;
  estado?: string;
}

export type CreateUpdateIngresoPayload = CreateIngresoPayload | UpdateIngresoPayload;

export const createUpdateIngresoAction = async (
  payload: CreateUpdateIngresoPayload,
  id?: number | string
): Promise<IngresoItem> => {
  const isUpdating = !!id && id !== 'new';

  if (isUpdating) {
    const { data } = await apiClient.put<ApiResponse<IngresoItem> | IngresoItem>(
      `/ingresos/${id}`,
      payload
    );
    return 'data' in data ? data.data : data;
  } else {
    const { data } = await apiClient.post<ApiResponse<IngresoItem> | IngresoItem>(
      '/ingresos',
      payload
    );
    return 'data' in data ? data.data : data;
  }
};
