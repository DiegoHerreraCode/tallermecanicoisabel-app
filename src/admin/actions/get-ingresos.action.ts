import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { IngresoItem } from '../interfaces/ingreso.interface';

export const getIngresosAction = async (): Promise<IngresoItem[]> => {
  try {
    const { data } = await apiClient.get<ApiResponse<IngresoItem[]> | IngresoItem[]>('/ingresos');
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error al obtener ingresos:', error);
    return [];
  }
};
