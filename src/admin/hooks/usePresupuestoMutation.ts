import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { createPresupuestoAction } from '../actions/create-presupuesto.action';
import { aceptarPresupuestoAction } from '../actions/aceptar-presupuesto.action';
import { rechazarPresupuestoAction } from '../actions/rechazar-presupuesto.action';
import { anularPresupuestoAction } from '../actions/anular-presupuesto.action';
import type {
  CreateUpdatePresupuestoPayload,
  AceptarPresupuestoPayload,
  AnularPresupuestoPayload,
} from '../interfaces/presupuesto.interface';

export const usePresupuestoMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Crear Presupuesto
  const createMutation = useMutation({
    mutationFn: (payload: CreateUpdatePresupuestoPayload) =>
      createPresupuestoAction(payload),
    onSuccess: (data) => {
      const msg =
        data?.tipo === 'extra'
          ? 'Presupuesto extra registrado correctamente'
          : 'Presupuesto inicial registrado correctamente';
      toast.success(msg);
      queryClient.invalidateQueries({ queryKey: ['presupuestos-listado'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'presupuestos'] });
      queryClient.invalidateQueries({ queryKey: ['ingresos-listado'] });
      queryClient.invalidateQueries({ queryKey: ['ordenes-listado'] });
      navigate('/admin/taller/presupuestos');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Ocurrió un error al registrar el presupuesto';
      toast.error(message);
    },
  });

  // Aceptar Presupuesto
  const aceptarMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload?: AceptarPresupuestoPayload;
    }) => aceptarPresupuestoAction(id, payload),
    onSuccess: (data) => {
      const msg =
        data?.tipo === 'extra'
          ? 'Presupuesto extra aceptado e incorporado a la orden'
          : 'Presupuesto inicial aceptado y orden de trabajo generada';
      toast.success(msg);
      queryClient.invalidateQueries({ queryKey: ['presupuestos-listado'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'presupuestos'] });
      queryClient.invalidateQueries({ queryKey: ['ordenes-listado'] });
      queryClient.invalidateQueries({ queryKey: ['ingresos-listado'] });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Ocurrió un error al aceptar el presupuesto';
      toast.error(message);
    },
  });

  // Rechazar Presupuesto
  const rechazarMutation = useMutation({
    mutationFn: (id: number | string) => rechazarPresupuestoAction(id),
    onSuccess: () => {
      toast.success('Presupuesto rechazado correctamente');
      queryClient.invalidateQueries({ queryKey: ['presupuestos-listado'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'presupuestos'] });
      queryClient.invalidateQueries({ queryKey: ['ingresos-listado'] });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Ocurrió un error al rechazar el presupuesto';
      toast.error(message);
    },
  });

  // Anular Presupuesto
  const anularMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: AnularPresupuestoPayload;
    }) => anularPresupuestoAction(id, payload),
    onSuccess: () => {
      toast.success('Presupuesto anulado correctamente');
      queryClient.invalidateQueries({ queryKey: ['presupuestos-listado'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'presupuestos'] });
      queryClient.invalidateQueries({ queryKey: ['ingresos-listado'] });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Ocurrió un error al anular el presupuesto';
      toast.error(message);
    },
  });

  return {
    createPresupuesto: createMutation.mutateAsync,
    isCreatingPresupuesto: createMutation.isPending,

    aceptarPresupuesto: aceptarMutation.mutateAsync,
    isAceptandoPresupuesto: aceptarMutation.isPending,

    rechazarPresupuesto: rechazarMutation.mutateAsync,
    isRechazandoPresupuesto: rechazarMutation.isPending,

    anularPresupuesto: anularMutation.mutateAsync,
    isAnulandoPresupuesto: anularMutation.isPending,
  };
};
