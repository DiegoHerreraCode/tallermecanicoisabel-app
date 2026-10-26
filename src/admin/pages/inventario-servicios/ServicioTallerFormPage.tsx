import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Save, Wrench, Layers, AlignLeft, Tag } from 'lucide-react';
import { getServicioTallerByIdAction } from '../../actions/get-servicio-taller-by-id.action';
import { getTiposServiciosTallerAction } from '../../actions/get-tipos-servicios-taller.action';
import { useServicioTallerMutation } from '../../hooks/useServicioTallerMutation';
import { getVariablesAction } from '../../actions/get-variables.action';

export const ServicioTallerFormPage = () => {
  const { id } = useParams<{ id: string }>();

  // Si id === 'new', estamos creando; de lo contrario estamos editando
  const isCreating = !id || id === 'new';

  const { saveServicioTaller, isPending } = useServicioTallerMutation();

  // Consulta del catálogo de tipos de servicios del taller
  const { data: tiposServicios = [], isLoading: isLoadingTipos } = useQuery({
    queryKey: ['tipos-servicios-taller-listado'],
    queryFn: getTiposServiciosTallerAction,
  });

  // Consulta de datos del servicio si estamos editando
  const { data: servicioData, isLoading: isLoadingServicio } = useQuery({
    queryKey: ['servicio-taller-item', id],
    queryFn: () => getServicioTallerByIdAction(id!),
    enabled: !isCreating,
  });

  // Consulta variables del sistema (para saber calculo_ganancia: sobre_venta o sobre_costo)
  const { data: variables = [] } = useQuery({
    queryKey: ['variables'],
    queryFn: getVariablesAction,
  });

  // Determinar la variable de calculo_ganancia
  const modoCalculo = useMemo(() => {
    const v = variables.find((item) => item.nombre === 'calculo_ganancia');
    return v?.valor === 'sobre_costo' ? 'sobre_costo' : 'sobre_venta';
  }, [variables]);

  // Estado del formulario
  const [idTipoServicio, setIdTipoServicio] = useState<number | ''>('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [costo, setCosto] = useState<number | ''>('');
  const [montoVenta, setMontoVenta] = useState<number | ''>('');
  const [utilidad, setUtilidad] = useState<number | ''>('');
  const [porcentajeGanancia, setPorcentajeGanancia] = useState<number | ''>('');

  // Sincronizar datos al editar
  useEffect(() => {
    if (servicioData) {
      setIdTipoServicio(servicioData.id_tipo_servicio_taller);
      setNombre(servicioData.nombre || '');
      setDescripcion(servicioData.descripcion || '');
      setCosto(servicioData.costo || 0);
      setMontoVenta(servicioData.monto_venta || 0);
      setUtilidad(servicioData.utilidad || 0);
      setPorcentajeGanancia(servicioData.porcentaje_ganancia || 0);
    }
  }, [servicioData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim()) {
      toast.warning('Por favor ingresa el nombre del servicio del taller');
      return;
    }

    if (!costo) {
      toast.warning('Por favor ingresa el costo del servicio del taller');
      return;
    }

    if (!montoVenta) {
      toast.warning('Por favor ingresa el monto de venta del servicio del taller');
      return;
    }

    if (!utilidad) {
      toast.warning('Por favor ingresa el utilidad del servicio del taller');
      return;
    }

    if (!porcentajeGanancia) {
      toast.warning('Por favor ingresa el porcentaje de ganancia del servicio del taller');
      return;
    }

    if (isCreating) {
      if (!idTipoServicio) {
        toast.warning('Por favor selecciona un tipo de servicio para el servicio');
        return;
      }

      // Al crear: todos los campos requeridos excepto la descripción (opcional)
      saveServicioTaller({
        payload: {
          id_tipo_servicio_taller: Number(idTipoServicio),
          nombre: nombre.trim(),
          descripcion: descripcion.trim() ? descripcion.trim() : undefined,
          costo,
          monto_venta: montoVenta,
          utilidad,
          porcentaje_ganancia: porcentajeGanancia,
        },
        id: undefined,
      });
    } else {
      // Al editar: lo UNICO NO editable es el id_tipo_servicio_taller
      saveServicioTaller({
        payload: {
          nombre: nombre.trim(),
          descripcion: descripcion.trim() ? descripcion.trim() : undefined,
          costo,
          monto_venta: montoVenta,
          utilidad,
          porcentaje_ganancia: porcentajeGanancia,
        },
        id,
      });
    }
  };

  if (!isCreating && isLoadingServicio) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Función para recalcular montos de venta o ganancia según el modo del sistema
  const handleCostoChange = (costoVal: number | '') => {
    setCosto(costoVal);
    if (costoVal === '' || Number(costoVal) <= 0) {
      setUtilidad('');
      return;
    }

    const c = Number(costoVal);
    // Si ya hay un porcentaje de ganancia, recalculamos el monto de venta y utilidad
    if (porcentajeGanancia !== '' && Number(porcentajeGanancia) >= 0) {
      const p = Number(porcentajeGanancia);
      let v = 0;
      let u = 0;
      if (modoCalculo === 'sobre_costo') {
        // v = c * (1 + p / 100)
        v = c * (1 + p / 100);
        u = v - c;
      } else {
        // sobre_venta: v = c / (1 - p / 100) (siempre que p < 100)
        if (p < 100) {
          v = c / (1 - p / 100);
          u = v - c;
        } else {
          v = c;
          u = 0;
        }
      }
      setMontoVenta(Number(v.toFixed(2)));
      setUtilidad(Number(u.toFixed(2)));
    } else if (montoVenta !== '' && Number(montoVenta) >= 0) {
      // Si hay un monto de venta, calculamos la utilidad y porcentaje
      const v = Number(montoVenta);
      const u = v - c;
      setUtilidad(Number(u.toFixed(2)));
      let p = 0;
      if (modoCalculo === 'sobre_costo') {
        p = c > 0 ? (u / c) * 100 : 0;
      } else {
        p = v > 0 ? (u / v) * 100 : 0;
      }
      setPorcentajeGanancia(Number(p.toFixed(2)));
    }
  };

  const handlePorcentajeChange = (pVal: number | '') => {
    setPorcentajeGanancia(pVal);
    if (pVal === '' || Number(pVal) < 0) {
      return;
    }

    const p = Number(pVal);
    const c = costo !== '' ? Number(costo) : 0;

    if (c > 0) {
      let v = 0;
      let u = 0;
      if (modoCalculo === 'sobre_costo') {
        v = c * (1 + p / 100);
        u = v - c;
      } else {
        if (p < 100) {
          v = c / (1 - p / 100);
          u = v - c;
        } else {
          v = c;
          u = 0;
        }
      }
      setMontoVenta(Number(v.toFixed(2)));
      setUtilidad(Number(u.toFixed(2)));
    }
  };

  const handleMontoVentaChange = (vVal: number | '') => {
    setMontoVenta(vVal);
    if (vVal === '' || Number(vVal) < 0) {
      setUtilidad('');
      return;
    }

    const v = Number(vVal);
    const c = costo !== '' ? Number(costo) : 0;
    const u = v - c;
    setUtilidad(Number(u.toFixed(2)));

    let p = 0;
    if (modoCalculo === 'sobre_costo') {
      p = c > 0 ? (u / c) * 100 : 0;
    } else {
      p = v > 0 ? (u / v) * 100 : 0;
    }
    setPorcentajeGanancia(Number(p.toFixed(2)));
  };

  // Encontrar el nombre del tipo de servicio actual para mostrar cuando está bloqueado
  const tipoActual = tiposServicios.find((t) => t.id_tipo_servicio_taller === Number(idTipoServicio));

  return (
    <div className="space-y-6 max-w-2xl animate-fadeIn mx-auto pb-12">
      {/* 1. Encabezado con Botón Volver */}
      <div className="flex items-center justify-between pb-2 border-b border-border/80">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/inventario-servicios/servicios"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Wrench className="w-6 h-6 text-blue-500" />
              {isCreating ? 'Registrar Nuevo Servicio del Taller' : `Editar Servicio del Taller #${id}`}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isCreating
                ? 'Asocia un nuevo servicio técnico a un tipo de servicio de taller'
                : 'Modificación de las propiedades descriptivas del servicio técnico'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Tarjeta del Formulario */}
      <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border/80 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Campo: Tipo de Servicio del Taller (id_tipo_servicio_taller) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              Tipo de Servicio del Taller <span className="text-rose-500">*</span>
              {!isCreating && (
                <span className="text-[10px] font-normal normal-case text-amber-500 ml-1">
                  (No editable)
                </span>
              )}
            </label>

            {isCreating ? (
              <select
                value={idTipoServicio}
                onChange={(e) => setIdTipoServicio(e.target.value ? Number(e.target.value) : '')}
                disabled={isLoadingTipos}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer"
                required
              >
                <option value="">-- Selecciona un tipo de servicio --</option>
                {tiposServicios.map((t) => (
                  <option key={t.id_tipo_servicio_taller} value={t.id_tipo_servicio_taller}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                <span className="text-sm font-bold text-foreground">
                  {tipoActual?.nombre || servicioData?.tipo_servicio_taller?.nombre || `Tipo #${idTipoServicio}`}
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  El tipo de servicio de taller asignado no puede ser modificado.
                </p>
              </div>
            )}
          </div>

          {/* Campo: Nombre del Servicio */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-500" />
              Nombre del Servicio <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Rectificado de Plano y Asiento de Válvulas"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-medium"
              required
            />
          </div>

          {/* Campo: Descripción del Servicio (Opcional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-blue-500" />
              Descripción
              <span className="text-[10px] font-normal normal-case text-muted-foreground ml-1">
                (Opcional)
              </span>
            </label>
            <textarea
              rows={4}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalle o especificaciones de la labor técnica..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-none"
            />
          </div>

          {/* Campos Económicos */}

          {/* Costo */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Costo ($) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              min="0"
              name="costo"
              value={costo}
              onChange={(e) => handleCostoChange(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0.00"
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-mono"
            />
          </div>

          {/* Porcentaje de Ganancia (%) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-foreground">
                Porcentaje de Ganancia (%) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                Modo: {modoCalculo}
              </span>
            </div>
            <input
              type="number"
              step="any"
              min="0"
              name="porcentaje_ganancia"
              value={porcentajeGanancia}
              onChange={(e) => handlePorcentajeChange(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="30"
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-mono"
            />
          </div>

          {/* Monto de Venta ($) */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Monto de Venta ($) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              min="0"
              name="monto_venta"
              value={montoVenta}
              onChange={(e) => handleMontoVentaChange(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0.00"
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-mono font-bold"
            />
          </div>

          {/* Utilidad ($) */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Utilidad Estimada ($)
            </label>
            <input
              type="number"
              step="any"
              name="utilidad"
              value={utilidad}
              readOnly
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-muted/40 border border-border/80 text-emerald-600 dark:text-emerald-400 font-mono font-bold focus:outline-none cursor-not-allowed"
            />
          </div>

          {/* Botón de Enviar */}
          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isPending
                ? 'Guardando...'
                : isCreating
                  ? 'Registrar Servicio'
                  : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServicioTallerFormPage;
