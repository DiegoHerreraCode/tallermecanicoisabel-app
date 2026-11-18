import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { HallazgoTecnicoItem } from '../interfaces/orden.interface';

export const getHallazgosTecnicosAction = async (params?: {
  idOrden?: number | string;
  idIngreso?: number | string;
}): Promise<HallazgoTecnicoItem[]> => {
  try {
    const queryParams: Record<string, any> = {};
    if (params?.idOrden) queryParams.id_orden = params.idOrden;
    if (params?.idIngreso) queryParams.id_ingreso = params.idIngreso;

    const { data } = await apiClient.get<
      ApiResponse<HallazgoTecnicoItem[]> | HallazgoTecnicoItem[]
    >('/hallazgos-tecnicos', { params: queryParams });
    const all = Array.isArray(data) ? data : data.data || [];

    return all.filter((h) => {
      if (params?.idOrden && Number(h.id_orden) !== Number(params.idOrden)) {
        return false;
      }
      if (params?.idIngreso && Number(h.id_ingreso) !== Number(params.idIngreso)) {
        return false;
      }
      return true;
    });
  } catch (error) {
    console.error('Error al obtener hallazgos técnicos:', error);
    return [];
  }
};
