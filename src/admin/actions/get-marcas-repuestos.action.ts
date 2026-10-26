import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { MarcaRepuestoItem } from '../interfaces/repuesto.interface';

export const getMarcasRepuestosAction = async (): Promise<MarcaRepuestoItem[]> => {
  try {
    const { data } = await apiClient.get<ApiResponse<MarcaRepuestoItem[]> | MarcaRepuestoItem[]>('/marcas-repuestos');
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error al obtener marcas de repuestos:', error);
    return [];
  }
};
