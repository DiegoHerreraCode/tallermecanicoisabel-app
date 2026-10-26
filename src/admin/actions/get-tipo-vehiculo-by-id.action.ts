import { apiClient } from '@/api/apiClient';
import type { TipoVehiculoItem } from '../interfaces/tipo-vehiculo.interface';
import type { ApiResponse } from '../interfaces/api-response.interface';

export const getTipoVehiculoByIdAction = async (id: number | string): Promise<TipoVehiculoItem | null> => {
  try {
    const { data } = await apiClient.get<ApiResponse<TipoVehiculoItem> | TipoVehiculoItem>(`/tipos-vehiculos/${id}`);
    if ('data' in data) {
      return data.data;
    }
    return data;
  } catch (error) {
    console.error('Error al obtener tipo de vehiculo por ID:', error);
    return null;
  }
};
