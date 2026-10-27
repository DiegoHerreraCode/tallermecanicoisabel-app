import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { IngresoItem } from '../interfaces/ingreso.interface';

export const uploadPdfChecklistAction = async (
  id: number | string,
  file: File
): Promise<IngresoItem> => {
  const formData = new FormData();
  formData.append('pdf_checklist', file);

  const { data } = await apiClient.post<ApiResponse<IngresoItem> | IngresoItem>(
    `/ingresos/${id}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      params: {
        _method: 'PUT',
      },
    }
  );
  return 'data' in data ? data.data : data;
};
