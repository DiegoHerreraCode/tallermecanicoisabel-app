import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { PresupuestoItem } from '../interfaces/presupuesto.interface';

export const getPresupuestoByIdAction = async (
  id: number | string
): Promise<PresupuestoItem> => {
  const { data } = await apiClient.get<ApiResponse<PresupuestoItem>>(`/presupuestos/${id}`);
  return data.data;
};

