import { useState, useMemo } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  Ban,
  Calendar,
  X,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { getPresupuestosAction } from '../../actions/get-presupuestos.action';
import { getTiposOrdenesAction } from '../../actions/get-tipos-ordenes.action';
import { usePresupuestoMutation } from '../../hooks/usePresupuestoMutation';
import type { PresupuestoItem } from '../../interfaces/presupuesto.interface';

export const PresupuestoPage = () => {
  // 1. Obtener listado de presupuestos
  const { data: presupuestos = [], isLoading } = useQuery({
    queryKey: ['presupuestos-listado'],
    queryFn: getPresupuestosAction,
  });

  // 2. Catálogo auxiliar de tipos de ordenes
  const { data: tiposOrdenes = [] } = useQuery({
    queryKey: ['tipos-ordenes-listado'],
    queryFn: getTiposOrdenesAction,
  });

  // Mapa de tipo orden id -> nombre
  const tiposOrdenesMap = useMemo(() => {
    const map = new Map<number, string>();
    tiposOrdenes.forEach((t) => map.set(t.id_tipo_orden, t.nombre));
    return map;
  }, [tiposOrdenes]);

  // Hook de mutaciones para presupuestos (Aceptar, Rechazar, Anular)
  const {
    aceptarPresupuesto,
    isAceptandoPresupuesto,
    rechazarPresupuesto,
    isRechazandoPresupuesto,
    anularPresupuesto,
    isAnulandoPresupuesto,
  } = usePresupuestoMutation();

  // Estados de filtros según el boceto:
  // "opcion de filtrado por num_presupuesto, tipo de orden, tipo, estado, fecha desde y fecha hasta"
  const [numPresupuestoFilter, setNumPresupuestoFilter] = useState('');
  const [tipoOrdenFilter, setTipoOrdenFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [fechaDesdeFilter, setFechaDesdeFilter] = useState('');
  const [fechaHastaFilter, setFechaHastaFilter] = useState('');

  // Paginación: Máximo 7 filas por página según el boceto
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Modales
  // 1. Modal Aceptar Presupuesto (solicita fecha_fin_tentativa si es inicial)
  const [presupuestoParaAceptar, setPresupuestoParaAceptar] =
    useState<PresupuestoItem | null>(null);
  const [fechaFinTentativa, setFechaFinTentativa] = useState('');

  // 2. Modal Rechazar Presupuesto (confirmación)
  const [presupuestoParaRechazar, setPresupuestoParaRechazar] =
    useState<PresupuestoItem | null>(null);

  // 3. Modal Anular Presupuesto (requiere motivo de anulación)
  const [presupuestoParaAnular, setPresupuestoParaAnular] =
    useState<PresupuestoItem | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');

  // Helper para resolver los datos de visualización de cada fila
  const getPresupuestoResolvedData = (presupuesto: PresupuestoItem) => {
    // num_presupuesto (e.g. COT-00026 o PRE-00001)
    const numPresupuesto = presupuesto.num_presupuesto
      ? String(presupuesto.num_presupuesto)
      : `COT-${String(presupuesto.id_presupuesto).padStart(5, '0')}`;

    // tipo de orden
    const tipoOrdenNombre =
      presupuesto.orden?.tipoOrden?.nombre ||
      presupuesto.orden?.tipo_orden?.nombre ||
      presupuesto.ingreso?.tipoOrden?.nombre ||
      presupuesto.ingreso?.tipo_orden?.nombre ||
      (presupuesto.orden?.id_tipo_orden
        ? tiposOrdenesMap.get(presupuesto.orden.id_tipo_orden)
        : undefined) ||
      (presupuesto.ingreso?.id_tipo_orden
        ? tiposOrdenesMap.get(presupuesto.ingreso.id_tipo_orden)
        : undefined) ||
      'No especificado';

    // tipo (inicial | extra)
    const tipo = presupuesto.tipo || 'inicial';

    // fechas (fecha_creacion, fecha_vencimiento)
    const fechaCreacion = presupuesto.fecha_creacion || '—';
    const fechaVencimiento = presupuesto.fecha_vencimiento || '—';

    // estado normalizado
    const estado = (presupuesto.estado || 'pendiente').toLowerCase();

    return {
      numPresupuesto,
      tipoOrdenNombre,
      tipo,
      fechaCreacion,
      fechaVencimiento,
      estado,
    };
  };

  // Filtrado de presupuestos
  const filteredPresupuestos = useMemo(() => {
    return presupuestos.filter((item) => {
      const resolved = getPresupuestoResolvedData(item);

      // Filtro por num_presupuesto
      if (numPresupuestoFilter.trim()) {
        const query = numPresupuestoFilter.trim().toLowerCase();
        const matchesNum = resolved.numPresupuesto.toLowerCase().includes(query);
        const matchesId = String(item.id_presupuesto).includes(query);
        if (!matchesNum && !matchesId) return false;
      }

      // Filtro por tipo de orden
      if (tipoOrdenFilter) {
        if (
          resolved.tipoOrdenNombre.toLowerCase() !==
          tipoOrdenFilter.toLowerCase()
        ) {
          return false;
        }
      }

      // Filtro por tipo (inicial, extra)
      if (tipoFilter) {
        if (resolved.tipo.toLowerCase() !== tipoFilter.toLowerCase()) {
          return false;
        }
      }

      // Filtro por estado (pendiente, aceptada/aceptado, rechazada/rechazado, anulada/anulado)
      if (estadoFilter) {
        const currentEstado = resolved.estado;
        const target = estadoFilter.toLowerCase();
        const isMatch =
          currentEstado === target ||
          (target === 'aceptada' && currentEstado === 'aceptado') ||
          (target === 'aceptado' && currentEstado === 'aceptada') ||
          (target === 'rechazada' && currentEstado === 'rechazado') ||
          (target === 'rechazado' && currentEstado === 'rechazada') ||
          (target === 'anulada' && currentEstado === 'anulado') ||
          (target === 'anulado' && currentEstado === 'anulada');

        if (!isMatch) return false;
      }

      // Filtro por fecha desde (comparado con fecha_creacion)
      if (fechaDesdeFilter) {
        const itemDateStr = item.fecha_creacion
          ? item.fecha_creacion.substring(0, 10)
          : '';
        if (itemDateStr && itemDateStr < fechaDesdeFilter) return false;
      }

      // Filtro por fecha hasta (comparado con fecha_creacion)
      if (fechaHastaFilter) {
        const itemDateStr = item.fecha_creacion
          ? item.fecha_creacion.substring(0, 10)
          : '';
        if (itemDateStr && itemDateStr > fechaHastaFilter) return false;
      }

      return true;
    });
  }, [
    presupuestos,
    numPresupuestoFilter,
    tipoOrdenFilter,
    tipoFilter,
    estadoFilter,
    fechaDesdeFilter,
    fechaHastaFilter,
    tiposOrdenesMap,
  ]);

  // Paginación (Máximo 7 filas por página)
  const totalPages = Math.ceil(filteredPresupuestos.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPresupuestos = filteredPresupuestos.slice(startIndex, endIndex);

  // Manejo de apertura de PDF en nueva pestaña
  const handleVerDetallePdf = (presupuesto: PresupuestoItem) => {
    const rawPdf = presupuesto.pdf_presupuesto;
    let pdfUrl = '';

    const imgBase =
      import.meta.env.VITE_IMG_URL || 'http://localhost:8000/storage';

    if (rawPdf) {
      if (rawPdf.startsWith('http://') || rawPdf.startsWith('https://')) {
        pdfUrl = rawPdf;
      } else {
        const cleanPath = rawPdf.replace(/^storage\//, '').replace(/^\//, '');
        pdfUrl = `${imgBase.replace(/\/$/, '')}/${cleanPath}`;
      }
    } else {
      // Fallback si no tiene ruta guardada
      const num = presupuesto.num_presupuesto || presupuesto.id_presupuesto;
      pdfUrl = `${imgBase.replace(/\/$/, '')}/presupuestos/presupuesto_${num}.pdf`;
    }

    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  // Manejo de Aceptar Presupuesto
  const handleConfirmAceptar = async () => {
    if (!presupuestoParaAceptar) return;

    if (presupuestoParaAceptar.tipo === 'inicial' && !fechaFinTentativa) {
      toast.error('Debe indicar la fecha tentativa de culminación');
      return;
    }

    try {
      await aceptarPresupuesto({
        id: presupuestoParaAceptar.id_presupuesto,
        payload:
          presupuestoParaAceptar.tipo === 'inicial'
            ? { fecha_fin_tentativa: fechaFinTentativa }
            : undefined,
      });
      setPresupuestoParaAceptar(null);
      setFechaFinTentativa('');
    } catch {
      // Error manejado en hook
    }
  };

  // Manejo de Rechazar Presupuesto
  const handleConfirmRechazar = async () => {
    if (!presupuestoParaRechazar) return;

    try {
      await rechazarPresupuesto(presupuestoParaRechazar.id_presupuesto);
      setPresupuestoParaRechazar(null);
    } catch {
      // Error manejado en hook
    }
  };

  // Manejo de Anular Presupuesto
  const handleConfirmAnular = async () => {
    if (!presupuestoParaAnular) return;

    if (!motivoAnulacion.trim()) {
      toast.error('Debe ingresar el motivo de la anulación');
      return;
    }

    try {
      await anularPresupuesto({
        id: presupuestoParaAnular.id_presupuesto,
        payload: { motivo_anulacion: motivoAnulacion.trim() },
      });
      setPresupuestoParaAnular(null);
      setMotivoAnulacion('');
    } catch {
      // Error manejado en hook
    }
  };

  // Renderizado del badge de Estado
  const renderEstadoBadge = (estado: string) => {
    const norm = estado.toLowerCase();
    switch (norm) {
      case 'pendiente':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pendiente
          </span>
        );
      case 'aceptada':
      case 'aceptado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Aceptada
          </span>
        );
      case 'rechazada':
      case 'rechazado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
            Rechazada
          </span>
        );
      case 'anulada':
      case 'anulado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            <Ban className="w-3.5 h-3.5 text-slate-500" />
            Anulado
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
            {estado}
          </span>
        );
    }
  };

  // Renderizado del badge de Tipo
  const renderTipoBadge = (tipo: string) => {
    const norm = tipo.toLowerCase();
    if (norm === 'extra') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20">
          Extra
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
        Inicial
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 1. ENCABEZADO: Título y Botón "Volver" fiel al boceto */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Listado de Presupuestos
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Consulta, aprobación y detalle en PDF de cotizaciones del taller
          </p>
        </div>

        <Link
          to="/admin/taller"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-card border border-border/80 text-foreground hover:bg-accent hover:border-border transition-all shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </Link>
      </div>

      {/* 2. CARD DE FILTROS fiel al boceto */}
      <div className="bg-card rounded-2xl border border-border/80 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs sm:text-sm font-bold text-foreground">
              Opciones de filtrado
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Filtro: num_presupuesto */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              num_presupuesto
            </label>
            <input
              type="text"
              placeholder="Ej: COT-00026..."
              value={numPresupuestoFilter}
              onChange={(e) => {
                setNumPresupuestoFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Filtro: tipo de orden */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              tipo de orden
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

          {/* Filtro: tipo */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              tipo
            </label>
            <select
              value={tipoFilter}
              onChange={(e) => {
                setTipoFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="">Todos los tipos...</option>
              <option value="inicial">Inicial</option>
              <option value="extra">Extra</option>
            </select>
          </div>

          {/* Filtro: estado */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              estado
            </label>
            <select
              value={estadoFilter}
              onChange={(e) => {
                setEstadoFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="">Todos los estados...</option>
              <option value="pendiente">Pendiente</option>
              <option value="aceptada">Aceptada</option>
              <option value="rechazada">Rechazada</option>
              <option value="anulada">Anulada</option>
            </select>
          </div>

          {/* Filtro: fecha desde */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              fecha desde
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

          {/* Filtro: fecha hasta */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              fecha hasta
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

      {/* 3. TABLA DE PRESUPUESTOS (Máximo 7 filas por página según el boceto) */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                <th scope="col" className="py-3 px-4 text-center">
                  num_presupuesto
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  tipo de orden
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  tipo
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  fecha_creacion
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  fecha_vencimiento
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  estado
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs">Cargando presupuestos...</span>
                    </div>
                  </td>
                </tr>
              ) : currentPresupuestos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="w-8 h-8 text-muted-foreground/50" />
                      <span className="text-sm font-medium">
                        No se encontraron presupuestos registrados con los filtros aplicados
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                currentPresupuestos.map((item) => {
                  const resolved = getPresupuestoResolvedData(item);
                  const isPendiente = resolved.estado === 'pendiente';

                  return (
                    <tr
                      key={item.id_presupuesto}
                      className="hover:bg-muted/40 transition-colors"
                    >
                      {/* num_presupuesto */}
                      <td className="py-3 px-4 text-center font-bold text-foreground whitespace-nowrap">
                        {resolved.numPresupuesto}
                      </td>

                      {/* tipo de orden */}
                      <td className="py-3 px-4 text-center capitalize text-foreground whitespace-nowrap">
                        {resolved.tipoOrdenNombre}
                      </td>

                      {/* tipo */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {renderTipoBadge(resolved.tipo)}
                      </td>

                      {/* fecha_creacion */}
                      <td className="py-3 px-4 text-center text-muted-foreground whitespace-nowrap text-xs">
                        {resolved.fechaCreacion}
                      </td>

                      {/* fecha_vencimiento */}
                      <td className="py-3 px-4 text-center text-muted-foreground whitespace-nowrap text-xs">
                        {resolved.fechaVencimiento}
                      </td>

                      {/* estado */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {renderEstadoBadge(resolved.estado)}
                      </td>

                      {/* acciones */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {isPendiente && (
                            <>
                              {/* Botón Aceptar */}
                              <button
                                type="button"
                                onClick={() => {
                                  setPresupuestoParaAceptar(item);
                                  setFechaFinTentativa('');
                                }}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer shadow-2xs"
                                title="Aceptar Presupuesto"
                              >
                                Aceptar
                              </button>

                              {/* Botón Rechazar */}
                              <button
                                type="button"
                                onClick={() => setPresupuestoParaRechazar(item)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-card border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer shadow-2xs"
                                title="Rechazar Presupuesto"
                              >
                                Rechazar
                              </button>

                              {/* Botón Anular */}
                              <button
                                type="button"
                                onClick={() => {
                                  setPresupuestoParaAnular(item);
                                  setMotivoAnulacion('');
                                }}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer shadow-2xs"
                                title="Anular Presupuesto"
                              >
                                Anular
                              </button>
                            </>
                          )}

                          {/* Botón Ver Detalle (Abre PDF en nueva pestaña) */}
                          <button
                            type="button"
                            onClick={() => handleVerDetallePdf(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent hover:border-border transition-colors cursor-pointer shadow-2xs"
                            title="Ver Detalle del PDF en nueva pestaña"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver Detalle</span>
                          </button>
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

      {/* 4. PAGINACIÓN FIEL AL BOCETO (Anterior, 1, 2, ..., Siguiente) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            disabled={validCurrentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Anterior
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              type="button"
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
            type="button"
            disabled={validCurrentPage === totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* MODAL 1: Aceptar Presupuesto */}
      {presupuestoParaAceptar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-card border border-border/80 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/80">
              <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Aceptar Presupuesto{' '}
                {presupuestoParaAceptar.num_presupuesto ||
                  `#${presupuestoParaAceptar.id_presupuesto}`}
              </h3>
              <button
                type="button"
                onClick={() => setPresupuestoParaAceptar(null)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground">
              {presupuestoParaAceptar.tipo === 'inicial'
                ? 'Al aceptar este presupuesto inicial, se generará formalmente la Orden de Trabajo correspondiente.'
                : 'Al aceptar este presupuesto extra, los repuestos y servicios solicitados se incorporarán a la Orden de Trabajo.'}
            </p>

            {presupuestoParaAceptar.tipo === 'inicial' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  Fecha tentativa de culminación *
                </label>
                <input
                  type="date"
                  value={fechaFinTentativa}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setFechaFinTentativa(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer"
                />
                <span className="text-[11px] text-muted-foreground">
                  Estimación requerida para programar la orden de trabajo
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
              <button
                type="button"
                onClick={() => setPresupuestoParaAceptar(null)}
                disabled={isAceptandoPresupuesto}
                className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAceptar}
                disabled={
                  isAceptandoPresupuesto ||
                  (presupuestoParaAceptar.tipo === 'inicial' &&
                    !fechaFinTentativa)
                }
                className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
              >
                {isAceptandoPresupuesto ? 'Aceptando...' : 'Confirmar Aceptación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Rechazar Presupuesto */}
      {presupuestoParaRechazar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-card border border-border/80 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/80">
              <h3 className="text-lg font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Rechazar Presupuesto{' '}
                {presupuestoParaRechazar.num_presupuesto ||
                  `#${presupuestoParaRechazar.id_presupuesto}`}
              </h3>
              <button
                type="button"
                onClick={() => setPresupuestoParaRechazar(null)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>


            <p className="text-xs sm:text-sm text-muted-foreground">
              ¿Estás seguro de que deseas marcar como <strong>rechazado</strong>{' '}
              este presupuesto?
              {presupuestoParaRechazar.tipo === 'inicial' ? (
                <>{' '}El ingreso vehicular volverá a quedar disponible en estado{' '}
                  <em>esperando orden</em>.</>
              ) : (
                <>{' '}Al tratarse de un presupuesto extra, la orden de trabajo vinculada no se verá afectada.</>
              )}
            </p>


            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
              <button
                type="button"
                onClick={() => setPresupuestoParaRechazar(null)}
                disabled={isRechazandoPresupuesto}
                className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmRechazar}
                disabled={isRechazandoPresupuesto}
                className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
              >
                {isRechazandoPresupuesto ? 'Rechazando...' : 'Confirmar Rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Anular Presupuesto */}
      {presupuestoParaAnular && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-card border border-border/80 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/80">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-500" />
                Anular Presupuesto{' '}
                {presupuestoParaAnular.num_presupuesto ||
                  `#${presupuestoParaAnular.id_presupuesto}`}
              </h3>
              <button
                type="button"
                onClick={() => setPresupuestoParaAnular(null)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground">
                Motivo de la anulación <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={3}
                value={motivoAnulacion}
                onChange={(e) => setMotivoAnulacion(e.target.value)}
                placeholder="Explique el motivo por el cual se anula la cotización..."
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
              <button
                type="button"
                onClick={() => setPresupuestoParaAnular(null)}
                disabled={isAnulandoPresupuesto}
                className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAnular}
                disabled={isAnulandoPresupuesto || !motivoAnulacion.trim()}
                className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
              >
                {isAnulandoPresupuesto ? 'Anulando...' : 'Confirmar Anulación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
