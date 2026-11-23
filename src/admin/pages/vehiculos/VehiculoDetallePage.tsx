import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Car,
  User,
  Calendar,
  Tag,
  Eye,
  FileSpreadsheet,
  AlertTriangle,
} from 'lucide-react';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { getVehiculoByIdAction } from '../../actions/get-vehiculo-by-id.action';
import { getOrdenesAction } from '../../actions/get-ordenes.action';
import { getTiposOrdenesAction } from '../../actions/get-tipos-ordenes.action';
import type { OrdenItem } from '../../interfaces/orden.interface';

export const VehiculoDetallePage = () => {
  const { id } = useParams<{ id: string }>();
  const { goBack } = useAppNavigation();

  // 1. Consultar información del vehículo
  const { data: vehiculo, isLoading: isLoadingVehiculo } = useQuery({
    queryKey: ['vehiculo-item', id],
    queryFn: () => getVehiculoByIdAction(id!),
    enabled: !!id,
  });

  // 2. Consultar todas las órdenes
  const { data: ordenes = [], isLoading: isLoadingOrdenes } = useQuery({
    queryKey: ['ordenes-listado'],
    queryFn: getOrdenesAction,
  });

  // 3. Consultar tipos de órdenes para mapear nombres
  const { data: tiposOrdenes = [] } = useQuery({
    queryKey: ['tipos-ordenes-listado'],
    queryFn: getTiposOrdenesAction,
  });

  const tiposMap = useMemo(() => {
    const map = new Map<number, string>();
    tiposOrdenes.forEach((t) => map.set(t.id_tipo_orden, t.nombre));
    return map;
  }, [tiposOrdenes]);

  // 4. Filtrar y ordenar descendentemente por fecha_creacion las órdenes asociadas a este vehículo
  // La relación de una orden con un vehículo se realiza a través de orden.ingreso.id_vehiculo
  const ordenesVehiculo = useMemo(() => {
    if (!id) return [];
    const vehiculoIdNum = Number(id);

    const filtradas = ordenes.filter(
      (orden) => orden.ingreso && Number(orden.ingreso.id_vehiculo) === vehiculoIdNum
    );

    return filtradas.sort((a, b) => {
      const fechaA = a.fecha_creacion || '';
      const fechaB = b.fecha_creacion || '';
      if (fechaA < fechaB) return 1;
      if (fechaA > fechaB) return -1;
      return 0;
    });
  }, [ordenes, id]);

  // Paginación para la tabla de órdenes del vehículo (máximo 7 por página)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const totalPages = Math.ceil(ordenesVehiculo.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedOrdenes = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    return ordenesVehiculo.slice(startIndex, startIndex + itemsPerPage);
  }, [ordenesVehiculo, validCurrentPage, itemsPerPage]);

  // Helpers para clases de badges
  const getEstadoOperativoBadgeClass = (estado?: string) => {
    switch (estado) {
      case 'en_proceso':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'finalizada':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'anulada':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'en_espera':
      default:
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    }
  };

  const getEstadoAdministrativoBadgeClass = (estado?: string) => {
    switch (estado) {
      case 'pagada':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'parcialmente_pagada':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'pendiente_pago':
      default:
        return 'bg-muted text-muted-foreground border-border/80';
    }
  };

  if (isLoadingVehiculo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400" />
        <p className="text-sm text-muted-foreground animate-pulse">
          Cargando detalles del vehículo...
        </p>
      </div>
    );
  }

  if (!vehiculo) {
    return (
      <div className="bg-card p-8 rounded-2xl border border-border/80 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-foreground">Vehículo no encontrado</h2>
        <p className="text-sm text-muted-foreground">
          No se encontró la información del vehículo solicitado.
        </p>
        <button
          onClick={() => goBack('/admin/vehiculos/listado')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al listado
        </button>
      </div>
    );
  }

  const clienteNombre = vehiculo.cliente?.nombre || 'Sin cliente';
  const clienteCedula = vehiculo.cliente?.cedula || '';
  const modeloNombre = vehiculo.modelo?.nombre || 'N/A';
  const marcaNombre = vehiculo.modelo?.marca?.nombre || 'N/A';
  const tipoNombre = vehiculo.tipo_vehiculo?.nombre || 'N/A';

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 animate-fadeIn">
      {/* 1. BARRA SUPERIOR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <Car className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            Vehículo Placa: {vehiculo.placa}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Información general del vehículo e historial de órdenes de trabajo asociadas
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => goBack('/admin/vehiculos/listado')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
        </div>
      </div>

      {/* 2. TARJETA DE DATOS DEL VEHÍCULO */}
      <div className="bg-card p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-3">
          <Car className="w-5 h-5 text-blue-500" />
          Datos del Vehículo
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {/* Placa */}
          <div className="p-3.5 rounded-xl bg-background border border-border/80">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">
              Placa
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-bold bg-muted text-foreground border border-border/80 font-mono tracking-wider">
              {vehiculo.placa}
            </span>
          </div>

          {/* Año */}
          <div className="p-3.5 rounded-xl bg-background border border-border/80">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">
              Año
            </span>
            <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-500" />
              {vehiculo.annio || '—'}
            </span>
          </div>

          {/* Marca / Modelo */}
          <div className="p-3.5 rounded-xl bg-background border border-border/80">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">
              Marca y Modelo
            </span>
            <div className="text-sm font-semibold text-foreground">
              {marcaNombre} - {modeloNombre}
            </div>
          </div>

          {/* Tipo de Vehículo */}
          <div className="p-3.5 rounded-xl bg-background border border-border/80">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">
              Tipo de Vehículo
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Tag className="w-3 h-3" />
              {tipoNombre}
            </span>
          </div>

          {/* Propietario / Cliente */}
          <div className="p-3.5 rounded-xl bg-background border border-border/80">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">
              Propietario
            </span>
            <div className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-500" />
              {clienteNombre}
            </div>
            {clienteCedula && (
              <span className="text-xs text-muted-foreground block mt-0.5">
                C.I. {clienteCedula}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. TABLA DE ÓRDENES ASOCIADAS (Ordenadas descendentemente por fecha_creacion) */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-500" />
              Historial de Órdenes Asociadas
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Órdenes de trabajo vinculadas a este vehículo (ordenadas de más reciente a más antigua)
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            {ordenesVehiculo.length} {ordenesVehiculo.length === 1 ? 'orden' : 'órdenes'}
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border/80">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                <th scope="col" className="py-3 px-4 text-center">
                  Id Orden
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  Tipo de Orden
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  Fecha Creación
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  Estado Operativo
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  Estado Administrativo
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  Monto Total
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  Reingreso Falla
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoadingOrdenes ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                      Cargando órdenes del vehículo...
                    </div>
                  </td>
                </tr>
              ) : paginatedOrdenes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    <FileSpreadsheet className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground">
                      No hay órdenes registradas para este vehículo
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      Las órdenes de trabajo asociadas a los ingresos de este vehículo aparecerán listadas aquí.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedOrdenes.map((orden: OrdenItem) => {
                  const tipoOrdenNombre =
                    orden.tipo_orden?.nombre ||
                    tiposMap.get(orden.id_tipo_orden) ||
                    `Tipo #${orden.id_tipo_orden}`;
                  const fechaCreacionSolo = orden.fecha_creacion
                    ? orden.fecha_creacion.substring(0, 10)
                    : '—';
                  const montoTotal = Number(orden.monto_total || 0).toFixed(2);
                  const isFalla = Boolean(orden.ingreso?.reingreso_por_falla);

                  return (
                    <tr
                      key={orden.id_orden}
                      className="hover:bg-accent/40 transition-colors"
                    >
                      {/* Id Orden */}
                      <td className="py-3.5 px-4 font-mono font-bold text-foreground text-center">
                        #{orden.id_orden}
                      </td>

                      {/* Tipo de Orden */}
                      <td className="py-3.5 px-4 text-center font-medium capitalize text-foreground">
                        {tipoOrdenNombre}
                      </td>

                      {/* Fecha Creación */}
                      <td className="py-3.5 px-4 text-center text-foreground font-medium">
                        {fechaCreacionSolo}
                      </td>

                      {/* Estado Operativo */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getEstadoOperativoBadgeClass(
                            orden.estado_operativo
                          )}`}
                        >
                          {orden.estado_operativo}
                        </span>
                      </td>

                      {/* Estado Administrativo */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getEstadoAdministrativoBadgeClass(
                            orden.estado_administrativo
                          )}`}
                        >
                          {orden.estado_administrativo || 'pendiente_pago'}
                        </span>
                      </td>

                      {/* Monto Total */}
                      <td className="py-3.5 px-4 text-center font-bold text-foreground">
                        ${montoTotal}
                      </td>

                      {/* Reingreso Falla */}
                      <td className="py-3.5 px-4 text-center">
                        {isFalla ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            Sí
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">No</span>
                        )}
                      </td>

                      {/* Acciones: Ver detalle de la orden */}
                      <td className="py-3.5 px-4 text-center">
                        <Link
                          to={`/admin/taller/ordenes/${orden.id_orden}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer shadow-2xs"
                          title="Ver Detalle de la orden"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-500" />
                          Ver Detalle
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación de la tabla de órdenes */}
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
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
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
