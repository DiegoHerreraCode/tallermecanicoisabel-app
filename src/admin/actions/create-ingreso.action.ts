import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { IngresoItem, CreateIngresoPayload } from '../interfaces/ingreso.interface';

export const createIngresoAction = async (payload: CreateIngresoPayload): Promise<IngresoItem> => {
  const { data } = await apiClient.post<ApiResponse<IngresoItem> | IngresoItem>(
    '/ingresos',
    payload
  );
  return 'data' in data ? data.data : data;
};
