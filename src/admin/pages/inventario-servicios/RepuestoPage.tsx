import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Plus,
  Filter,
  Wrench,
  Pencil,
} from 'lucide-react';
import { useRepuestos } from '../../hooks/useRepuestos';
import type { RepuestoItem } from '../../interfaces/repuesto.interface';

export const RepuestoPage = () => {
  const navigate = useNavigate();
  const { repuestos, marcas, isLoading } = useRepuestos();

  // Opciones de filtrado: por nombre_modelo y nombre_marca_repuesto
  const [nombreModeloFilter, setNombreModeloFilter] = useState('');
  const [nombreMarcaFilter, setNombreMarcaFilter] = useState('');

  // Paginación: Máximo 7 filas por página según el boceto
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Mapa de marcas de repuesto por id_marca_repuesto para resolver su nombre
  const marcasMap = useMemo(() => {
    const map = new Map<number, string>();
    marcas.forEach((m) => map.set(m.id_marca_repuesto, m.nombre));
    return map;
  }, [marcas]);

  // Filtrado de repuestos
  const filteredRepuestos = useMemo(() => {
    return repuestos.filter((r: RepuestoItem) => {
      const modelo = (r.nombre_modelo || '').toLowerCase();
      const marcaNombre = (r.marca?.nombre || marcasMap.get(r.id_marca_repuesto) || '').toLowerCase();

      // 1. Filtro por nombre_modelo
      if (nombreModeloFilter.trim() && !modelo.includes(nombreModeloFilter.trim().toLowerCase())) {
        return false;
      }

      // 2. Filtro por nombre_marca_repuesto
      if (nombreMarcaFilter.trim() && !marcaNombre.includes(nombreMarcaFilter.trim().toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [repuestos, marcasMap, nombreModeloFilter, nombreMarcaFilter]);

  // Cálculo de paginación
  const totalPages = Math.ceil(filteredRepuestos.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedRepuestos = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    return filteredRepuestos.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRepuestos, validCurrentPage, itemsPerPage]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. BARRA SUPERIOR: Título, Volver y Nuevo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Listado de Repuestos
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Catálogo maestro de repuestos, costos y márgenes de ganancia
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/inventario-servicios"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <Link
            to="/admin/inventario-servicios/repuestos/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nuevo
          </Link>
        </div>
      </div>

      {/* 2. OPCIONES DE FILTRADO (por nombre_modelo, nombre_marca_repuesto) */}
      <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Filter className="w-3.5 h-3.5 text-blue-500" />
          Opciones de Filtrado
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Filtro por nombre_modelo */}
          <div>
            <input
              type="text"
              value={nombreModeloFilter}
              onChange={(e) => {
                setNombreModeloFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filtrar por nombre de modelo..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Filtro por nombre_marca_repuesto */}
          <div>
            <input
              type="text"
              value={nombreMarcaFilter}
              onChange={(e) => {
                setNombreMarcaFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filtrar por nombre de marca de repuesto..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* 3. TABLA DE REPUESTOS (Máximo 7 filas por página según el boceto) */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                <th className="py-3 px-4 text-center">ID repuesto</th>
                <th className="py-3 px-4 text-center">nombre (modelo)</th>
                <th className="py-3 px-4 text-center">nombre (marca)</th>
                <th className="py-3 px-4 text-center">ultimo costo compra unitario</th>
                <th className="py-3 px-4 text-center">monto de venta</th>
                <th className="py-3 px-4 text-center">utilidad</th>
                <th className="py-3 px-4 text-center">porcentaje de ganancia</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                      Cargando listado de repuestos...
                    </div>
                  </td>
                </tr>
              ) : paginatedRepuestos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    <Wrench className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    No se encontraron repuestos con los filtros seleccionados
                  </td>
                </tr>
              ) : (
                paginatedRepuestos.map((repuesto: RepuestoItem) => {
                  const nombreMarca = repuesto.marca?.nombre || marcasMap.get(repuesto.id_marca_repuesto) || 'Sin marca';

                  return (
                    <tr
                      key={repuesto.id_repuesto}
                      className="hover:bg-accent/40 transition-colors"
                    >
                      {/* id_repuesto */}
                      <td className="py-3.5 px-4 font-mono font-bold text-foreground text-center">
                        #{repuesto.id_repuesto}
                      </td>

                      {/* nombre (modelo) */}
                      <td className="py-3.5 px-4 font-semibold text-foreground text-center">
                        {repuesto.nombre_modelo}
                      </td>

                      {/* nombre (marca) */}
                      <td className="py-3.5 px-4 text-foreground text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted/60 text-foreground border border-border/60">
                          {nombreMarca}
                        </span>
                      </td>

                      {/* ultimo_costo_compra_unitario */}
                      <td className="py-3.5 px-4 text-center font-medium text-foreground">
                        ${Number(repuesto.ultimo_costo_compra_unitario || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      {/* monto_venta */}
                      <td className="py-3.5 px-4 text-center font-bold text-foreground">
                        ${Number(repuesto.monto_venta || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      {/* utilidad */}
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                        ${Number(repuesto.utilidad || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      {/* porcentaje ganancia */}
                      <td className="py-3.5 px-4 text-center font-semibold text-foreground">
                        {Number(repuesto.porcentaje_ganancia || 0).toFixed(2)}%
                      </td>

                      {/* Acciones: Editar */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/inventario-servicios/repuestos/${repuesto.id_repuesto}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer shadow-2xs"
                        >
                          <Pencil className="w-3.5 h-3.5 text-blue-500" />
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. PAGINACIÓN (Anterior, 1, 2, ..., Siguiente) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            disabled={validCurrentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Anterior
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`w-8 h-8 text-xs font-semibold rounded-lg transition-all cursor-pointer ${validCurrentPage === pageNum
                ? 'bg-blue-600 text-white shadow-sm font-bold'
                : 'bg-card border border-border/80 text-foreground hover:bg-accent'
                }`}
            >
              {pageNum}
            </button>
          ))}

          <button
            disabled={validCurrentPage === totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};

export default RepuestoPage;
