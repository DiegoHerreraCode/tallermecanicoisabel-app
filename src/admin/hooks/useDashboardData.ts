import { useQuery } from '@tanstack/react-query';
import { getOrdenesAction } from '../actions/get-ordenes.action';
import { getPersonalAction } from '../actions/get-personal.action';
import { getPresupuestosAction } from '../actions/get-presupuestos.action';
import { getPagosClientesAction } from '../actions/get-pagos-clientes.action';
import { getTiposOrdenesAction } from '../actions/get-tipos-ordenes.action';
import { getTiposServiciosTallerAction } from '../actions/get-tipos-servicios-taller.action';

export const useDashboardData = () => {
  const ordenesQuery = useQuery({
    queryKey: ['dashboard', 'ordenes'],
    queryFn: getOrdenesAction,
    staleTime: 1000 * 60 * 3, // 3 minutos
  });

  const personalQuery = useQuery({
    queryKey: ['dashboard', 'personal'],
    queryFn: getPersonalAction,
    staleTime: 1000 * 60 * 3,
  });

  const presupuestosQuery = useQuery({
    queryKey: ['dashboard', 'presupuestos'],
    queryFn: getPresupuestosAction,
    staleTime: 1000 * 60 * 3,
  });

  const pagosClientesQuery = useQuery({
    queryKey: ['dashboard', 'pagos-clientes'],
    queryFn: getPagosClientesAction,
    staleTime: 1000 * 60 * 3,
  });

  const tiposOrdenesQuery = useQuery({
    queryKey: ['dashboard', 'tipos-ordenes'],
    queryFn: getTiposOrdenesAction,
    staleTime: 1000 * 60 * 5,
  });

  const tiposServiciosQuery = useQuery({
    queryKey: ['dashboard', 'tipos-servicios-taller'],
    queryFn: getTiposServiciosTallerAction,
    staleTime: 1000 * 60 * 5,
  });

  const isLoading =
    ordenesQuery.isLoading ||
    personalQuery.isLoading ||
    presupuestosQuery.isLoading ||
    pagosClientesQuery.isLoading ||
    tiposOrdenesQuery.isLoading ||
    tiposServiciosQuery.isLoading;

  return {
    ordenes: ordenesQuery.data || [],
    personal: personalQuery.data || [],
    presupuestos: presupuestosQuery.data || [],
    pagosClientes: pagosClientesQuery.data || [],
    tiposOrdenes: tiposOrdenesQuery.data || [],
    tiposServicios: tiposServiciosQuery.data || [],
    isLoading,
    refetchAll: () => {
      ordenesQuery.refetch();
      personalQuery.refetch();
      presupuestosQuery.refetch();
      pagosClientesQuery.refetch();
      tiposOrdenesQuery.refetch();
      tiposServiciosQuery.refetch();
    },
  };
};
