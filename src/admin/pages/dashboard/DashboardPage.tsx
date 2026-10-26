import {
  ClipboardList,
  Users,
  FileCheck2,
  RefreshCw,
} from 'lucide-react';
import { useDashboardData } from '../../hooks/useDashboardData';
import { MetricCard } from '../../components/dashboard/MetricCard';
import { MonthlyOrdersBarChart } from '../../components/dashboard/MonthlyOrdersBarChart';
import { OrderStatusPieChart } from '../../components/dashboard/OrderStatusPieChart';
import { EconomicMetricsCard } from '../../components/dashboard/EconomicMetricsCard';
import { DashboardCalendar } from '../../components/dashboard/DashboardCalendar';
import { RecentOrdersTable } from '../../components/dashboard/RecentOrdersTable';
import { QuickActionsTable } from '../../components/dashboard/QuickActionsTable';
import { Button } from '@/components/ui/button';

export const DashboardPage = () => {
  const { ordenes, personal, presupuestos, pagosClientes, isLoading, refetchAll } =
    useDashboardData();

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

  // 5. Gráfica de pastel: Distribución (no en porcentaje) de estados operativos de órdenes
  const pieData = {
    en_espera: ordenes.filter((o) => o.estado_operativo === 'en_espera').length,
    en_proceso: ordenes.filter((o) => o.estado_operativo === 'en_proceso').length,
    finalizada: ordenes.filter((o) => o.estado_operativo === 'finalizada').length,
    anulada: ordenes.filter((o) => o.estado_operativo === 'anulada').length,
  };

  // 6. Calendario de fechas tentativas de finalización de órdenes
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
        />
      </section>

      {/* FILA 3: Métricas Económicas con selector de fecha & Calendario de fechas tentativas */}
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

      {/* FILA 4: Tabla con las 5 órdenes más recientes & Accesos Rápidos */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentOrdersTable ordenes={ordenes} />
        <QuickActionsTable />
      </section>
    </div>
  );
};

export default DashboardPage;
