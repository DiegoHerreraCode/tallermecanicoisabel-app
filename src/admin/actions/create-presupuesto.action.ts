import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type {
  PresupuestoItem,
  CreateUpdatePresupuestoPayload,
} from '../interfaces/presupuesto.interface';

export const createPresupuestoAction = async (
  payload: CreateUpdatePresupuestoPayload
): Promise<PresupuestoItem> => {
  const { data } = await apiClient.post<ApiResponse<PresupuestoItem> | PresupuestoItem>(
    '/presupuestos',
    payload
  );
  return 'data' in data ? data.data : data;
};
