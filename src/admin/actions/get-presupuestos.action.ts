import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { PresupuestoItem } from '../interfaces/presupuesto.interface';

export const getPresupuestosAction = async (): Promise<PresupuestoItem[]> => {
  const { data } = await apiClient.get<ApiResponse<PresupuestoItem[]>>('/presupuestos');
  return data.data || [];
};
