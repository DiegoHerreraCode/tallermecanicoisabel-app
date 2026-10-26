import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { MarcaVehiculoItem } from '../interfaces/marca-vehiculo.interface';

export const getMarcasVehiculosAction = async (): Promise<MarcaVehiculoItem[]> => {
  try {
    const { data } = await apiClient.get<ApiResponse<MarcaVehiculoItem[]> | MarcaVehiculoItem[]>('/marcas-vehiculos');
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error al obtener marcas de vehiculos:', error);
    return [];
  }
};
