import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { RepuestoItem } from '../interfaces/repuesto.interface';

export const getRepuestoByIdAction = async (id: string | number): Promise<RepuestoItem | null> => {
  try {
    const { data } = await apiClient.get<ApiResponse<RepuestoItem> | RepuestoItem>(`/repuestos/${id}`);
    if ('data' in data && data.data) {
      return data.data;
    }
    return data as RepuestoItem;
  } catch (error) {
    console.error(`Error al obtener el repuesto #${id}:`, error);
    return null;
  }
};
