import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { IngresoItem } from '../interfaces/ingreso.interface';

export const getIngresoByIdAction = async (id: number | string): Promise<IngresoItem | null> => {
  try {
    const { data } = await apiClient.get<ApiResponse<IngresoItem> | IngresoItem>(`/ingresos/${id}`);
    if ('data' in data) {
      return data.data;
    }
    return data;
  } catch (error) {
    console.error('Error al obtener ingreso por ID:', error);
    return null;
  }
};
