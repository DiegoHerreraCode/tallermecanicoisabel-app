import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  createUpdateRepuestoAction,
} from '../actions/create-update-repuesto.action';
import type { CreateUpdateRepuestoPayload } from '../interfaces/repuesto.interface';

export const useRepuestoMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const saveMutation = useMutation({
    mutationFn: ({
      payload,
      id,
    }: {
      payload: CreateUpdateRepuestoPayload;
      id?: string | number;
    }) => createUpdateRepuestoAction(payload, id),
    onSuccess: (_, variables) => {
      const isCreating = !variables.id || variables.id === 'new';
      toast.success(
        isCreating
          ? 'Repuesto registrado correctamente'
          : 'Repuesto actualizado correctamente'
      );
      queryClient.invalidateQueries({ queryKey: ['repuestos-listado'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (variables.id && variables.id !== 'new') {
        queryClient.invalidateQueries({ queryKey: ['repuesto-item', String(variables.id)] });
      }
      navigate('/admin/inventario-servicios/repuestos');
    },
    onError: (error: any) => {
      const msg =
        error.response?.data?.message ||
        'Error al procesar la solicitud. Revisa los datos ingresados.';
      toast.error(msg);
    },
  });

  return {
    saveRepuesto: saveMutation.mutate,
    isPending: saveMutation.isPending,
  };
};
