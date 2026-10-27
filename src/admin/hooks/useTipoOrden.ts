import { useQuery } from '@tanstack/react-query';
import { getTiposOrdenesAction } from '../actions/get-tipos-ordenes.action';

export const useTiposOrden = () => {
  const tiposOrdenQuery = useQuery({
    queryKey: ['tipos-ordenes-listado'],
    queryFn: getTiposOrdenesAction,
    staleTime: 1000 * 60 * 5,
  });

  return {
    tiposOrden: tiposOrdenQuery.data || [],
    isLoading: tiposOrdenQuery.isLoading,
    isError: tiposOrdenQuery.isError,
    refetch: tiposOrdenQuery.refetch,
  };
};
