import { apiClient } from '@/api/apiClient';

export interface UpdateOrdenServicioTallerPayload {
  id_personal?: number | null;
  estado?: string;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
}

export const updateOrdenServicioTallerAction = async (
  id: number | string,
  payload: UpdateOrdenServicioTallerPayload
) => {
  const { data } = await apiClient.put(`/ordenes-servicios-taller/${id}`, payload);
  return data;
};
