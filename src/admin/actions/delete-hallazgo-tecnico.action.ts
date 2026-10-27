import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';

export const deleteHallazgoTecnicoAction = async (
  id: number | string
): Promise<void> => {
  await apiClient.delete<ApiResponse<void>>(`/hallazgos-tecnicos/${id}`);
};
