import { useQuery } from '@tanstack/react-query';
import { getVehiculosAction } from '../actions/get-vehiculos.action';
import { getClientesAction } from '../actions/get-clientes.action';
import { getTiposVehiculosAction } from '../actions/get-tipos-vehiculos.action';
import { getModelosVehiculosAction } from '../actions/get-modelos-vehiculos.action';
import { getMarcasVehiculosAction } from '../actions/get-marcas-vehiculos.action';

export const useVehiculos = () => {
  const {
    data: vehiculos = [],
    isLoading: isLoadingVehiculos,
    error: errorVehiculos,
  } = useQuery({
    queryKey: ['vehiculos-listado'],
    queryFn: getVehiculosAction,
  });

  const {
    data: clientes = [],
    isLoading: isLoadingClientes,
  } = useQuery({
    queryKey: ['clientes-listado'],
    queryFn: getClientesAction,
  });

  const {
    data: tiposVehiculos = [],
    isLoading: isLoadingTipos,
  } = useQuery({
    queryKey: ['tipos-vehiculos-listado'],
    queryFn: getTiposVehiculosAction,
  });

  const {
    data: modelosVehiculos = [],
    isLoading: isLoadingModelos,
  } = useQuery({
    queryKey: ['modelos-vehiculos-listado'],
    queryFn: getModelosVehiculosAction,
  });

  const {
    data: marcasVehiculos = [],
    isLoading: isLoadingMarcas,
  } = useQuery({
    queryKey: ['marcas-vehiculos-listado'],
    queryFn: getMarcasVehiculosAction,
  });

  return {
    vehiculos,
    clientes,
    tiposVehiculos,
    modelosVehiculos,
    marcasVehiculos,
    isLoading:
      isLoadingVehiculos ||
      isLoadingClientes ||
      isLoadingTipos ||
      isLoadingModelos ||
      isLoadingMarcas,
    error: errorVehiculos,
  };
};
