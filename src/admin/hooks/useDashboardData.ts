import { useQuery } from '@tanstack/react-query';
import { getOrdenesAction } from '../actions/get-ordenes.action';
import { getPersonalAction } from '../actions/get-personal.action';
import { getPresupuestosAction } from '../actions/get-presupuestos.action';
import { getPagosClientesAction } from '../actions/get-pagos-clientes.action';

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

  const isLoading =
    ordenesQuery.isLoading ||
    personalQuery.isLoading ||
    presupuestosQuery.isLoading ||
    pagosClientesQuery.isLoading;

  return {
    ordenes: ordenesQuery.data || [],
    personal: personalQuery.data || [],
    presupuestos: presupuestosQuery.data || [],
    pagosClientes: pagosClientesQuery.data || [],
    isLoading,
    refetchAll: () => {
      ordenesQuery.refetch();
      personalQuery.refetch();
      presupuestosQuery.refetch();
      pagosClientesQuery.refetch();
    },
  };
};
