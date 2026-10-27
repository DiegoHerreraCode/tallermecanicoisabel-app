import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { HallazgoTecnicoItem } from '../interfaces/orden.interface';

export const getHallazgosTecnicosAction = async (
  idOrden?: number | string
): Promise<HallazgoTecnicoItem[]> => {
  try {
    const { data } = await apiClient.get<
      ApiResponse<HallazgoTecnicoItem[]> | HallazgoTecnicoItem[]
    >('/hallazgos-tecnicos');
    const all = Array.isArray(data) ? data : data.data || [];
    if (idOrden) {
      return all.filter((h) => Number(h.id_orden) === Number(idOrden));
    }
    return all;
  } catch (error) {
    console.error('Error al obtener hallazgos técnicos:', error);
    return [];
  }
};
