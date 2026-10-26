import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { createUpdateVehiculoAction } from '../actions/create-update-vehiculo.action';
import type { CreateUpdateVehiculoPayload } from '../interfaces/vehiculo.interface';

export const useVehiculoMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: ({
      payload,
      id,
    }: {
      payload: CreateUpdateVehiculoPayload;
      id?: number | string;
    }) => createUpdateVehiculoAction(payload, id),
    onSuccess: (_, variables) => {
      const isUpdating = !!variables.id && variables.id !== 'new';
      toast.success(
        isUpdating
          ? 'Vehículo actualizado correctamente'
          : 'Vehículo registrado correctamente'
      );
      queryClient.invalidateQueries({ queryKey: ['vehiculos-listado'] });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: ['vehiculo-item', variables.id] });
      }
      navigate('/admin/vehiculos/listado');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Ocurrió un error al procesar la solicitud del vehículo';
      toast.error(message);
    },
  });

  return {
    saveVehiculo: mutation.mutate,
    isPending: mutation.isPending,
  };
};
