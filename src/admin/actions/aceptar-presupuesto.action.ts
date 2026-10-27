import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type {
  PresupuestoItem,
  AceptarPresupuestoPayload,
} from '../interfaces/presupuesto.interface';

export const aceptarPresupuestoAction = async (
  id: number | string,
  payload?: AceptarPresupuestoPayload
): Promise<PresupuestoItem> => {
  const { data } = await apiClient.post<ApiResponse<PresupuestoItem>>(
    `/presupuestos/${id}/aceptar`,
    payload || {}
  );
  return data.data;
};
