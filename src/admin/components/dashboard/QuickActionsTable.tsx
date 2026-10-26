import { Link } from 'react-router';
import {
  FileCheck2,
  CreditCard,
  Car,
  Users,
  Settings,
  ArrowUpRight,
} from 'lucide-react';

export const QuickActionsTable = () => {
  const actions = [
    {
      title: 'Nuevo Ingreso',
      subtitle: 'Recepción y checklist de vehículo',
      to: '/admin/taller',
      icon: Car,
      color: 'text-blue-500 bg-blue-500/10',
    },
    {
      title: 'Nuevo Presupuesto',
      subtitle: 'Presupuesto inicial o extra',
      to: '/admin/taller',
      icon: FileCheck2,
      color: 'text-amber-500 bg-amber-500/10',
    },
    {
      title: 'Pagos de Clientes',
      subtitle: 'Registrar abonos y cobros',
      to: '/admin/clientes',
      icon: CreditCard,
      color: 'text-emerald-500 bg-emerald-500/10',
    },
    {
      title: 'Personal de Taller',
      subtitle: 'Administración de técnicos y mecánicos',
      to: '/admin/personal',
      icon: Users,
      color: 'text-rose-500 bg-rose-500/10',
    },
    {
      title: 'Configuración / Variables',
      subtitle: 'Parámetros e IVA del sistema',
      to: '/admin/variables',
      icon: Settings,
      color: 'text-cyan-500 bg-cyan-500/10',
    },
  ];

  return (
    <div className="bg-card p-6 rounded-2xl border border-border/80 shadow-xs flex flex-col justify-between h-full">
      <div className="mb-4">
        <h3 className="text-base font-bold text-foreground">
          Accesos Rápidos
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Las 5 funcionalidades más relevantes del taller
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions.map((act, index) => {
          const Icon = act.icon;
          return (
            <Link
              key={index}
              to={act.to}
              className="p-3.5 rounded-xl border border-border/70 hover:border-primary/40 bg-muted/20 hover:bg-muted/50 transition-all duration-200 flex items-center justify-between group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${act.color} transition-transform group-hover:scale-105`}
                >
                  <Icon size={18} />
                </div>
                <div className="truncate">
                  <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {act.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {act.subtitle}
                  </p>
                </div>
              </div>

              <ArrowUpRight
                size={16}
                className="text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0 ml-2"
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
};
