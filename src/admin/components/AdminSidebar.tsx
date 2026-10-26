import { NavLink } from 'react-router';
import {
  LayoutDashboard,
  ClipboardList,
  UserCog,
  Wrench,
  Car,
  Settings,
  User,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
}

export const AdminSidebar = ({ isOpen }: Props) => {
  const menuItems = [
    {
      label: 'Dashboard',
      to: '/admin',
      icon: LayoutDashboard,
      description: 'Vista general y métricas',
    },
    {
      label: 'Taller',
      to: '/admin/taller',
      icon: ClipboardList,
      description: 'Gestión de taller',
    },
    {
      label: 'Clientes',
      to: '/admin/clientes',
      icon: User,
      description: 'Gestión de clientes',
    },
    {
      label: 'Inventario y Servicios',
      to: '/admin/inventario-servicios',
      icon: Wrench,
      description: 'Gestión de inventario y servicios',
    },
    {
      label: 'Vehículos',
      to: '/admin/vehiculos',
      icon: Car,
      description: 'Gestión de vehículos',
    },
    {
      label: 'Personal',
      to: '/admin/personal',
      icon: UserCog,
      description: 'Administradores y personal técnico',
    },
    {
      label: 'Variables',
      to: '/admin/variables',
      icon: Settings,
      description: 'Configuración de variables del sistema',
    },
  ];

  return (
    <aside
      className={`fixed md:static inset-y-0 left-0 z-20 bg-card border-r border-border transition-all duration-300 ease-in-out flex flex-col shadow-xs ${isOpen
        ? 'w-64 translate-x-0'
        : 'w-0 -translate-x-full md:w-0 md:translate-x-0 overflow-hidden'
        }`}
    >
      <div className="p-4 border-b border-border/80">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Navegación Principal
        </h2>
      </div>

      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 font-semibold'
                  : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground hover:translate-x-0.5'
                }`
              }
            >
              <Icon size={19} className="shrink-0 transition-transform group-hover:scale-105" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border/80 text-xs text-center text-muted-foreground font-medium">
        Taller Mecánico Isabel v1.0
      </div>
    </aside>
  );
};
