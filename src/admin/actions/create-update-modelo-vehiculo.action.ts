import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { ModeloVehiculoItem } from '../interfaces/modelo-vehiculo.interface';

export interface CreateModeloVehiculoPayload {
  id_marca_vehiculo: number;
  nombre: string;
}

export interface UpdateModeloVehiculoPayload {
  nombre?: string;
}

export type CreateUpdateModeloVehiculoPayload = CreateModeloVehiculoPayload | UpdateModeloVehiculoPayload;

export const createUpdateModeloVehiculoAction = async (
  payload: CreateUpdateModeloVehiculoPayload,
  id?: number | string
): Promise<ModeloVehiculoItem> => {
  const isUpdating = !!id && id !== 'new';

  if (isUpdating) {
    const { data } = await apiClient.put<ApiResponse<ModeloVehiculoItem> | ModeloVehiculoItem>(
      `/modelos-vehiculos/${id}`,
      payload
    );
    return 'data' in data ? data.data : data;
  } else {
    const { data } = await apiClient.post<ApiResponse<ModeloVehiculoItem> | ModeloVehiculoItem>(
      '/modelos-vehiculos',
      payload
    );
    return 'data' in data ? data.data : data;
  }
};
