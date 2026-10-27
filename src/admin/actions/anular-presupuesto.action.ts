import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type {
  PresupuestoItem,
  AnularPresupuestoPayload,
} from '../interfaces/presupuesto.interface';

export const anularPresupuestoAction = async (
  id: number | string,
  payload: AnularPresupuestoPayload
): Promise<PresupuestoItem> => {
  const { data } = await apiClient.post<ApiResponse<PresupuestoItem>>(
    `/presupuestos/${id}/anular`,
    payload
  );
  return data.data;
};
