import { useQuery } from '@tanstack/react-query';
import { getMarcasVehiculosAction } from '../actions/get-marcas-vehiculos.action';

export const useMarcaVehiculo = () => {
  const marcaVehiculoQuery = useQuery({
    queryKey: ['marcas-vehiculos-listado'],
    queryFn: getMarcasVehiculosAction,
    staleTime: 1000 * 60 * 3, // 3 minutos
  });


  return {
    marcasVehiculos: marcaVehiculoQuery.data || [],
    isLoading: marcaVehiculoQuery.isLoading,
    isError: marcaVehiculoQuery.isError,
    refetch: marcaVehiculoQuery.refetch,
  };
};
