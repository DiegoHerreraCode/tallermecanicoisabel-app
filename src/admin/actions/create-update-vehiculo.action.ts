import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type {
  VehiculoItem,
  CreateUpdateVehiculoPayload,
} from '../interfaces/vehiculo.interface';

export const createUpdateVehiculoAction = async (
  payload: CreateUpdateVehiculoPayload,
  id?: number | string
): Promise<VehiculoItem> => {
  const isUpdating = !!id && id !== 'new';

  if (isUpdating) {
    // Al actualizar, excluimos id_cliente del payload enviado
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id_cliente, ...updateData } = payload as any;
    const { data } = await apiClient.put<ApiResponse<VehiculoItem> | VehiculoItem>(
      `/vehiculos/${id}`,
      updateData
    );
    return 'data' in data ? data.data : data;
  } else {
    const { data } = await apiClient.post<ApiResponse<VehiculoItem> | VehiculoItem>(
      '/vehiculos',
      payload
    );
    return 'data' in data ? data.data : data;
  }
};
