import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { MarcaVehiculoItem } from '../interfaces/marca-vehiculo.interface';

export interface CreateUpdateMarcaVehiculoPayload {
  nombre?: string;
}

export const createUpdateMarcaVehiculoAction = async (
  payload: CreateUpdateMarcaVehiculoPayload,
  id?: number | string
): Promise<MarcaVehiculoItem> => {
  const isUpdating = !!id && id !== 'new';

  if (isUpdating) {
    const { data } = await apiClient.put<ApiResponse<MarcaVehiculoItem> | MarcaVehiculoItem>(
      `/marcas-vehiculos/${id}`,
      payload
    );
    return 'data' in data ? data.data : data;
  } else {
    const { data } = await apiClient.post<ApiResponse<MarcaVehiculoItem> | MarcaVehiculoItem>(
      '/marcas-vehiculos',
      payload
    );
    return 'data' in data ? data.data : data;
  }
};
