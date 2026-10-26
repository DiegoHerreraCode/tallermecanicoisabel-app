import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Save, Wrench } from 'lucide-react';
import { getRepuestoByIdAction } from '../../actions/get-repuesto-by-id.action';
import { getMarcasRepuestosAction } from '../../actions/get-marcas-repuestos.action';
import { getVariablesAction } from '../../actions/get-variables.action';
import { useRepuestoMutation } from '../../hooks/useRepuestoMutation';

export const RepuestoFormPage = () => {
  const { id } = useParams<{ id: string }>();

  // Si id === 'new', estamos creando; en cualquier otro caso estamos editando
  const isCreating = !id || id === 'new';

  const { saveRepuesto, isPending } = useRepuestoMutation();

  // Consulta marcas de repuestos
  const { data: marcas = [] } = useQuery({
    queryKey: ['marcas-repuestos-listado'],
    queryFn: getMarcasRepuestosAction,
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

  // Consulta datos del repuesto si estamos editando
  const { data: repuestoData, isLoading: isLoadingRepuesto } = useQuery({
    queryKey: ['repuesto-item', id],
    queryFn: () => getRepuestoByIdAction(id!),
    enabled: !isCreating,
  });

  // Estado del formulario
  const [idMarcaRepuesto, setIdMarcaRepuesto] = useState<number | ''>('');
  const [nombreModelo, setNombreModelo] = useState('');
  const [ultimoCosto, setUltimoCosto] = useState<number | ''>('');
  const [montoVenta, setMontoVenta] = useState<number | ''>('');
  const [utilidad, setUtilidad] = useState<number | ''>('');
  const [porcentajeGanancia, setPorcentajeGanancia] = useState<number | ''>('');

  // Sincronizar datos al editar
  useEffect(() => {
    if (repuestoData) {
      setIdMarcaRepuesto(repuestoData.id_marca_repuesto || '');
      setNombreModelo(repuestoData.nombre_modelo || '');
      setUltimoCosto(Number(repuestoData.ultimo_costo_compra_unitario) || 0);
      setMontoVenta(Number(repuestoData.monto_venta) || 0);
      setUtilidad(Number(repuestoData.utilidad) || 0);
      setPorcentajeGanancia(Number(repuestoData.porcentaje_ganancia) || 0);
    }
  }, [repuestoData]);

  // Función para recalcular montos de venta o ganancia según el modo del sistema
  const handleCostoChange = (costoVal: number | '') => {
    setUltimoCosto(costoVal);
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
    const c = ultimoCosto !== '' ? Number(ultimoCosto) : 0;

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
    const c = ultimoCosto !== '' ? Number(ultimoCosto) : 0;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!idMarcaRepuesto) {
      toast.warning('Por favor selecciona una marca de repuesto');
      return;
    }

    if (!nombreModelo.trim()) {
      toast.warning('Por favor ingresa el nombre o modelo del repuesto');
      return;
    }

    if (ultimoCosto === '' || Number(ultimoCosto) < 0) {
      toast.warning('Por favor ingresa un costo unitario válido');
      return;
    }

    if (montoVenta === '' || Number(montoVenta) < 0) {
      toast.warning('Por favor ingresa un monto de venta válido');
      return;
    }

    const u = utilidad !== '' ? Number(utilidad) : Number(montoVenta) - Number(ultimoCosto);
    const p = porcentajeGanancia !== '' ? Number(porcentajeGanancia) : 0;

    saveRepuesto({
      payload: {
        id_marca_repuesto: Number(idMarcaRepuesto),
        nombre_modelo: nombreModelo.trim(),
        ultimo_costo_compra_unitario: Number(ultimoCosto),
        monto_venta: Number(montoVenta),
        utilidad: Number(u),
        porcentaje_ganancia: Number(p),
      },
      id: isCreating ? undefined : id,
    });
  };

  if (isLoadingRepuesto) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl animate-fadeIn mx-auto">
      {/* Encabezado con Botón Volver */}
      <div className="flex items-center justify-between pb-2 border-b border-border/80">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/inventario-servicios/repuestos"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Wrench className="w-6 h-6 text-blue-500" />
              {isCreating ? 'Registrar Nuevo Repuesto' : 'Editar Repuesto'}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isCreating
                ? 'Agrega un nuevo repuesto al inventario maestro del taller'
                : `Modificando datos del repuesto: ${nombreModelo}`}
            </p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-card p-6 rounded-2xl border border-border/80 shadow-xs space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Marca de Repuesto */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Marca de Repuesto <span className="text-rose-500">*</span>
            </label>
            <select
              name="id_marca_repuesto"
              value={idMarcaRepuesto}
              onChange={(e) => setIdMarcaRepuesto(e.target.value ? Number(e.target.value) : '')}
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 cursor-pointer"
            >
              <option value="">Selecciona una marca...</option>
              {marcas.map((m) => (
                <option key={m.id_marca_repuesto} value={m.id_marca_repuesto}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Nombre / Modelo */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Nombre o Modelo del Repuesto <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="nombre_modelo"
              value={nombreModelo}
              onChange={(e) => setNombreModelo(e.target.value)}
              placeholder="Ej: Pastillas de Freno Delanteras"
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>

          {/* Último Costo Compra Unitario */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Último Costo Compra Unitario ($) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              min="0"
              name="ultimo_costo_compra_unitario"
              value={ultimoCosto}
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
        </div>

        {/* Botones de Cancelar y Guardar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80">
          <Link
            to="/admin/inventario-servicios/repuestos"
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isPending ? 'Guardando...' : 'Guardar Información'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RepuestoFormPage;
