import { useQuery } from '@tanstack/react-query';
import { getIngresosAction } from '../actions/get-ingresos.action';
import { getVehiculosAction } from '../actions/get-vehiculos.action';
import { getClientesAction } from '../actions/get-clientes.action';
import { getModelosVehiculosAction } from '../actions/get-modelos-vehiculos.action';
import { getMarcasVehiculosAction } from '../actions/get-marcas-vehiculos.action';
import { getTiposOrdenesAction } from '../actions/get-tipos-ordenes.action';

export const useIngresos = () => {
  const {
    data: ingresos = [],
    isLoading: isLoadingIngresos,
    error: errorIngresos,
  } = useQuery({
    queryKey: ['ingresos-listado'],
    queryFn: getIngresosAction,
  });

  const {
    data: vehiculos = [],
    isLoading: isLoadingVehiculos,
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

  const {
    data: tiposOrdenes = [],
    isLoading: isLoadingTiposOrdenes,
  } = useQuery({
    queryKey: ['tipos-ordenes-listado'],
    queryFn: getTiposOrdenesAction,
  });

  return {
    ingresos,
    vehiculos,
    clientes,
    modelosVehiculos,
    marcasVehiculos,
    tiposOrdenes,
    isLoading:
      isLoadingIngresos ||
      isLoadingVehiculos ||
      isLoadingClientes ||
      isLoadingModelos ||
      isLoadingMarcas ||
      isLoadingTiposOrdenes,
    error: errorIngresos,
  };
};
