import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { PagoClienteItem } from '../interfaces/pago-cliente.interface';

export const getPagosClientesAction = async (): Promise<PagoClienteItem[]> => {
  const { data } = await apiClient.get<ApiResponse<PagoClienteItem[]>>('/pagos-clientes');
  return data.data || [];
};
