import { useState, useMemo } from 'react';
import {
  ClipboardList,
  FileCheck2,
  RefreshCw,
  Gauge,
} from 'lucide-react';
import { useDashboardData } from '../../hooks/useDashboardData';
import { MetricCard } from '../../components/dashboard/MetricCard';
import { MonthlyOrdersBarChart } from '../../components/dashboard/MonthlyOrdersBarChart';
import {
  OrderStatusPieChart,
  type OrderStatusFilterMode,
} from '../../components/dashboard/OrderStatusPieChart';
import {
  GenericPieChart,
  type GenericPieFilterMode,
  type GenericPieItem,
} from '../../components/dashboard/GenericPieChart';
import { EconomicMetricsCard } from '../../components/dashboard/EconomicMetricsCard';
import { DashboardCalendar } from '../../components/dashboard/DashboardCalendar';
import { RecentOrdersTable } from '../../components/dashboard/RecentOrdersTable';
import { QuickActionsTable } from '../../components/dashboard/QuickActionsTable';
import { Button } from '@/components/ui/button';

export const DashboardPage = () => {
  const {
    ordenes,
    ingresos,
    personal: _personal,
    presupuestos,
    pagosClientes,
    tiposOrdenes,
    tiposServicios,
    isLoading,
    refetchAll,
  } = useDashboardData();

  // Estados para el modo de filtrado de las gráficas de pastel (histórico vs mes actual)
  const [pieFilterMode, setPieFilterMode] =
    useState<OrderStatusFilterMode>('mes_actual');
  const [tiposServiciosFilterMode, setTiposServiciosFilterMode] =
    useState<GenericPieFilterMode>('mes_actual');
  const [tiposOrdenesFilterMode, setTiposOrdenesFilterMode] =
    useState<GenericPieFilterMode>('mes_actual');

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // 1. Métrica: Órdenes creadas en el mes actual y tiempo promedio de finalización
  const ordenesCreadasMesActual = ordenes.filter((ord) => {
    if (!ord.fecha_creacion) return false;
    const d = new Date(ord.fecha_creacion);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const ordenesMesActual = ordenesCreadasMesActual.length;

  // Órdenes finalizadas en el mes actual (o creadas en el mes actual que estén finalizadas)
  // Calculamos el tiempo de finalización (fecha_fin - fecha_creacion) en días
  const promedioDiasFinalizacion = useMemo(() => {
    // Tomamos las órdenes con estado 'finalizada' que tienen fecha_creacion en el mes actual
    const finalizadasEsteMes = ordenes.filter((ord) => {
      if (ord.estado_operativo !== 'finalizada' || !ord.fecha_fin || !ord.fecha_creacion) {
        return false;
      }
      const df = new Date(ord.fecha_creacion);
      return df.getMonth() === currentMonth && df.getFullYear() === currentYear;
    });

    // Si no hay finalizadas con fecha_creacion en este mes, evaluar creadas este mes que estén finalizadas
    const ordenesParaPromedio = finalizadasEsteMes.length > 0
      ? finalizadasEsteMes
      : ordenesCreadasMesActual.filter((ord) => ord.estado_operativo === 'finalizada' && ord.fecha_fin);

    if (ordenesParaPromedio.length === 0) {
      return null;
    }

    const totalDias = ordenesParaPromedio.reduce((sum, ord) => {
      const inicio = new Date(ord.fecha_creacion).getTime();
      const fin = new Date(ord.fecha_fin!).getTime();
      const diffMs = Math.max(0, fin - inicio);
      const diffDias = diffMs / (1000 * 60 * 60 * 24);
      return sum + diffDias;
    }, 0);

    const promedio = totalDias / ordenesParaPromedio.length;
    return Number(promedio.toFixed(1));
  }, [ordenes, ordenesCreadasMesActual, currentMonth, currentYear]);

  // 2. Métricas de Calidad y Cumplimiento del Mes Actual (Reemplaza tarjeta Empleados Registrados)
  // 2.1 Porcentaje de cumplimiento: órdenes creadas en el mes actual que estén finalizadas y donde fecha_fin <= fecha_fin_tentativa
  // Rangos de color:
  // - Cumplimiento: 0% a 25% rojo, >25% a 60% amarillo, >60% a 100% verde
  // - Reingreso por falla: 0% a 20% verde, >20% a 35% amarillo, >35% a 100% rojo
  const metricasCalidadMesActual = useMemo(() => {
    // Órdenes creadas en el mes actual que se encuentren finalizadas y con fecha_fin
    const ordenesFinalizadasMes = ordenesCreadasMesActual.filter(
      (ord) => ord.estado_operativo === 'finalizada' && Boolean(ord.fecha_fin)
    );

    const totalFinalizadas = ordenesFinalizadasMes.length;
    let cumplimientoPct = 0;

    if (totalFinalizadas > 0) {
      const cumplidas = ordenesFinalizadasMes.filter((ord) => {
        if (!ord.fecha_fin_tentativa || !ord.fecha_fin) return false;
        const fFin = ord.fecha_fin.substring(0, 10);
        const fTentativa = ord.fecha_fin_tentativa.substring(0, 10);
        return fFin <= fTentativa;
      }).length;

      // Sin redondear para permitir decimales (hasta 2 decimales si no es entero)
      const rawPct = (cumplidas / totalFinalizadas) * 100;
      cumplimientoPct = Number(rawPct.toFixed(2));
    }

    // 2.2 Porcentaje de reingreso por falla: ingresos registrados en el mes actual con reingreso_por_falla = true
    const ingresosMes = ingresos.filter((ing) => {
      if (!ing.fecha_ingreso) return false;
      const di = new Date(ing.fecha_ingreso);
      return di.getMonth() === currentMonth && di.getFullYear() === currentYear;
    });

    const totalIngresos = ingresosMes.length;
    let reingresoFallaPct = 0;

    if (totalIngresos > 0) {
      const conFalla = ingresosMes.filter((ing) => Boolean(ing.reingreso_por_falla)).length;
      // Sin redondear para permitir decimales (hasta 2 decimales si no es entero)
      const rawPct = (conFalla / totalIngresos) * 100;
      reingresoFallaPct = Number(rawPct.toFixed(2));
    }

    // Formateadores visuales (evita .00 si es entero, ej. 100% o 16.67%)
    const formatPct = (val: number) => {
      return Number.isInteger(val) ? `${val}%` : `${val.toFixed(2)}%`;
    };

    // Colores dinámicos
    // Cumplimiento: 0 a 25 rojo, >25 a 60 amarillo, >60 a 100 verde
    let cumplimientoColorClass = 'text-emerald-600 dark:text-emerald-400';
    if (cumplimientoPct <= 25) {
      cumplimientoColorClass = 'text-rose-600 dark:text-rose-400';
    } else if (cumplimientoPct <= 60) {
      cumplimientoColorClass = 'text-amber-500 dark:text-amber-400';
    }

    // Reingreso por falla: 0 a 20 verde, >20 a 35 amarillo, >35 a 100 rojo
    let reingresoFallaColorClass = 'text-emerald-600 dark:text-emerald-400';
    if (reingresoFallaPct > 35) {
      reingresoFallaColorClass = 'text-rose-600 dark:text-rose-400';
    } else if (reingresoFallaPct > 20) {
      reingresoFallaColorClass = 'text-amber-500 dark:text-amber-400';
    }

    return {
      cumplimientoPct,
      reingresoFallaPct,
      cumplimientoFormatted: formatPct(cumplimientoPct),
      reingresoFallaFormatted: formatPct(reingresoFallaPct),
      cumplimientoColorClass,
      reingresoFallaColorClass,
      totalFinalizadas,
      totalIngresos,
    };
  }, [ordenesCreadasMesActual, ingresos, currentMonth, currentYear]);

  // 3. Métrica: Num de presupuestos pendientes (estado === 'pendiente')
  const presupuestosPendientes = presupuestos.filter(
    (p) => p.estado === 'pendiente'
  ).length;

  // 4. Gráfica de barras: Volumen mensual de órdenes (últimos 6 meses)
  const monthLabels = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
  ];
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const mIndex = d.getMonth();
    const yVal = d.getFullYear();

    const count = ordenes.filter((ord) => {
      if (!ord.fecha_creacion) return false;
      const od = new Date(ord.fecha_creacion);
      return od.getMonth() === mIndex && od.getFullYear() === yVal;
    }).length;

    monthlyData.push({
      month: monthLabels[mIndex],
      total: count,
    });
  }

  // 5. Gráfica de pastel: Distribución por estados operativos de órdenes (con filtrado modo histórico o mes actual)
  const ordenesParaPie = useMemo(() => {
    if (pieFilterMode === 'mes_actual') {
      return ordenes.filter((ord) => {
        if (!ord.fecha_creacion) return false;
        const d = new Date(ord.fecha_creacion);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
    }
    // 'historico' (todas las órdenes)
    return ordenes;
  }, [ordenes, pieFilterMode, currentMonth, currentYear]);

  const pieData = useMemo(() => {
    return {
      en_espera: ordenesParaPie.filter((o) => o.estado_operativo === 'en_espera').length,
      en_proceso: ordenesParaPie.filter((o) => o.estado_operativo === 'en_proceso').length,
      finalizada: ordenesParaPie.filter((o) => o.estado_operativo === 'finalizada').length,
      anulada: ordenesParaPie.filter((o) => o.estado_operativo === 'anulada').length,
    };
  }, [ordenesParaPie]);

  // 6. Gráfica de pastel: Tipos de Servicios del Taller más solicitados
  const PALETTE_SERVICIOS = [
    { color: '#3b82f6', bgDot: 'bg-blue-500' },
    { color: '#10b981', bgDot: 'bg-emerald-500' },
    { color: '#f59e0b', bgDot: 'bg-amber-500' },
    { color: '#8b5cf6', bgDot: 'bg-purple-500' },
    { color: '#ec4899', bgDot: 'bg-pink-500' },
    { color: '#06b6d4', bgDot: 'bg-cyan-500' },
    { color: '#f97316', bgDot: 'bg-orange-500' },
    { color: '#6366f1', bgDot: 'bg-indigo-500' },
  ];

  const tiposServiciosData: GenericPieItem[] = useMemo(() => {
    // Filtrar órdenes por período
    const ordenesPeriodo =
      tiposServiciosFilterMode === 'mes_actual'
        ? ordenes.filter((ord) => {
          if (!ord.fecha_creacion) return false;
          const d = new Date(ord.fecha_creacion);
          return (
            d.getMonth() === currentMonth && d.getFullYear() === currentYear
          );
        })
        : ordenes;

    // Contar servicios por tipo_servicio_taller
    const countsMap = new Map<string, number>();

    // Inicializar con los tipos de servicio conocidos si los hay
    tiposServicios.forEach((ts) => {
      countsMap.set(ts.nombre, 0);
    });

    ordenesPeriodo.forEach((ord) => {
      ord.servicios_taller?.forEach((st) => {
        const nombreTipo =
          st.servicio_taller?.tipo_servicio_taller?.nombre ||
          st.servicio_taller?.tipoServicioTaller?.nombre ||
          'Otros';
        countsMap.set(nombreTipo, (countsMap.get(nombreTipo) || 0) + 1);
      });
    });

    // Convertir a array ordenado descendentemente
    const entries = Array.from(countsMap.entries())
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);

    // Si todos están en 0, mostrar al menos las categorías con 0 si existen
    const finalEntries =
      entries.length > 0
        ? entries
        : tiposServicios.slice(0, 4).map((ts) => [ts.nombre, 0] as [string, number]);

    return finalEntries.map(([label, count], idx) => {
      const palette = PALETTE_SERVICIOS[idx % PALETTE_SERVICIOS.length];
      return {
        label,
        count,
        color: palette.color,
        bgDot: palette.bgDot,
      };
    });
  }, [
    ordenes,
    tiposServicios,
    tiposServiciosFilterMode,
    currentMonth,
    currentYear,
  ]);

  // 7. Gráfica de pastel: Tipos de Órdenes más solicitados
  const PALETTE_ORDENES = [
    { color: '#3b82f6', bgDot: 'bg-blue-500' },
    { color: '#10b981', bgDot: 'bg-emerald-500' },
    { color: '#f59e0b', bgDot: 'bg-amber-500' },
    { color: '#8b5cf6', bgDot: 'bg-purple-500' },
    { color: '#ec4899', bgDot: 'bg-pink-500' },
  ];

  const tiposOrdenesData: GenericPieItem[] = useMemo(() => {
    const ordenesPeriodo =
      tiposOrdenesFilterMode === 'mes_actual'
        ? ordenes.filter((ord) => {
          if (!ord.fecha_creacion) return false;
          const d = new Date(ord.fecha_creacion);
          return (
            d.getMonth() === currentMonth && d.getFullYear() === currentYear
          );
        })
        : ordenes;

    const countsMap = new Map<string, number>();

    // Inicializar con los tipos de orden disponibles
    tiposOrdenes.forEach((to) => {
      countsMap.set(to.nombre, 0);
    });

    ordenesPeriodo.forEach((ord) => {
      const nombreTipo =
        ord.tipo_orden?.nombre ||
        tiposOrdenes.find((to) => to.id_tipo_orden === ord.id_tipo_orden)
          ?.nombre ||
        'Otro';
      countsMap.set(nombreTipo, (countsMap.get(nombreTipo) || 0) + 1);
    });

    const entries = Array.from(countsMap.entries())
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);

    const finalEntries =
      entries.length > 0
        ? entries
        : tiposOrdenes.slice(0, 4).map((to) => [to.nombre, 0] as [string, number]);

    return finalEntries.map(([label, count], idx) => {
      const palette = PALETTE_ORDENES[idx % PALETTE_ORDENES.length];
      return {
        label: label.charAt(0).toUpperCase() + label.slice(1),
        count,
        color: palette.color,
        bgDot: palette.bgDot,
      };
    });
  }, [
    ordenes,
    tiposOrdenes,
    tiposOrdenesFilterMode,
    currentMonth,
    currentYear,
  ]);

  // 8. Calendario de fechas tentativas de finalización de órdenes
  // Se debe marcar si y solo si ese día hay una orden con estado_operativo != 'finalizada' o 'anulada' con esa fecha_fin_tentativa
  const ordenesParaCalendario = ordenes
    .filter(
      (o) =>
        o.fecha_fin_tentativa &&
        o.estado_operativo !== 'finalizada' &&
        o.estado_operativo !== 'anulada'
    )
    .map((o) => ({
      id_orden: o.id_orden,
      fecha_fin_tentativa: o.fecha_fin_tentativa,
    }));

  return (
    <div className="space-y-8 pb-10">
      {/* Título superior y botón de refresco */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Panel Principal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Monitoreo en tiempo real de operaciones, finanzas y actividades del Taller Mecánico Isabel
          </p>
        </div>

        <Button
          onClick={refetchAll}
          variant="outline"
          size="sm"
          disabled={isLoading}
          className="flex items-center gap-1.5 self-start sm:self-auto rounded-xl shadow-xs cursor-pointer"
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          <span>{isLoading ? 'Actualizando...' : 'Actualizar Datos'}</span>
        </Button>
      </div>

      {/* FILA 1: Cards con métricas relevantes (3 métricas según boceto) */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <MetricCard
          title="Órdenes Creadas"
          value={ordenesMesActual}
          subtitle={
            <div className="flex flex-col gap-0.5 mt-0.5">
              <span>En el mes actual</span>
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                {promedioDiasFinalizacion !== null
                  ? `Tiempo prom. finalización: ${promedioDiasFinalizacion} ${promedioDiasFinalizacion === 1 ? 'día' : 'días'}`
                  : 'Tiempo prom. finalización: Sin finalizar este mes'}
              </span>
            </div>
          }
          icon={ClipboardList}
          color="bg-blue-500/10 text-blue-500 dark:bg-blue-500/20"
        />

        <div className="bg-card p-5 rounded-2xl border border-border/80 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between">
          <div className="space-y-3 flex-1 pr-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                % Cumplimiento
              </p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${metricasCalidadMesActual.cumplimientoColorClass}`}>
                  {metricasCalidadMesActual.cumplimientoFormatted}
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">
                  ({metricasCalidadMesActual.totalFinalizadas} finalizadas)
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-border/60">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                % Reingreso por Falla
              </p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${metricasCalidadMesActual.reingresoFallaColorClass}`}>
                  {metricasCalidadMesActual.reingresoFallaFormatted}
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">
                  ({metricasCalidadMesActual.totalIngresos} ingresos)
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl flex items-center justify-center shrink-0 bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20 self-start">
            <Gauge size={24} />
          </div>
        </div>

        <MetricCard
          title="Presupuestos Pendientes"
          value={presupuestosPendientes}
          subtitle="Por aprobar o rechazar"
          icon={FileCheck2}
          color="bg-amber-500/10 text-amber-500 dark:bg-amber-500/20"
        />
      </section>

      {/* FILA 2: Gráficas (Barras y Pastel) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyOrdersBarChart
          title="Volumen Mensual de Órdenes"
          data={monthlyData}
        />

        <OrderStatusPieChart
          title="Distribución de Estados Operativos"
          data={pieData}
          filterMode={pieFilterMode}
          onFilterModeChange={setPieFilterMode}
        />
      </section>

      {/* FILA 3: Gráficas de Pastel Adicionales (Tipos de Servicios y Tipos de Órdenes) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GenericPieChart
          title="Tipos de Servicios del Taller Más Solicitados"
          subtitle="Frecuencia de servicios solicitados en órdenes"
          centerLabel="Servicios"
          items={tiposServiciosData}
          filterMode={tiposServiciosFilterMode}
          onFilterModeChange={setTiposServiciosFilterMode}
          filterGroupName="tipos_servicios_filter"
        />

        <GenericPieChart
          title="Tipos de Órdenes Más Solicitadas"
          subtitle="Frecuencia por categoría de orden de trabajo"
          centerLabel="Órdenes"
          items={tiposOrdenesData}
          filterMode={tiposOrdenesFilterMode}
          onFilterModeChange={setTiposOrdenesFilterMode}
          filterGroupName="tipos_ordenes_filter"
        />
      </section>

      {/* FILA 4: Métricas Económicas con selector de fecha & Calendario de fechas tentativas */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EconomicMetricsCard
          pagos={pagosClientes}
          ordenes={ordenes}
        />

        <DashboardCalendar
          title="Calendario de Fechas Tentativas de Finalización de Órdenes"
          subtitle="Compromisos de entrega operativa programados"
          orders={ordenesParaCalendario}
        />
      </section>

      {/* FILA 5: Tabla con las 5 órdenes más recientes & Accesos Rápidos */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentOrdersTable ordenes={ordenes} />
        <QuickActionsTable />
      </section>
    </div>
  );
};

export default DashboardPage;
