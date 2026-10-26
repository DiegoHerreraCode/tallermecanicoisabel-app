import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useThemeStore } from '@/lib/theme.store';

export interface CalendarOrderIndicator {
  id_orden: number;
  fecha_fin_tentativa: string;
}

interface Props {
  title: string;
  subtitle: string;
  orders: CalendarOrderIndicator[];
}

const MONTH_NAMES = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
];

const WEEK_DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const normalizeDateKey = (raw: string | Date | undefined | null): string | null => {
  if (!raw) return null;

  if (raw instanceof Date) {
    if (isNaN(raw.getTime())) return null;
    const y = raw.getFullYear();
    const m = String(raw.getMonth() + 1).padStart(2, '0');
    const d = String(raw.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const str = String(raw).trim();
  if (!str) return null;

  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    const d = isoMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const latamMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (latamMatch) {
    const d = latamMatch[1].padStart(2, '0');
    const m = latamMatch[2].padStart(2, '0');
    const y = latamMatch[3];
    return `${y}-${m}-${d}`;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return null;
};

export const DashboardCalendar = ({
  title,
  subtitle,
  orders = [],
}: Props) => {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const { theme } = useThemeStore();

  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Mapear órdenes por fecha "YYYY-MM-DD"
  const ordersByDateMap = new Map<string, number[]>();
  orders.forEach((ord) => {
    const key = normalizeDateKey(ord.fecha_fin_tentativa);
    if (key) {
      const existing = ordersByDateMap.get(key) || [];
      existing.push(ord.id_orden);
      ordersByDateMap.set(key, existing);
    }
  });

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarCells.push(day);
  }

  return (
    <div className="bg-card p-6 rounded-2xl border border-border/80 shadow-xs flex flex-col justify-between h-full">
      <div className="mb-4">
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>

      {/* Cabecera del Calendario */}
      <div className="rounded-xl overflow-hidden border border-border">
        <div className="bg-sky-500 dark:bg-sky-600 px-4 py-2.5 flex items-center justify-between text-white font-bold text-sm tracking-wider">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 hover:bg-white/20 rounded-md transition-colors cursor-pointer"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <span>
            {MONTH_NAMES[month]} &nbsp; {year}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 hover:bg-white/20 rounded-md transition-colors cursor-pointer"
            aria-label="Mes siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Encabezado L M M J V S D */}
        <div className="grid grid-cols-7 text-center py-2 bg-muted/40 border-b border-border text-xs font-semibold text-muted-foreground">
          {WEEK_DAYS.map((wd, i) => (
            <span key={i}>{wd}</span>
          ))}
        </div>

        {/* Cuadrícula de Números */}
        <div className="grid grid-cols-7 text-center divide-x divide-y divide-border/60 bg-card">
          {calendarCells.map((day, idx) => {
            if (day === null) {
              return <div key={idx} className="h-10 bg-muted/10" />;
            }

            const dayString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayOrders = ordersByDateMap.get(dayString);
            const isHighlighted = Boolean(dayOrders && dayOrders.length > 0);

            const tooltipText = isHighlighted
              ? `Órdenes por finalizar: ${dayOrders?.map((id) => `#${id}`).join(', ')}`
              : undefined;

            return (
              <div
                key={idx}
                title={tooltipText}
                className={`h-10 flex items-center justify-center text-xs transition-colors relative cursor-default ${
                  isHighlighted
                    ? `!bg-amber-300 dark:!bg-amber-500/40 ${
                        theme === 'dark' ? 'text-amber-100' : 'text-amber-950'
                      } font-extrabold shadow-inner`
                    : 'text-foreground hover:bg-muted/40 font-medium'
                }`}
              >
                <span>{day}</span>
                {isHighlighted && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Leyenda explicativa inferior */}
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="w-3.5 h-3.5 rounded-md bg-amber-300 dark:bg-amber-500/40 border border-amber-400 dark:border-amber-500 shrink-0" />
        <span className="truncate">
          Casilla amarilla: al menos una orden con fecha fin tentativa (hover para ver ID de orden)
        </span>
      </div>
    </div>
  );
};
