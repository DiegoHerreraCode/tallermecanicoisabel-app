import { useQuery } from '@tanstack/react-query';
import { getOrdenesAction } from '../actions/get-ordenes.action';

export const useOrdenes = () => {
  const ordenesQuery = useQuery({
    queryKey: ['ordenes-listado'],
    queryFn: getOrdenesAction,
    staleTime: 1000 * 60 * 3, // 3 minutos
  });

  return {
    ordenes: ordenesQuery.data || [],
    isLoading: ordenesQuery.isLoading,
    isError: ordenesQuery.isError,
    refetch: ordenesQuery.refetch,
  };
};
