import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type {
  HallazgoTecnicoItem,
  CreateHallazgoTecnicoPayload,
} from '../interfaces/orden.interface';

export const createHallazgoTecnicoAction = async (
  payload: CreateHallazgoTecnicoPayload
): Promise<HallazgoTecnicoItem> => {
  const { data } = await apiClient.post<
    ApiResponse<HallazgoTecnicoItem> | HallazgoTecnicoItem
  >('/hallazgos-tecnicos', payload);
  return 'data' in data ? data.data : data;
};
