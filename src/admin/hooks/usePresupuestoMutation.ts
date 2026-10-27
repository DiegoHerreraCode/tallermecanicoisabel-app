import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { aceptarPresupuestoAction } from '../actions/aceptar-presupuesto.action';
import { rechazarPresupuestoAction } from '../actions/rechazar-presupuesto.action';
import { anularPresupuestoAction } from '../actions/anular-presupuesto.action';
import type {
  AceptarPresupuestoPayload,
  AnularPresupuestoPayload,
} from '../interfaces/presupuesto.interface';

export const usePresupuestoMutation = () => {
  const queryClient = useQueryClient();

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
    aceptarPresupuesto: aceptarMutation.mutateAsync,
    isAceptandoPresupuesto: aceptarMutation.isPending,

    rechazarPresupuesto: rechazarMutation.mutateAsync,
    isRechazandoPresupuesto: rechazarMutation.isPending,

    anularPresupuesto: anularMutation.mutateAsync,
    isAnulandoPresupuesto: anularMutation.isPending,
  };
};
