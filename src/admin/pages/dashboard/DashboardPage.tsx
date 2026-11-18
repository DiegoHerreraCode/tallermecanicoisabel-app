import { useState, useMemo } from 'react';
import {
  ClipboardList,
  Users,
  FileCheck2,
  RefreshCw,
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
    personal,
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

  // 1. Métrica: Órdenes creadas en el mes actual
  const ordenesMesActual = ordenes.filter((ord) => {
    if (!ord.fecha_creacion) return false;
    const d = new Date(ord.fecha_creacion);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  // 2. Métrica: Num empleados registrados (personal no eliminado lógicamente)
  const numEmpleadosRegistrados = personal.filter((p) => !p.is_deleted).length;

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
          subtitle="En el mes actual"
          icon={ClipboardList}
          color="bg-blue-500/10 text-blue-500 dark:bg-blue-500/20"
        />

        <MetricCard
          title="Empleados Registrados"
          value={numEmpleadosRegistrados}
          subtitle="Personal técnico y operativo activo"
          icon={Users}
          color="bg-cyan-500/10 text-cyan-500 dark:bg-cyan-500/20"
        />

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
