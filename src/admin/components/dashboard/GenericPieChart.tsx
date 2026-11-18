export type GenericPieFilterMode = 'historico' | 'mes_actual';

export interface GenericPieItem {
  label: string;
  count: number;
  color: string;
  bgDot: string;
}

interface Props {
  title: string;
  subtitle?: string;
  centerLabel?: string;
  items: GenericPieItem[];
  filterMode?: GenericPieFilterMode;
  onFilterModeChange?: (mode: GenericPieFilterMode) => void;
  filterGroupName: string;
}

export const GenericPieChart = ({
  title,
  subtitle = 'Distribución cuantitativa',
  centerLabel = 'Total',
  items,
  filterMode = 'historico',
  onFilterModeChange,
  filterGroupName,
}: Props) => {
  const totalCount = items.reduce((sum, s) => sum + s.count, 0);

  // Generar trazos SVG basados en ángulos acumulados
  let accumulatedAngle = 0;
  const radius = 64;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="bg-card p-6 rounded-2xl border border-border/80 shadow-xs flex flex-col justify-between h-full">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>

        {/* Opciones de filtrado mutuamente excluyentes: Modo Histórico vs Mes Actual */}
        <div className="flex items-center gap-4 sm:gap-6 pt-1 sm:pt-0 self-end sm:self-auto">
          {/* Modo Histórico */}
          <label className="flex flex-col items-center gap-1.5 cursor-pointer group select-none">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              Modo Histórico
            </span>
            <input
              type="radio"
              name={filterGroupName}
              value="historico"
              checked={filterMode === 'historico'}
              onChange={() => onFilterModeChange?.('historico')}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-border/80 cursor-pointer accent-blue-600"
            />
          </label>

          {/* Mes Actual */}
          <label className="flex flex-col items-center gap-1.5 cursor-pointer group select-none">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              Mes Actual
            </span>
            <input
              type="radio"
              name={filterGroupName}
              value="mes_actual"
              checked={filterMode === 'mes_actual'}
              onChange={() => onFilterModeChange?.('mes_actual')}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-border/80 cursor-pointer accent-blue-600"
            />
          </label>
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row items-center justify-around gap-6">
        {/* Gráfico Donut/Pie con SVG nativo */}
        <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
            {totalCount === 0 ? (
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke="currentColor"
                strokeWidth="24"
                className="text-muted/40"
              />
            ) : (
              items.map((seg, i) => {
                const ratio = seg.count / totalCount;
                const strokeDasharray = `${ratio * circumference} ${circumference}`;
                const strokeDashoffset = -accumulatedAngle * circumference;
                accumulatedAngle += ratio;

                if (seg.count === 0) return null;

                return (
                  <circle
                    key={i}
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth="24"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-700 ease-out"
                  />
                );
              })
            )}
          </svg>

          {/* Centro del donut con total absoluto */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-extrabold text-foreground">{totalCount}</span>
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {centerLabel}
            </span>
          </div>
        </div>

        {/* Leyenda con valores numéricos absolutos */}
        <div className="grid grid-cols-1 gap-2 w-full max-w-xs max-h-48 overflow-y-auto pr-1">
          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Sin datos registrados
            </p>
          ) : (
            items.map((seg, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-xl bg-muted/30 border border-border/50 text-xs font-medium"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${seg.bgDot}`} />
                  <span className="text-muted-foreground truncate" title={seg.label}>
                    {seg.label}
                  </span>
                </div>
                <span className="font-bold text-foreground text-sm ml-2 shrink-0">
                  {seg.count}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
