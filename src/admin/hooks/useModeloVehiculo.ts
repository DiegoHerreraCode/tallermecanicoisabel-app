import { useQuery } from '@tanstack/react-query';
import { getModelosVehiculosAction } from '../actions/get-modelos-vehiculos.action';
import { getMarcasVehiculosAction } from '../actions/get-marcas-vehiculos.action';

export const useModeloVehiculo = () => {
  const modelosVehiculosQuery = useQuery({
    queryKey: ['modelos-vehiculos-listado'],
    queryFn: getModelosVehiculosAction,
    staleTime: 1000 * 60 * 3, // 3 minutos
  });

  const marcasVehiculosQuery = useQuery({
    queryKey: ['marcas-vehiculos-listado'],
    queryFn: getMarcasVehiculosAction,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  return {
    modelosVehiculos: modelosVehiculosQuery.data || [],
    marcasVehiculos: marcasVehiculosQuery.data || [],
    isLoading: modelosVehiculosQuery.isLoading || marcasVehiculosQuery.isLoading,
    isError: modelosVehiculosQuery.isError || marcasVehiculosQuery.isError,
    refetch: () => {
      modelosVehiculosQuery.refetch();
      marcasVehiculosQuery.refetch();
    },
  };
};
