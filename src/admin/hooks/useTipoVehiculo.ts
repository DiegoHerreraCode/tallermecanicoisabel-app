import { useQuery } from '@tanstack/react-query';
import { getTiposVehiculosAction } from '../actions/get-tipos-vehiculos.action';

export const useTipoVehiculo = () => {
  const tipoVehiculoQuery = useQuery({
    queryKey: ['tipos-vehiculos-listado'],
    queryFn: getTiposVehiculosAction,
    staleTime: 1000 * 60 * 3, // 3 minutos
  });


  return {
    tipoVehiculo: tipoVehiculoQuery.data || [],
    isLoading: tipoVehiculoQuery.isLoading,
    isError: tipoVehiculoQuery.isError,
    refetch: tipoVehiculoQuery.refetch,
  };
};
