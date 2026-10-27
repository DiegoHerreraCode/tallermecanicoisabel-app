import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  createUpdateOrdenAction,
  type CreateUpdateOrdenPayload,
} from '../actions/create-update-orden.action';
import { createHallazgoTecnicoAction } from '../actions/create-hallazgo-tecnico.action';
import {
  updateOrdenServicioTallerAction,
  type UpdateOrdenServicioTallerPayload,
} from '../actions/update-orden-servicio-taller.action';
import type { CreateHallazgoTecnicoPayload } from '../interfaces/orden.interface';

export const useOrdenMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Guardar (Crear o Actualizar) Orden de Trabajo
  const saveMutation = useMutation({
    mutationFn: ({
      payload,
      id,
    }: {
      payload: CreateUpdateOrdenPayload;
      id?: number | string;
    }) => createUpdateOrdenAction(payload, id),
    onSuccess: (data, variables) => {
      const isCreating = !variables.id || variables.id === 'new';
      toast.success(
        isCreating
          ? 'Orden registrada correctamente'
          : 'Orden actualizada correctamente'
      );
      queryClient.invalidateQueries({ queryKey: ['ordenes-listado'] });
      queryClient.invalidateQueries({ queryKey: ['ingresos-listado'] });
      if (variables.id && variables.id !== 'new') {
        queryClient.invalidateQueries({ queryKey: ['orden-item', String(variables.id)] });
      }
      navigate(`/admin/taller/ordenes/${data.id_orden}`);
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Ocurrió un error al procesar la solicitud de la orden';
      toast.error(message);
    },
  });

  // Guardar Hallazgo Técnico
  const hallazgoMutation = useMutation({
    mutationFn: (payload: CreateHallazgoTecnicoPayload) =>
      createHallazgoTecnicoAction(payload),
    onSuccess: (_, variables) => {
      toast.success('Hallazgo técnico registrado correctamente');
      queryClient.invalidateQueries({
        queryKey: ['hallazgos-orden', String(variables.id_orden)],
      });
      queryClient.invalidateQueries({
        queryKey: ['orden-item', String(variables.id_orden)],
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Ocurrió un error al registrar el hallazgo técnico';
      toast.error(message);
    },
  });

  // Actualizar Estado o Personal de un Servicio de la Orden
  const updateServicioMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: UpdateOrdenServicioTallerPayload;
      ordenId?: number | string;
    }) => updateOrdenServicioTallerAction(id, payload),
    onSuccess: (_, variables) => {
      toast.success('Servicio de taller actualizado correctamente');
      if (variables.ordenId) {
        queryClient.invalidateQueries({
          queryKey: ['orden-item', String(variables.ordenId)],
        });
      }
      queryClient.invalidateQueries({ queryKey: ['orden-item'] });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Ocurrió un error al actualizar el servicio';
      toast.error(message);
    },
  });

  return {
    saveOrden: saveMutation.mutate,
    isPending: saveMutation.isPending,
    // Alias directos
    createOrden: (payload: CreateUpdateOrdenPayload) =>
      saveMutation.mutate({ payload }),
    isCreating: saveMutation.isPending,
    updateOrden: (params: { id: number | string; payload: CreateUpdateOrdenPayload }) =>
      saveMutation.mutate(params),
    isUpdating: saveMutation.isPending,

    createHallazgo: hallazgoMutation.mutate,
    isCreatingHallazgo: hallazgoMutation.isPending,

    updateServicio: updateServicioMutation.mutate,
    updateServicioAsync: updateServicioMutation.mutateAsync,
    isUpdatingServicio: updateServicioMutation.isPending,
  };
};
