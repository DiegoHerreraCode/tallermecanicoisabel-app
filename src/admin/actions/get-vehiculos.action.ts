import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { VehiculoItem } from '../interfaces/vehiculo.interface';

export const getVehiculosAction = async (): Promise<VehiculoItem[]> => {
  try {
    const { data } = await apiClient.get<ApiResponse<VehiculoItem[]> | VehiculoItem[]>('/vehiculos');
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error al obtener vehículos:', error);
    return [];
  }
};
