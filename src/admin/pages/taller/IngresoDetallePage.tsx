import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Car,
  FileText,
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  X,
  FileCheck2,
  ShieldAlert,
} from 'lucide-react';

import { useAppNavigation } from '../../hooks/useAppNavigation';
import { getIngresoByIdAction } from '../../actions/get-ingreso-by-id.action';
import { getVehiculosAction } from '../../actions/get-vehiculos.action';
import { getClientesAction } from '../../actions/get-clientes.action';
import { getModelosVehiculosAction } from '../../actions/get-modelos-vehiculos.action';
import { getMarcasVehiculosAction } from '../../actions/get-marcas-vehiculos.action';
import { getTiposOrdenesAction } from '../../actions/get-tipos-ordenes.action';
import { getHallazgosTecnicosAction } from '../../actions/get-hallazgos-tecnicos.action';
import { useOrdenMutation } from '../../hooks/useOrdenMutation';

export const IngresoDetallePage = () => {
  const { id } = useParams<{ id: string }>();
  const { goBack, navigate } = useAppNavigation();

  const {
    createHallazgo,
    isCreatingHallazgo,
    deleteHallazgo,
    isDeletingHallazgo,
  } = useOrdenMutation();

  // 1. Consultar datos del ingreso
  const { data: ingreso, isLoading: isLoadingIngreso } = useQuery({
    queryKey: ['ingreso-item', id],
    queryFn: () => getIngresoByIdAction(id!),
    enabled: !!id,
  });

  // 2. Catálogos para resolver nombres si vienen solo IDs
  const { data: vehiculos = [] } = useQuery({
    queryKey: ['vehiculos-listado'],
    queryFn: getVehiculosAction,
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes-listado'],
    queryFn: getClientesAction,
  });

  const { data: modelosVehiculos = [] } = useQuery({
    queryKey: ['modelos-vehiculos-listado'],
    queryFn: getModelosVehiculosAction,
  });

  const { data: marcasVehiculos = [] } = useQuery({
    queryKey: ['marcas-vehiculos-listado'],
    queryFn: getMarcasVehiculosAction,
  });

  const { data: tiposOrdenes = [] } = useQuery({
    queryKey: ['tipos-ordenes-listado'],
    queryFn: getTiposOrdenesAction,
  });

  // 3. Hallazgos técnicos vinculados al ingreso
  const { data: hallazgos = [] } = useQuery({
    queryKey: ['hallazgos-ingreso', id],
    queryFn: () => getHallazgosTecnicosAction({ idIngreso: id! }),
    enabled: !!id,
  });

  // Modal para registrar nuevo hallazgo técnico
  const [showHallazgoModal, setShowHallazgoModal] = useState(false);
  const [hallazgoTitulo, setHallazgoTitulo] = useState('');
  const [hallazgoDetalle, setHallazgoDetalle] = useState('');

  // Mapas de resolución
  const clientesMap = useMemo(() => {
    const map = new Map<number, { nombre: string; cedula: string }>();
    clientes.forEach((c) =>
      map.set(c.id_cliente, { nombre: c.nombre, cedula: c.cedula })
    );
    return map;
  }, [clientes]);

  const marcasMap = useMemo(() => {
    const map = new Map<number, string>();
    marcasVehiculos.forEach((m) => map.set(m.id_marca_vehiculo, m.nombre));
    return map;
  }, [marcasVehiculos]);

  const modelosMap = useMemo(() => {
    const map = new Map<number, { nombre: string; marca: string }>();
    modelosVehiculos.forEach((mod) => {
      const marcaNombre =
        mod.marca?.nombre || marcasMap.get(mod.id_marca_vehiculo) || '';
      map.set(mod.id_modelo_vehiculo, {
        nombre: mod.nombre,
        marca: marcaNombre,
      });
    });
    return map;
  }, [modelosVehiculos, marcasMap]);

  const vehiculosMap = useMemo(() => {
    const map = new Map<number, typeof vehiculos[0]>();
    vehiculos.forEach((v) => map.set(v.id_vehiculo, v));
    return map;
  }, [vehiculos]);

  const tiposOrdenesMap = useMemo(() => {
    const map = new Map<number, string>();
    tiposOrdenes.forEach((to) => map.set(to.id_tipo_orden, to.nombre));
    return map;
  }, [tiposOrdenes]);

  // Datos resueltos del ingreso
  const resolved = useMemo(() => {
    if (!ingreso) return null;
    const v = ingreso.vehiculo || vehiculosMap.get(ingreso.id_vehiculo);
    const cliente = v ? clientesMap.get(v.id_cliente) : null;
    const modelo = v ? modelosMap.get(v.id_modelo_vehiculo) : null;
    const tipoOrdenNombre =
      ingreso.tipo_orden?.nombre ||
      tiposOrdenesMap.get(ingreso.id_tipo_orden) ||
      '—';

    return {
      placa: v?.placa || '—',
      annio: v?.annio || '',
      modeloNombre: modelo?.nombre || '—',
      marcaNombre: modelo?.marca || '—',
      clienteNombre: cliente?.nombre || '—',
      clienteCedula: cliente?.cedula || '',
      tipoOrdenNombre,
    };
  }, [ingreso, vehiculosMap, clientesMap, modelosMap, tiposOrdenesMap]);

  const getEstadoBadgeClass = (estado?: string) => {
    switch (estado) {
      case 'checklist_pendiente':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'esperando_orden':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'confirmando_presupuesto':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'orden_creada':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'anulado':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getBackendChecklistUrl = (pathOrName: string | null | undefined): string | null => {
    if (!pathOrName) return null;
    if (pathOrName.startsWith('http://') || pathOrName.startsWith('https://')) {
      return pathOrName;
    }
    const cleanPath = pathOrName.startsWith('/') ? pathOrName.substring(1) : pathOrName;
    return `https://vnfwolviqsmkotbeydzg.supabase.co/storage/v1/object/public/checklists/${cleanPath}`;
  };

  const handleSaveHallazgo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hallazgoTitulo.trim()) {
      toast.warning('Por favor ingresa el título del hallazgo');
      return;
    }

    createHallazgo(
      {
        id_ingreso: Number(id),
        hallazgo: hallazgoTitulo.trim(),
        detalle: hallazgoDetalle.trim() ? hallazgoDetalle.trim() : undefined,
      },
      {
        onSuccess: () => {
          setShowHallazgoModal(false);
          setHallazgoTitulo('');
          setHallazgoDetalle('');
        },
      }
    );
  };

  const isAnulado = ingreso?.estado === 'anulado';

  if (isLoadingIngreso) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <p className="text-sm text-muted-foreground font-medium">Cargando detalle del ingreso...</p>
      </div>
    );
  }

  if (!ingreso || !resolved) {
    return (
      <div className="bg-card p-8 rounded-2xl border border-border/80 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-foreground">Ingreso no encontrado</h2>
        <p className="text-sm text-muted-foreground">
          El ingreso vehicular solicitado no existe o no se pudo cargar.
        </p>
        <button
          type="button"
          onClick={() => goBack('/admin/taller/ingresos')}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Ingresos
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-6xl mx-auto">
      {/* 1. Encabezado con Botón Volver y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => goBack('/admin/taller/ingresos')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Car className="w-6 h-6 text-blue-500" />
              Detalle del Ingreso #{ingreso.id_ingreso}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Información del vehículo, cliente, checklist y hallazgos técnicos
            </p>
          </div>
        </div>

        {/* Acciones contextuales */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {ingreso.estado === 'esperando_orden' && (
            <>
              <button
                type="button"
                onClick={() => navigate(`/admin/taller/ordenes/new?id_ingreso=${ingreso.id_ingreso}`)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Crear Orden de Trabajo
              </button>
              <button
                type="button"
                onClick={() => navigate(`/admin/taller/presupuestos/new?tipo=inicial&id_ingreso=${ingreso.id_ingreso}`)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-colors cursor-pointer"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                Generar Presupuesto
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Grid Principal con Resumen y Hallazgos Técnicos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMNA IZQUIERDA (7 columnas): Tarjetas de Información, Observaciones y Checklist */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card Resumen General */}
          <div className="bg-card p-5 sm:p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Car className="w-4 h-4 text-blue-500" />
              Datos Generales del Ingreso
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
              <div className="p-3 bg-muted/30 rounded-xl border border-border/60">
                <span className="text-muted-foreground block text-xs">Tipo de Orden</span>
                <span className="font-bold text-foreground capitalize">{resolved.tipoOrdenNombre}</span>
              </div>

              <div className="p-3 bg-muted/30 rounded-xl border border-border/60">
                <span className="text-muted-foreground block text-xs">Estado Operativo</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border mt-0.5 ${getEstadoBadgeClass(
                    ingreso.estado
                  )}`}
                >
                  {ingreso.estado}
                </span>
              </div>

              <div className="p-3 bg-muted/30 rounded-xl border border-border/60">
                <span className="text-muted-foreground block text-xs">Fecha de Ingreso</span>
                <span className="font-semibold text-foreground">{ingreso.fecha_ingreso || '—'}</span>
              </div>

              <div className="p-3 bg-muted/30 rounded-xl border border-border/60">
                <span className="text-muted-foreground block text-xs">Vehículo</span>
                <span className="font-bold text-foreground">
                  {resolved.modeloNombre} ({resolved.marcaNombre})
                </span>
              </div>

              <div className="p-3 bg-muted/30 rounded-xl border border-border/60">
                <span className="text-muted-foreground block text-xs">Placa / Matrícula</span>
                <span className="font-mono font-bold text-foreground">{resolved.placa}</span>
              </div>

              <div className="p-3 bg-muted/30 rounded-xl border border-border/60">
                <span className="text-muted-foreground block text-xs">Cliente Propietario</span>
                <span className="font-bold text-foreground block truncate">{resolved.clienteNombre}</span>
                {resolved.clienteCedula && (
                  <span className="text-[11px] text-muted-foreground block">
                    C.I. {resolved.clienteCedula}
                  </span>
                )}
              </div>
            </div>

            {/* Información de Anulación si fue anulado */}
            {ingreso.estado === 'anulado' && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs space-y-1">
                <span className="font-bold text-rose-600 dark:text-rose-400 block">
                  Ingreso Anulado
                </span>
                <p className="text-foreground">
                  <strong>Motivo:</strong> {ingreso.motivo_anulacion || 'No especificado'}
                </p>
                {ingreso.fecha_anulacion && (
                  <p className="text-muted-foreground text-[11px]">
                    Fecha: {ingreso.fecha_anulacion}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Card Observaciones del Cliente */}
          <div className="bg-card p-5 sm:p-6 rounded-2xl border border-border/80 shadow-xs space-y-2">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-500" />
              Observaciones del Cliente
            </h3>
            <div className="p-4 bg-background rounded-xl border border-border/80 text-foreground text-xs sm:text-sm min-h-[90px] whitespace-pre-wrap leading-relaxed">
              {ingreso.observaciones_cliente || 'Sin observaciones registradas por el cliente.'}
            </div>
          </div>

          {/* Card Imagen de Checklist de Revisión */}
          {(ingreso.imagePath || ingreso.image) && (
            <div className="bg-card p-5 sm:p-6 rounded-2xl border border-border/80 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-blue-500" />
                Checklist de Revisión
              </h3>
              <div className="p-3 bg-muted/20 border border-border/80 rounded-xl flex flex-col items-center gap-2.5">
                <a
                  href={getBackendChecklistUrl(ingreso.imagePath || ingreso.image) || ''}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative group block overflow-hidden rounded-xl border border-border max-w-md w-full"
                >
                  <img
                    src={getBackendChecklistUrl(ingreso.imagePath || ingreso.image) || ''}
                    alt="Checklist de revisión"
                    className="max-h-72 w-full object-contain rounded-xl group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                    <Eye className="w-4 h-4 mr-1" />
                    Ver Imagen Completa
                  </div>
                </a>
                <a
                  href={getBackendChecklistUrl(ingreso.imagePath || ingreso.image) || ''}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Abrir imagen en pestaña nueva
                </a>
              </div>
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA (5 columnas): Cuadro de Hallazgos Técnicos */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-card p-5 sm:p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/80">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Hallazgos Técnicos
              </h3>
              {!isAnulado && (
                <button
                  type="button"
                  onClick={() => setShowHallazgoModal(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nuevo Hallazgo
                </button>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Observaciones y hallazgos mecánicos identificados en el vehículo durante la recepción. Se transferirán a la orden de trabajo correspondiente.
            </p>

            {/* Listado de Hallazgos Técnicos */}
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {hallazgos.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground italic bg-muted/20 rounded-xl border border-dashed border-border">
                  No hay hallazgos técnicos registrados en este ingreso.
                </div>
              ) : (
                hallazgos.map((h) => (
                  <div
                    key={h.id_hallazgo_tecnico}
                    className="p-3 bg-background border border-border/80 rounded-xl text-xs space-y-1 relative group hover:border-border transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-foreground block text-xs sm:text-sm">
                        {h.hallazgo}
                      </span>
                      {!isAnulado && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`¿Estás seguro de eliminar el hallazgo "${h.hallazgo}"?`)) {
                              deleteHallazgo({
                                id: h.id_hallazgo_tecnico,
                                ingresoId: ingreso.id_ingreso,
                              });
                            }
                          }}
                          disabled={isDeletingHallazgo}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded-md hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                          title="Eliminar hallazgo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {h.detalle && (
                      <p className="text-muted-foreground text-xs whitespace-pre-wrap leading-relaxed">
                        {h.detalle}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: REGISTRAR HALLAZGO TÉCNICO EN EL INGRESO */}
      {showHallazgoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/80 shrink-0">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                Registrar Hallazgo Técnico
              </h3>
              <button
                type="button"
                onClick={() => setShowHallazgoModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHallazgo} className="flex flex-col flex-1 min-h-0 space-y-4">
              <div className="overflow-y-auto pr-1 space-y-4 flex-1">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Hallazgo / Resumen <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Fuga de aceite en la empacadura de la tapa..."
                    value={hallazgoTitulo}
                    onChange={(e) => setHallazgoTitulo(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Detalles / Especificaciones Técnicas
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe las observaciones técnicas y recomendaciones..."
                    value={hallazgoDetalle}
                    onChange={(e) => setHallazgoDetalle(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-border/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowHallazgoModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingHallazgo || !hallazgoTitulo.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isCreatingHallazgo ? 'Guardando...' : 'Guardar Hallazgo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IngresoDetallePage;
