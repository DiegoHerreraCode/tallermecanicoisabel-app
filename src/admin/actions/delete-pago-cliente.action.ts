import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { PagoClienteItem } from '../interfaces/pago-cliente.interface';

export const deletePagoClienteAction = async (
  id: number | string,
): Promise<PagoClienteItem> => {
  const { data } = await apiClient.delete<ApiResponse<PagoClienteItem> | PagoClienteItem>(
    `/pagos-clientes/${id}`
  );
  return 'data' in data ? data.data : data;
};
