import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { VehiculoItem } from '../interfaces/vehiculo.interface';

export const getVehiculoByIdAction = async (id: number | string): Promise<VehiculoItem> => {
  const { data } = await apiClient.get<ApiResponse<VehiculoItem> | VehiculoItem>(`/vehiculos/${id}`);
  return 'data' in data ? data.data : data;
};
