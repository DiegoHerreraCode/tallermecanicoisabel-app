import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  createUpdateModeloVehiculoAction,
  type CreateUpdateModeloVehiculoPayload,
} from '../actions/create-update-modelo-vehiculo.action';

export const useModeloVehiculoMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const saveMutation = useMutation({
    mutationFn: ({
      payload,
      id,
    }: {
      payload: CreateUpdateModeloVehiculoPayload;
      id?: string;
    }) => createUpdateModeloVehiculoAction(payload, id),
    onSuccess: (_, variables) => {
      const isCreating = !variables.id || variables.id === 'new';
      toast.success(
        isCreating
          ? 'Modelo de vehículo registrado correctamente'
          : 'Modelo de vehículo actualizado correctamente'
      );
      queryClient.invalidateQueries({ queryKey: ['modelos-vehiculos-listado'] });
      if (variables.id && variables.id !== 'new') {
        queryClient.invalidateQueries({ queryKey: ['modelo-vehiculo-item', variables.id] });
      }
      navigate('/admin/vehiculos/modelos');
    },
    onError: (error: any) => {
      const errors = error.response?.data?.errors;
      if (errors) {
        const firstErrorKey = Object.keys(errors)[0];
        toast.error(errors[firstErrorKey][0]);
      } else {
        const msg =
          error.response?.data?.message ||
          'Error al procesar la solicitud. Revisa los datos ingresados.';
        toast.error(msg);
      }
    },
  });

  return {
    saveModeloVehiculo: saveMutation.mutate,
    isPending: saveMutation.isPending,
  };
};
