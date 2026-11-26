import { useState, useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import type { PagoClienteItem } from '../../interfaces/pago-cliente.interface';
import type { OrdenItem } from '../../interfaces/orden.interface';

interface Props {
  pagos: PagoClienteItem[];
  ordenes: OrdenItem[];
}

export const EconomicMetricsCard = ({ pagos, ordenes }: Props) => {
  // Rango de fechas por defecto: primer día del mes actual hasta hoy
  const now = new Date();
  const defaultDesde = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0];
  const defaultHasta = now.toISOString().split('T')[0];

  const [fechaDesde, setFechaDesde] = useState<string>(defaultDesde);
  const [fechaHasta, setFechaHasta] = useState<string>(defaultHasta);

  // Mapeo rápido de id_orden -> OrdenItem para clasificar según tipo de orden
  const ordenesMap = useMemo(() => {
    const map = new Map<number, OrdenItem>();
    ordenes.forEach((o) => map.set(o.id_orden, o));
    return map;
  }, [ordenes]);

  // Filtrar pagos dentro del rango [fechaDesde, fechaHasta]
  const { totalIngresos, desgloses, ingresoPromedioPorOrden, totalOrdenesConPago } = useMemo(() => {
    // Normalizar fechas solo como 'YYYY-MM-DD' para evitar desfases de huso horario (UTC vs local)
    const strDesde = fechaDesde ? fechaDesde.substring(0, 10) : '';
    const strHasta = fechaHasta ? fechaHasta.substring(0, 10) : '';

    let total = 0;
    const typeTotalsMap = new Map<string, number>();
    const ordenesIdsSet = new Set<number>();

    // Inicializar tipos conocidos para garantizar el orden del boceto
    typeTotalsMap.set('diagnostico', 0);
    typeTotalsMap.set('reparacion', 0);
    typeTotalsMap.set('mantenimiento', 0);

    pagos.forEach((pago) => {
      if (!pago.fecha_pago) return;
      const pagoDateStr = String(pago.fecha_pago).substring(0, 10);

      if (strDesde && pagoDateStr < strDesde) return;
      if (strHasta && pagoDateStr > strHasta) return;

      // Buscar orden asociada y excluir si la orden fue anulada
      const orden = ordenesMap.get(pago.id_orden);
      if (orden && orden.estado_operativo === 'anulada') return;

      const monto = Number(pago.monto || 0);
      total += monto;
      if (pago.id_orden) {
        ordenesIdsSet.add(pago.id_orden);
      }

      // Buscar tipo de orden asociada
      const tipoOrden = orden?.tipo_orden?.id_tipo_orden;

      if (tipoOrden == 1) {
        typeTotalsMap.set('diagnostico', (typeTotalsMap.get('diagnostico') || 0) + monto);
      } else if (tipoOrden == 2) {
        typeTotalsMap.set('reparacion', (typeTotalsMap.get('reparacion') || 0) + monto);
      } else {
        typeTotalsMap.set('mantenimiento', (typeTotalsMap.get('mantenimiento') || 0) + monto);
      }
    });

    const items: { label: string; monto: number }[] = [
      { label: 'Ingresos por diagnóstico', monto: typeTotalsMap.get('diagnostico') || 0 },
      { label: 'Ingresos por reparación', monto: typeTotalsMap.get('reparacion') || 0 },
      { label: 'Ingresos por mantenimiento', monto: typeTotalsMap.get('mantenimiento') || 0 },
    ];

    const cantOrdenes = ordenesIdsSet.size;
    const promedio = cantOrdenes > 0 ? total / cantOrdenes : 0;

    return {
      totalIngresos: total,
      desgloses: items,
      ingresoPromedioPorOrden: promedio,
      totalOrdenesConPago: cantOrdenes,
    };
  }, [pagos, ordenesMap, fechaDesde, fechaHasta]);

  return (
    <div className="bg-card p-6 rounded-2xl border border-border/80 shadow-xs flex flex-col justify-between h-full">
      {/* Encabezado con selector de fechas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <TrendingUp size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Métricas Económicas</h3>
            <p className="text-xs text-muted-foreground">Flujo de caja por servicios</p>
          </div>
        </div>

        {/* Filtros Desde - Hasta alineados lado a lado */}
        <div className="flex items-center gap-2 text-xs flex-nowrap shrink-0">
          <div className="flex items-center gap-1.5 bg-muted/40 border border-border/70 px-2.5 py-1.5 rounded-xl">
            <span className="text-muted-foreground font-medium text-[11px]">Desde</span>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="bg-transparent text-foreground text-xs font-semibold focus:outline-none cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-muted/40 border border-border/70 px-2.5 py-1.5 rounded-xl">
            <span className="text-muted-foreground font-medium text-[11px]">Hasta</span>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="bg-transparent text-foreground text-xs font-semibold focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Métricas de ingresos: Ingreso Promedio e Ingresos Totales */}
      <div className="my-5 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Ingreso Promedio por Orden */}
        <div className="sm:col-span-5 p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs sm:text-sm font-bold text-foreground">
              Ingreso prom. por orden
            </p>
            <p className="text-[11px] text-muted-foreground">
              {totalOrdenesConPago > 0
                ? `${totalOrdenesConPago} ${totalOrdenesConPago === 1 ? 'orden' : 'órdenes'} con pago`
                : 'Sin órdenes pagadas'}
            </p>
          </div>
          <span className="text-xl sm:text-2xl font-extrabold text-emerald-500 tracking-tight">
            ${ingresoPromedioPorOrden.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Ingresos generados en el rango de fechas */}
        <div className="sm:col-span-7 flex items-center justify-between gap-3 p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-foreground">
              Ingresos generados en el rango
            </h4>
            <p className="text-[11px] text-muted-foreground">Total recaudado en el período</p>
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-500 tracking-tight shrink-0">
            ${totalIngresos.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Lista desglosada por tipo de servicio */}
      <div className="space-y-4">
        {desgloses.map((item, idx) => {
          const percentage = totalIngresos > 0 ? Math.round((item.monto / totalIngresos) * 100) : 0;

          return (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-foreground">
                  {idx + 1}. {item.label}
                </span>
                <span className="text-emerald-500 font-bold">
                  +${item.monto.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Barra de progreso verde brillante según boceto */}
              <div className="w-full h-3 bg-muted/60 rounded-full overflow-hidden p-0.5 border border-emerald-500/20">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all duration-700 ease-out shadow-xs"
                  style={{ width: `${Math.max(percentage, item.monto > 0 ? 5 : 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
