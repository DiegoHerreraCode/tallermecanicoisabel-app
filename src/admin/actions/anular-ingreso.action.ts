import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { IngresoItem, AnularIngresoPayload } from '../interfaces/ingreso.interface';

export const anularIngresoAction = async (
  id: number | string,
  payload: AnularIngresoPayload
): Promise<IngresoItem> => {
  const { data } = await apiClient.post<ApiResponse<IngresoItem> | IngresoItem>(
    `/ingresos/${id}/anular`,
    payload
  );
  return 'data' in data ? data.data : data;
};
