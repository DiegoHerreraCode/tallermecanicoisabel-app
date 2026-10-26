import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { ModeloVehiculoItem } from '../interfaces/modelo-vehiculo.interface';

export const getModeloVehiculoByIdAction = async (id: number | string): Promise<ModeloVehiculoItem | null> => {
  try {
    const { data } = await apiClient.get<ApiResponse<ModeloVehiculoItem> | ModeloVehiculoItem>(`/modelos-vehiculos/${id}`);
    if ('data' in data) {
      return data.data;
    }
    return data as ModeloVehiculoItem;
  } catch (error) {
    console.error('Error al obtener modelo de vehículo por ID:', error);
    return null;
  }
};
