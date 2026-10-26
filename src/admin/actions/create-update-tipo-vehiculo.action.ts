import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { TipoVehiculoItem } from '../interfaces/tipo-vehiculo.interface';

export interface CreateUpdateTipoVehiculoPayload {
  nombre?: string;
}

export const createUpdateTipoVehiculoAction = async (
  payload: CreateUpdateTipoVehiculoPayload,
  id?: number | string
): Promise<TipoVehiculoItem> => {
  const isUpdating = !!id && id !== 'new';

  if (isUpdating) {
    const { data } = await apiClient.put<ApiResponse<TipoVehiculoItem> | TipoVehiculoItem>(
      `/tipos-vehiculos/${id}`,
      payload
    );
    return 'data' in data ? data.data : data;
  } else {
    const { data } = await apiClient.post<ApiResponse<TipoVehiculoItem> | TipoVehiculoItem>(
      '/tipos-vehiculos',
      payload
    );
    return 'data' in data ? data.data : data;
  }
};
