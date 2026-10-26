import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { MarcaVehiculoItem } from '../interfaces/marca-vehiculo.interface';

export const getMarcaVehiculoByIdAction = async (id: number | string): Promise<MarcaVehiculoItem | null> => {
  try {
    const { data } = await apiClient.get<ApiResponse<MarcaVehiculoItem> | MarcaVehiculoItem>(`/marcas-vehiculos/${id}`);
    if ('data' in data) {
      return data.data;
    }
    return data;
  } catch (error) {
    console.error('Error al obtener marca de vehiculo por ID:', error);
    return null;
  }
};
