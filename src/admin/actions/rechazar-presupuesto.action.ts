import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { PresupuestoItem } from '../interfaces/presupuesto.interface';

export const rechazarPresupuestoAction = async (
  id: number | string
): Promise<PresupuestoItem> => {
  const { data } = await apiClient.post<ApiResponse<PresupuestoItem>>(
    `/presupuestos/${id}/rechazar`
  );
  return data.data;
};
