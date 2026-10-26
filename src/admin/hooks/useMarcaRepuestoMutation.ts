import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  createUpdateMarcaRepuestoAction,
  type CreateUpdateMarcaRepuestoPayload,
} from '../actions/create-update-marca-repuesto.action';

export const useMarcaRepuestoMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const saveMutation = useMutation({
    mutationFn: ({
      payload,
      id,
    }: {
      payload: CreateUpdateMarcaRepuestoPayload;
      id?: string;
    }) => createUpdateMarcaRepuestoAction(payload, id),
    onSuccess: (_, variables) => {
      const isCreating = !variables.id || variables.id === 'new';
      toast.success(
        isCreating
          ? 'Marca de repuesto registrada correctamente'
          : 'Marca de repuesto actualizada correctamente'
      );
      queryClient.invalidateQueries({ queryKey: ['marcas-repuestos-listado'] });
      if (variables.id && variables.id !== 'new') {
        queryClient.invalidateQueries({ queryKey: ['marca-repuesto-item', variables.id] });
      }
      navigate('/admin/inventario-servicios/marcas');
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
    saveMarcaRepuesto: saveMutation.mutate,
    isPending: saveMutation.isPending,
  };
};
