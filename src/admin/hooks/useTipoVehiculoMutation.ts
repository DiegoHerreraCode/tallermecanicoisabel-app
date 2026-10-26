import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  createUpdateTipoVehiculoAction,
  type CreateUpdateTipoVehiculoPayload,
} from '../actions/create-update-tipo-vehiculo.action';

export const useTipoVehiculoMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const saveMutation = useMutation({
    mutationFn: ({
      payload,
      id,
    }: {
      payload: CreateUpdateTipoVehiculoPayload;
      id?: string;
    }) => createUpdateTipoVehiculoAction(payload, id),
    onSuccess: (_, variables) => {
      const isCreating = !variables.id || variables.id === 'new';
      toast.success(
        isCreating
          ? 'Tipo de vehiculo registrado correctamente'
          : 'Tipo de vehiculo actualizado correctamente'
      );
      queryClient.invalidateQueries({ queryKey: ['tipos-vehiculos-listado'] });
      if (variables.id && variables.id !== 'new') {
        queryClient.invalidateQueries({ queryKey: ['tipo-vehiculo-item', variables.id] });
      }
      navigate('/admin/vehiculos/tipos-vehiculos');
    },
    onError: (error: any) => {
      const errors = error.response?.data?.errors;
      if (errors && typeof errors === 'object') {
        const firstKey = Object.keys(errors)[0];
        const firstMsg = errors[firstKey][0];
        toast.error(firstMsg);
        return;
      }
      const msg =
        error.response?.data?.message ||
        'Error al procesar la solicitud. Revisa los datos ingresados.';
      toast.error(msg);
    },
  });

  return {
    saveTipoVehiculo: saveMutation.mutate,
    isPending: saveMutation.isPending,
  };
};
