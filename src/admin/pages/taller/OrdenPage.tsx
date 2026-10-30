import { useState, useMemo } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Filter,
  Eye,
  Ban,
  CheckCircle2,
  X,
  SquareText,
} from 'lucide-react';

import { getOrdenesAction } from '../../actions/get-ordenes.action';
import { getTiposOrdenesAction } from '../../actions/get-tipos-ordenes.action';
import { getClientesAction } from '../../actions/get-clientes.action';
import { useOrdenMutation } from '../../hooks/useOrdenMutation';
import type { OrdenItem } from '../../interfaces/orden.interface';

export const OrdenPage = () => {
  // 1. Consultar listado de órdenes
  const { data: ordenes = [], isLoading } = useQuery({
    queryKey: ['ordenes-listado'],
    queryFn: getOrdenesAction,
  });

  // 2. Catálogos auxiliares para resolución de nombres si no vienen precargados en la relación
  const { data: tiposOrdenes = [] } = useQuery({
    queryKey: ['tipos-ordenes-listado'],
    queryFn: getTiposOrdenesAction,
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes-listado'],
    queryFn: getClientesAction,
  });

  // Mapas para resolución O(1)
  const tiposOrdenesMap = useMemo(() => {
    const map = new Map<number, string>();
    tiposOrdenes.forEach((t) => map.set(t.id_tipo_orden, t.nombre));
    return map;
  }, [tiposOrdenes]);

  const clientesMap = useMemo(() => {
    const map = new Map<number, { nombre: string; cedula: string }>();
    clientes.forEach((c) =>
      map.set(c.id_cliente, { nombre: c.nombre, cedula: c.cedula })
    );
    return map;
  }, [clientes]);

  // Hook de mutaciones para órdenes (incluye anularOrden y finalizarOrden)
  const { anularOrden, isAnulandoOrden, finalizarOrden, isFinalizandoOrden } =
    useOrdenMutation();

  // Estados de filtros según el boceto:
  // "opciones de filtrado por nombre/cedula, id_orden, estado operativo, estado administrativo, fecha desde y fecha hasta, tipo de orden"
  const [nombreCedulaFilter, setNombreCedulaFilter] = useState('');
  const [idOrdenFilter, setIdOrdenFilter] = useState('');
  const [tipoOrdenFilter, setTipoOrdenFilter] = useState('');
  const [estadoOperativoFilter, setEstadoOperativoFilter] = useState('');
  const [estadoAdministrativoFilter, setEstadoAdministrativoFilter] = useState('');
  const [fechaDesdeFilter, setFechaDesdeFilter] = useState('');
  const [fechaHastaFilter, setFechaHastaFilter] = useState('');

  // Paginación: Máximo 7 filas por página según el boceto
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Modal para Anular Orden
  const [ordenParaAnular, setOrdenParaAnular] = useState<OrdenItem | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');

  // Modal para Finalizar Orden
  const [ordenParaFinalizar, setOrdenParaFinalizar] = useState<OrdenItem | null>(null);

  // Helper para resolver los datos visuales de una orden
  const getOrdenResolvedData = (orden: OrdenItem) => {
    // Cliente
    const clienteAux = clientesMap.get(orden.id_cliente);
    const clienteNombre = orden.cliente?.nombre || clienteAux?.nombre || 'Sin cliente';
    const clienteCedula = orden.cliente?.cedula || clienteAux?.cedula || '';

    // Tipo de Orden
    const tipoOrdenNombre =
      orden.tipo_orden?.nombre ||
      tiposOrdenesMap.get(orden.id_tipo_orden) ||
      `Tipo #${orden.id_tipo_orden}`;

    // Fechas
    const fechaFinTentativaSolo = orden.fecha_fin_tentativa
      ? orden.fecha_fin_tentativa.substring(0, 10)
      : '—';

    const fechaCreacionSolo = orden.fecha_creacion
      ? orden.fecha_creacion.substring(0, 10)
      : '—';

    // Montos
    const montoTotal = Number(orden.monto_total || 0).toFixed(2);
    const montoPendiente =
      orden.monto_pendiente !== undefined && orden.monto_pendiente !== null
        ? Number(orden.monto_pendiente).toFixed(2)
        : Number(orden.monto_total || 0).toFixed(2);

    return {
      clienteNombre,
      clienteCedula,
      tipoOrdenNombre,
      fechaFinTentativaSolo,
      fechaCreacionSolo,
      montoTotal,
      montoPendiente,
    };
  };

  // Filtrado reactivo de órdenes
  const filteredOrdenes = useMemo(() => {
    return ordenes.filter((orden: OrdenItem) => {
      const resolved = getOrdenResolvedData(orden);

      // 1. Filtro por ID orden
      if (
        idOrdenFilter.trim() &&
        !String(orden.id_orden).includes(idOrdenFilter.trim())
      ) {
        return false;
      }

      // 2. Filtro por nombre o cédula del cliente
      if (nombreCedulaFilter.trim()) {
        const queryCli = nombreCedulaFilter.trim().toLowerCase();
        if (
          !resolved.clienteNombre.toLowerCase().includes(queryCli) &&
          !resolved.clienteCedula.toLowerCase().includes(queryCli)
        ) {
          return false;
        }
      }

      // 3. Filtro por tipo de orden
      if (tipoOrdenFilter.trim()) {
        const queryTipo = tipoOrdenFilter.trim().toLowerCase();
        if (!resolved.tipoOrdenNombre.toLowerCase().includes(queryTipo)) {
          return false;
        }
      }

      // 4. Filtro por estado operativo
      if (
        estadoOperativoFilter.trim() &&
        orden.estado_operativo !== estadoOperativoFilter
      ) {
        return false;
      }

      // 5. Filtro por estado administrativo
      if (
        estadoAdministrativoFilter.trim() &&
        orden.estado_administrativo !== estadoAdministrativoFilter
      ) {
        return false;
      }

      // 6. Filtro fecha desde (comparado contra fecha_creacion)
      if (fechaDesdeFilter) {
        if (!resolved.fechaCreacionSolo || resolved.fechaCreacionSolo < fechaDesdeFilter) {
          return false;
        }
      }

      // 7. Filtro fecha hasta (comparado contra fecha_creacion)
      if (fechaHastaFilter) {
        if (!resolved.fechaCreacionSolo || resolved.fechaCreacionSolo > fechaHastaFilter) {
          return false;
        }
      }

      return true;
    });
  }, [
    ordenes,
    idOrdenFilter,
    nombreCedulaFilter,
    tipoOrdenFilter,
    estadoOperativoFilter,
    estadoAdministrativoFilter,
    fechaDesdeFilter,
    fechaHastaFilter,
    clientesMap,
    tiposOrdenesMap,
  ]);

  // Ordenar el arreglo FilteredOrdenes por el campo last_update de forma descendente
  filteredOrdenes.sort((a: OrdenItem, b: OrdenItem) => {
    const timeA = a.last_update ?? '';
    const timeB = b.last_update ?? '';
    if (timeA < timeB) return 1;
    if (timeA > timeB) return -1;
    return 0;
  });

  // Paginación reactiva
  const totalPages = Math.ceil(filteredOrdenes.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedOrdenes = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    return filteredOrdenes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrdenes, validCurrentPage, itemsPerPage]);

  // Manejo de confirmación de anulación
  const handleConfirmAnulacion = () => {
    if (!ordenParaAnular) return;
    if (!motivoAnulacion.trim()) return;

    anularOrden(
      {
        id: ordenParaAnular.id_orden,
        payload: { motivo_anulacion: motivoAnulacion.trim() },
      },
      {
        onSuccess: () => {
          setOrdenParaAnular(null);
          setMotivoAnulacion('');
        },
      }
    );
  };

  // Manejo de finalización de orden
  const handleConfirmFinalizar = () => {
    if (!ordenParaFinalizar) return;

    finalizarOrden(ordenParaFinalizar.id_orden, {
      onSuccess: () => {
        setOrdenParaFinalizar(null);
      },
    });
  };

  // Clases visuales para badges de estado operativo
  const getEstadoOperativoBadgeClass = (estado?: string) => {
    switch (estado) {
      case 'en_espera':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'en_proceso':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'finalizada':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'anulada':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border/80';
    }
  };

  // Clases visuales para badges de estado administrativo
  const getEstadoAdministrativoBadgeClass = (estado?: string) => {
    switch (estado) {
      case 'pagada':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'parcialmente_pagada':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'pendiente_pago':
      default:
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. BARRA SUPERIOR: Título y Volver */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Listado de Ordenes
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Registro, seguimiento y control de órdenes de trabajo del taller
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/taller"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </div>
      </div>

      {/* 2. OPCIONES DE FILTRADO (según boceto) */}
      <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Filter className="w-3.5 h-3.5 text-blue-500" />
            Opciones de Filtrado
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Nombre / Cédula */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Nombre / Cédula
            </label>
            <input
              type="text"
              placeholder="Ej: Juan, 30433366..."
              value={nombreCedulaFilter}
              onChange={(e) => {
                setNombreCedulaFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          {/* ID Orden */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              ID Orden
            </label>
            <input
              type="text"
              placeholder="Ej: 1, 2..."
              value={idOrdenFilter}
              onChange={(e) => {
                setIdOrdenFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Tipo de Orden */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Tipo de Orden
            </label>
            <select
              value={tipoOrdenFilter}
              onChange={(e) => {
                setTipoOrdenFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="">Todos los tipos...</option>
              {tiposOrdenes.map((tipo) => (
                <option key={tipo.id_tipo_orden} value={tipo.nombre}>
                  {tipo.nombre.charAt(0).toUpperCase() + tipo.nombre.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Estado Operativo */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Estado Operativo
            </label>
            <select
              value={estadoOperativoFilter}
              onChange={(e) => {
                setEstadoOperativoFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="">Todos los estados operativos...</option>
              <option value="en_espera">En Espera</option>
              <option value="en_proceso">En Proceso</option>
              <option value="finalizada">Finalizada</option>
              <option value="anulada">Anulada</option>
            </select>
          </div>

          {/* Estado Administrativo */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Estado Administrativo
            </label>
            <select
              value={estadoAdministrativoFilter}
              onChange={(e) => {
                setEstadoAdministrativoFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="">Todos los estados administrativos...</option>
              <option value="pendiente_pago">Pendiente Pago</option>
              <option value="parcialmente_pagada">Parcialmente Pagada</option>
              <option value="pagada">Pagada</option>
            </select>
          </div>

          {/* Fecha Desde */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Fecha Desde
            </label>
            <input
              type="date"
              value={fechaDesdeFilter}
              onChange={(e) => {
                setFechaDesdeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer"
            />
          </div>

          {/* Fecha Hasta */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Fecha Hasta
            </label>
            <input
              type="date"
              value={fechaHastaFilter}
              onChange={(e) => {
                setFechaHastaFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 3. TABLA DE ORDENES (Máximo 7 filas por página según boceto) */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                <th scope="col" className="py-3 px-4 text-center">
                  id_orden
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  nombre / cedula
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  tipo de orden
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  fecha finalizacion tentativa
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  fecha creacion
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  monto total
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  monto pendiente
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  estado operativo
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  estado administrativo
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                      Cargando listado de órdenes...
                    </div>
                  </td>
                </tr>
              ) : paginatedOrdenes.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-muted-foreground">
                    <SquareText className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground">
                      No se encontraron órdenes
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      No hay registros que coincidan con los filtros aplicados o no hay órdenes registradas.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedOrdenes.map((orden) => {
                  const resolved = getOrdenResolvedData(orden);
                  // "El boton de 'Anular' solo sale si el estado_administrativo = 'pendiente_pago' y estado_operativo != 'anulada'"
                  const canAnular =
                    orden.estado_administrativo === 'pendiente_pago' &&
                    orden.estado_operativo !== 'anulada';

                  return (
                    <tr
                      key={orden.id_orden}
                      className="hover:bg-accent/40 transition-colors"
                    >
                      {/* id_orden */}
                      <td className="py-3.5 px-4 font-mono font-bold text-foreground text-center">
                        #{orden.id_orden}
                      </td>

                      {/* nombre / cedula */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-semibold text-foreground">
                            {resolved.clienteNombre}
                          </span>
                          {resolved.clienteCedula && (
                            <span className="text-xs text-muted-foreground font-mono">
                              {resolved.clienteCedula}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* tipo de orden */}
                      <td className="py-3.5 px-4 text-center font-medium capitalize text-foreground">
                        {resolved.tipoOrdenNombre}
                      </td>

                      {/* fecha finalizacion tentativa */}
                      <td className="py-3.5 px-4 text-center text-foreground font-medium">
                        {resolved.fechaFinTentativaSolo}
                      </td>

                      {/* fecha creacion */}
                      <td className="py-3.5 px-4 text-center text-foreground font-medium">
                        {resolved.fechaCreacionSolo}
                      </td>

                      {/* monto total */}
                      <td className="py-3.5 px-4 text-center font-bold text-foreground">
                        {resolved.montoTotal}
                      </td>

                      {/* monto pendiente */}
                      <td className="py-3.5 px-4 text-center font-bold text-blue-600 dark:text-blue-400">
                        {resolved.montoPendiente}
                      </td>

                      {/* estado operativo */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getEstadoOperativoBadgeClass(
                            orden.estado_operativo
                          )}`}
                        >
                          {orden.estado_operativo}
                        </span>
                      </td>

                      {/* estado administrativo */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getEstadoAdministrativoBadgeClass(
                            orden.estado_administrativo
                          )}`}
                        >
                          {orden.estado_administrativo || 'pendiente_pago'}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {orden.estado_operativo === 'en_proceso' && (
                            <button
                              type="button"
                              onClick={() => setOrdenParaFinalizar(orden)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-card border border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 transition-colors cursor-pointer shadow-2xs"
                              title="Finalizar orden"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Finalizar
                            </button>
                          )}

                          {canAnular && (
                            <button
                              type="button"
                              onClick={() => {
                                setOrdenParaAnular(orden);
                                setMotivoAnulacion('');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-card border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shadow-2xs"
                              title="Anular orden"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              Anular
                            </button>
                          )}

                          <Link
                            to={`/admin/taller/ordenes/${orden.id_orden}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer shadow-2xs"
                            title="Ver Detalle de la orden"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-500" />
                            Ver Detalle
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. PAGINACIÓN (Anterior, 1, 2, ..., Siguiente) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
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

      {/* MODAL: Anular Orden de Trabajo */}
      {ordenParaAnular && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-card border border-border/80 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/80">
              <h3 className="text-lg font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <Ban className="w-5 h-5" />
                Anular Orden #{ordenParaAnular.id_orden}
              </h3>
              <button
                type="button"
                onClick={() => setOrdenParaAnular(null)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-foreground">
              ¿Estás seguro de que deseas anular esta orden de trabajo? Esta acción anulará sus servicios asociados y no se puede deshacer.
            </p>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Motivo de anulación <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={motivoAnulacion}
                onChange={(e) => setMotivoAnulacion(e.target.value)}
                placeholder="Ingresa la razón por la cual se anula la orden..."
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                required
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-border/80">
              <button
                type="button"
                onClick={() => setOrdenParaAnular(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!motivoAnulacion.trim() || isAnulandoOrden}
                onClick={handleConfirmAnulacion}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isAnulandoOrden ? 'Anulando...' : 'Confirmar Anulación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Finalizar Orden de Trabajo */}
      {ordenParaFinalizar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-card border border-border/80 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/80">
              <h3 className="text-lg font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Finalizar Orden #{ordenParaFinalizar.id_orden}
              </h3>
              <button
                type="button"
                onClick={() => setOrdenParaFinalizar(null)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-foreground">
              ¿Estás seguro de que deseas marcar esta orden de trabajo como <strong className="text-purple-600 dark:text-purple-400">Finalizada</strong>?
            </p>

            <div className="p-3 bg-muted/40 rounded-xl border border-border/60 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID Orden:</span>
                <span className="font-bold text-foreground">#{ordenParaFinalizar.id_orden}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cliente:</span>
                <span className="font-semibold text-foreground">
                  {getOrdenResolvedData(ordenParaFinalizar).clienteNombre}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monto Total:</span>
                <span className="font-bold text-foreground">
                  {Number(ordenParaFinalizar.monto_total || 0).toFixed(2)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Recuerda que todos los servicios del taller asociados deben encontrarse finalizados para poder completar la orden.
            </p>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-border/80">
              <button
                type="button"
                onClick={() => setOrdenParaFinalizar(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isFinalizandoOrden}
                onClick={handleConfirmFinalizar}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isFinalizandoOrden ? 'Finalizando...' : 'Confirmar Finalización'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdenPage;
