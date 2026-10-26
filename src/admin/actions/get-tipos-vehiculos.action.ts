import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { TipoVehiculoItem } from '../interfaces/tipo-vehiculo.interface';

export const getTiposVehiculosAction = async (): Promise<TipoVehiculoItem[]> => {
  try {
    const { data } = await apiClient.get<ApiResponse<TipoVehiculoItem[]> | TipoVehiculoItem[]>('/tipos-vehiculos');
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error al obtener tipos de vehiculos:', error);
    return [];
  }
};
