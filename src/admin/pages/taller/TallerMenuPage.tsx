import { Link } from 'react-router';
import { Receipt, ArrowRight, Car, SquareText, Settings } from 'lucide-react';

export const TallerMenuPage = () => {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Taller
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestión de ordenes, presupuestos e ingresos.
        </p>
      </div>

      {/* Cards de Navegación según el boceto */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl pt-4">
        {/* Card 1: Ver Listado de Órdenes de Trabajo */}
        <Link
          to="/admin/taller/ordenes"
          className="group relative bg-card hover:bg-accent/40 border border-border/80 hover:border-emerald-500/50 rounded-2xl p-8 flex flex-col items-center justify-between min-h-[320px] transition-all duration-300 shadow-sm hover:shadow-xl cursor-pointer"
        >
          {/* Círculo central con ícono */}
          <div className="w-28 h-28 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 group-hover:border-emerald-500/40 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-inner">
            <SquareText className="w-12 h-12 text-emerald-500 group-hover:scale-110 transition-transform duration-300" />
          </div>

          {/* Texto del Card */}
          <div className="text-center my-6">
            <h2 className="text-xl font-bold text-foreground group-hover:text-emerald-500 transition-colors">
              Ver Listado de Órdenes de Trabajo
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Registro de órdenes de trabajo
            </p>
          </div>

          {/* Flecha inferior derecha */}
          <div className="w-full flex justify-end">
            <div className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 group-hover:translate-x-1">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </Link>

        {/* Card 2: Ver Listado de Presupuestos */}
        <Link
          to="/admin/taller/presupuestos"
          className="group relative bg-card hover:bg-accent/40 border border-border/80 hover:border-blue-500/50 rounded-2xl p-8 flex flex-col items-center justify-between min-h-[320px] transition-all duration-300 shadow-sm hover:shadow-xl cursor-pointer"
        >
          {/* Círculo central con ícono */}
          <div className="w-28 h-28 rounded-full bg-blue-500/10 border-2 border-blue-500/20 group-hover:border-blue-500/40 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-inner">
            <Receipt className="w-12 h-12 text-blue-500 group-hover:rotate-6 transition-transform duration-300" />
          </div>

          {/* Texto del Card */}
          <div className="text-center my-6">
            <h2 className="text-xl font-bold text-foreground group-hover:text-blue-500 transition-colors">
              Ver Listado de Presupuestos
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Control de presupuestos
            </p>
          </div>

          {/* Flecha inferior derecha */}
          <div className="w-full flex justify-end">
            <div className="p-2.5 rounded-full bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 group-hover:translate-x-1">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </Link>

        {/* Card 3: Ver Listado de Ingresos */}
        <Link
          to="/admin/taller/ingresos"
          className="group relative bg-card hover:bg-accent/40 border border-border/80 hover:border-indigo-500/50 rounded-2xl p-8 flex flex-col items-center justify-between min-h-[320px] transition-all duration-300 shadow-sm hover:shadow-xl cursor-pointer"
        >
          {/* Círculo central con ícono */}
          <div className="w-28 h-28 rounded-full bg-indigo-500/10 border-2 border-indigo-500/20 group-hover:border-indigo-500/40 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-inner">
            <Car className="w-12 h-12 text-indigo-500 group-hover:rotate-6 transition-transform duration-300" />
          </div>

          {/* Texto del Card */}
          <div className="text-center my-6">
            <h2 className="text-xl font-bold text-foreground group-hover:text-indigo-500 transition-colors">
              Ver Listado de Ingresos
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Control de ingresos de vehiculos al taller
            </p>
          </div>

          {/* Flecha inferior derecha */}
          <div className="w-full flex justify-end">
            <div className="p-2.5 rounded-full bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300 group-hover:translate-x-1">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </Link>

        {/* Card 4: Ver Listado de Tipos de Ordenes de Trabajo */}
        <Link
          to="/admin/taller/tipos-ordenes"
          className="group relative bg-card hover:bg-accent/40 border border-border/80 hover:border-orange-500/50 rounded-2xl p-8 flex flex-col items-center justify-between min-h-[320px] transition-all duration-300 shadow-sm hover:shadow-xl cursor-pointer"
        >
          {/* Círculo central con ícono */}
          <div className="w-28 h-28 rounded-full bg-orange-500/10 border-2 border-orange-500/20 group-hover:border-orange-500/40 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-inner">
            <Settings className="w-12 h-12 text-orange-500 group-hover:rotate-6 transition-transform duration-300" />
          </div>

          {/* Texto del Card */}
          <div className="text-center my-6">
            <h2 className="text-xl font-bold text-foreground group-hover:text-orange-500 transition-colors">
              Ver Listado de Tipos de Órdenes de Trabajo
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Control de tipos de órdenes de trabajo
            </p>
          </div>

          {/* Flecha inferior derecha */}
          <div className="w-full flex justify-end">
            <div className="p-2.5 rounded-full bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300 group-hover:translate-x-1">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </Link>
      </section>
    </div>
  );
};

export default TallerMenuPage;
