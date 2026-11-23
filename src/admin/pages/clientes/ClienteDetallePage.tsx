import { useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Users,
  IdCard,
  Mail,
  Phone,
  MapPin,
  Car,
  Eye,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { getClienteByIdAction } from '../../actions/get-cliente-by-id.action';
import { getVehiculosAction } from '../../actions/get-vehiculos.action';
import { getModelosVehiculosAction } from '../../actions/get-modelos-vehiculos.action';
import { getTiposVehiculosAction } from '../../actions/get-tipos-vehiculos.action';
import type { VehiculoItem } from '../../interfaces/vehiculo.interface';

export const ClienteDetallePage = () => {
  const { id } = useParams<{ id: string }>();
  const { goBack, navigate } = useAppNavigation();

  // 1. Consultar información del cliente
  const { data: cliente, isLoading: isLoadingCliente } = useQuery({
    queryKey: ['cliente-item', id],
    queryFn: () => getClienteByIdAction(id!),
    enabled: !!id,
  });

  // 2. Consultar listado de vehículos
  const { data: vehiculos = [], isLoading: isLoadingVehiculos } = useQuery({
    queryKey: ['vehiculos-listado'],
    queryFn: getVehiculosAction,
  });

  // 3. Catálogos para resolver modelo, marca y tipo si no viniesen anidados
  const { data: modelosVehiculos = [] } = useQuery({
    queryKey: ['modelos-vehiculos-listado'],
    queryFn: getModelosVehiculosAction,
  });

  const { data: tiposVehiculos = [] } = useQuery({
    queryKey: ['tipos-vehiculos-listado'],
    queryFn: getTiposVehiculosAction,
  });

  const modelosMap = useMemo(() => {
    const map = new Map<number, { nombre: string; marca: string }>();
    modelosVehiculos.forEach((m) =>
      map.set(m.id_modelo_vehiculo, {
        nombre: m.nombre,
        marca: m.marca?.nombre || 'N/A',
      })
    );
    return map;
  }, [modelosVehiculos]);

  const tiposMap = useMemo(() => {
    const map = new Map<number, string>();
    tiposVehiculos.forEach((t) => map.set(t.id_tipo_vehiculo, t.nombre));
    return map;
  }, [tiposVehiculos]);

  // 4. Filtrar los vehículos asociados a este cliente
  const vehiculosCliente = useMemo(() => {
    if (!id) return [];
    const clienteIdNum = Number(id);
    return vehiculos.filter((v: VehiculoItem) => Number(v.id_cliente) === clienteIdNum);
  }, [vehiculos, id]);

  // Paginación para la tabla de vehículos asociados (máximo 7 por página)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const totalPages = Math.ceil(vehiculosCliente.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedVehiculos = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    return vehiculosCliente.slice(startIndex, startIndex + itemsPerPage);
  }, [vehiculosCliente, validCurrentPage, itemsPerPage]);

  if (isLoadingCliente) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 dark:border-emerald-400" />
        <p className="text-sm text-muted-foreground animate-pulse">
          Cargando detalles del cliente...
        </p>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="bg-card p-8 rounded-2xl border border-border/80 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-foreground">Cliente no encontrado</h2>
        <p className="text-sm text-muted-foreground">
          No se encontró la información del cliente solicitado.
        </p>
        <button
          onClick={() => goBack('/admin/clientes/listado')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al listado
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 animate-fadeIn">
      {/* 1. BARRA SUPERIOR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <Users className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Cliente: {cliente.nombre}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Información del cliente y catálogo de vehículos asociados registrados
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => goBack('/admin/clientes/listado')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
        </div>
      </div>

      {/* 2. TARJETA DE DATOS DEL CLIENTE */}
      <div className="bg-card p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-3">
          <Users className="w-5 h-5 text-emerald-500" />
          Datos del Cliente
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {/* Nombre */}
          <div className="p-3.5 rounded-xl bg-background border border-border/80">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">
              Nombre Completo
            </span>
            <span className="text-sm font-bold text-foreground block">
              {cliente.nombre}
            </span>
          </div>

          {/* Cédula*/}
          <div className="p-3.5 rounded-xl bg-background border border-border/80">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">
              Cédula
            </span>
            <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <IdCard className="w-4 h-4 text-emerald-500" />
              {cliente.cedula || 'No registrado'}
            </span>
          </div>

          {/* Teléfono */}
          <div className="p-3.5 rounded-xl bg-background border border-border/80">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">
              Teléfono
            </span>
            <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-emerald-500" />
              {cliente.num_tlf || 'No registrado'}
            </span>
          </div>

          {/* Correo */}
          <div className="p-3.5 rounded-xl bg-background border border-border/80">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">
              Correo Electrónico
            </span>
            <span className="text-sm font-semibold text-foreground flex items-center gap-1.5 truncate" title={cliente.correo}>
              <Mail className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="truncate">{cliente.correo || 'No registrado'}</span>
            </span>
          </div>

          {/* Dirección */}
          <div className="p-3.5 rounded-xl bg-background border border-border/80">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">
              Dirección
            </span>
            <span className="text-xs font-semibold text-foreground flex items-start gap-1.5" title={cliente.direccion}>
              <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span className="line-clamp-2">{cliente.direccion || 'No registrada'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. TABLA DE VEHÍCULOS ASOCIADOS */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Car className="w-5 h-5 text-emerald-500" />
              Vehículos Asociados al Cliente
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Vehículos registrados bajo la titularidad de este cliente
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            {vehiculosCliente.length} {vehiculosCliente.length === 1 ? 'vehículo' : 'vehículos'}
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border/80">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                <th scope="col" className="py-3 px-4 text-center">
                  Placa
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  Año
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  Tipo de Vehículo
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  Modelo / Marca
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoadingVehiculos ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600" />
                      Cargando vehículos del cliente...
                    </div>
                  </td>
                </tr>
              ) : paginatedVehiculos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    <Car className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground">
                      No hay vehículos asociados
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      Este cliente no tiene ningún vehículo registrado en el taller.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedVehiculos.map((v: VehiculoItem) => {
                  const modeloInfo = modelosMap.get(v.id_modelo_vehiculo);
                  const modeloNombre = v.modelo?.nombre || modeloInfo?.nombre || 'N/A';
                  const marcaNombre = v.modelo?.marca?.nombre || modeloInfo?.marca || 'N/A';
                  const tipoNombre =
                    v.tipo_vehiculo?.nombre || tiposMap.get(v.id_tipo_vehiculo) || 'N/A';

                  return (
                    <tr
                      key={v.id_vehiculo}
                      className="hover:bg-accent/40 transition-colors"
                    >
                      {/* Placa */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-muted text-foreground border border-border/80 font-mono tracking-wider">
                          {v.placa}
                        </span>
                      </td>

                      {/* Año */}
                      <td className="py-3.5 px-4 text-center text-foreground font-medium">
                        {v.annio || '—'}
                      </td>

                      {/* Tipo de Vehículo */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          <Tag className="w-3 h-3" />
                          {tipoNombre}
                        </span>
                      </td>

                      {/* Modelo / Marca */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-semibold text-foreground">
                            {modeloNombre}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {marcaNombre}
                          </span>
                        </div>
                      </td>

                      {/* Acciones: Ver Detalle del Vehículo */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/admin/vehiculos/listado/${v.id_vehiculo}/detalle`)
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer shadow-2xs"
                          title="Ver Detalle del vehículo y órdenes asociadas"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-500" />
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              disabled={validCurrentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Anterior
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-8 h-8 text-xs font-semibold rounded-lg transition-all cursor-pointer ${validCurrentPage === pageNum
                    ? 'bg-emerald-600 text-white shadow-sm font-bold'
                    : 'bg-card border border-border/80 text-foreground hover:bg-accent'
                  }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              disabled={validCurrentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
