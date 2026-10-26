import { apiClient } from '@/api/apiClient';
import type { MarcaRepuestoItem } from '../interfaces/marca-repuesto.interface';
import type { ApiResponse } from '../interfaces/api-response.interface';

export const getMarcaRepuestoByIdAction = async (id: number | string): Promise<MarcaRepuestoItem | null> => {
  try {
    const { data } = await apiClient.get<ApiResponse<MarcaRepuestoItem> | MarcaRepuestoItem>(`/marcas-repuestos/${id}`);
    if ('data' in data) {
      return data.data;
    }
    return data;
  } catch (error) {
    console.error('Error al obtener marca de repuesto por ID:', error);
    return null;
  }
};
