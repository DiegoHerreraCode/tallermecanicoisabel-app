import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { ModeloVehiculoItem } from '../interfaces/modelo-vehiculo.interface';

export const getModelosVehiculosAction = async (): Promise<ModeloVehiculoItem[]> => {
  try {
    const { data } = await apiClient.get<ApiResponse<ModeloVehiculoItem[]> | ModeloVehiculoItem[]>('/modelos-vehiculos');
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error al obtener modelos de vehículos:', error);
    return [];
  }
};
