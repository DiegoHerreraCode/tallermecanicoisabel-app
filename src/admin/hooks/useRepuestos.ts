import { useQuery } from '@tanstack/react-query';
import { getRepuestosAction } from '../actions/get-repuestos.action';
import { getMarcasRepuestosAction } from '../actions/get-marcas-repuestos.action';

export const useRepuestos = () => {
  const repuestosQuery = useQuery({
    queryKey: ['repuestos-listado'],
    queryFn: getRepuestosAction,
    staleTime: 1000 * 60 * 3, // 3 minutos
  });

  const marcasQuery = useQuery({
    queryKey: ['marcas-repuestos-listado'],
    queryFn: getMarcasRepuestosAction,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  return {
    repuestos: repuestosQuery.data || [],
    marcas: marcasQuery.data || [],
    isLoading: repuestosQuery.isLoading || marcasQuery.isLoading,
    isError: repuestosQuery.isError || marcasQuery.isError,
    refetch: () => {
      repuestosQuery.refetch();
      marcasQuery.refetch();
    },
  };
};
