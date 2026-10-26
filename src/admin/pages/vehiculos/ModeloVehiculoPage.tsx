import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Plus,
  Filter,
  Wrench,
  Pencil,
} from 'lucide-react';
import { useModeloVehiculo } from '../../hooks/useModeloVehiculo';
import type { ModeloVehiculoItem } from '../../interfaces/modelo-vehiculo.interface';

export const ModeloVehiculoPage = () => {
  const navigate = useNavigate();
  const { modelosVehiculos, marcasVehiculos, isLoading } = useModeloVehiculo();

  // Opciones de filtrado: por nombre_modelo y nombre_marca
  const [nombreModeloFilter, setNombreModeloFilter] = useState('');
  const [nombreMarcaFilter, setNombreMarcaFilter] = useState('');

  // Paginación: Máximo 7 filas por página según el boceto
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Mapa de marcas de vehículos por id_marca_vehiculo para resolver el nombre de la marca
  const marcasMap = useMemo(() => {
    const map = new Map<number, string>();
    marcasVehiculos.forEach((m) => map.set(m.id_marca_vehiculo, m.nombre));
    return map;
  }, [marcasVehiculos]);

  // Filtrado de modelos
  const filteredModelos = useMemo(() => {
    return modelosVehiculos.filter((m: ModeloVehiculoItem) => {
      const nombreModelo = (m.nombre || '').toLowerCase();
      const nombreMarca = (m.marca?.nombre || marcasMap.get(m.id_marca_vehiculo) || '').toLowerCase();

      // 1. Filtro por nombre_modelo
      if (nombreModeloFilter.trim() && !nombreModelo.includes(nombreModeloFilter.trim().toLowerCase())) {
        return false;
      }

      // 2. Filtro por nombre_marca
      if (nombreMarcaFilter.trim() && !nombreMarca.includes(nombreMarcaFilter.trim().toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [modelosVehiculos, marcasMap, nombreModeloFilter, nombreMarcaFilter]);

  // Cálculo de paginación
  const totalPages = Math.ceil(filteredModelos.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedModelos = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    return filteredModelos.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredModelos, validCurrentPage, itemsPerPage]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. BARRA SUPERIOR: Título, Volver y Nuevo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Listado de Modelos de Vehículos
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Catálogo maestro de modelos de vehículos
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/vehiculos"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <Link
            to="/admin/vehiculos/modelos/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nuevo
          </Link>
        </div>
      </div>

      {/* 2. OPCIONES DE FILTRADO (por nombre_modelo y nombre_marca) */}
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

          {/* Filtro por nombre_marca */}
          <div>
            <input
              type="text"
              value={nombreMarcaFilter}
              onChange={(e) => {
                setNombreMarcaFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filtrar por nombre de marca..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* 3. TABLA DE MODELOS DE VEHICULOS (Máximo 7 filas por página según el boceto) */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                <th className="py-3 px-4 text-center">ID modelo</th>
                <th className="py-3 px-4 text-center">nombre (modelo)</th>
                <th className="py-3 px-4 text-center">nombre (marca)</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                      Cargando listado de modelos de vehículos...
                    </div>
                  </td>
                </tr>
              ) : paginatedModelos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">
                    <Wrench className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    No se encontraron modelos de vehículos con los filtros seleccionados
                  </td>
                </tr>
              ) : (
                paginatedModelos.map((modelo: ModeloVehiculoItem) => {
                  const nombreMarca = modelo.marca?.nombre || marcasMap.get(modelo.id_marca_vehiculo) || 'Sin marca';

                  return (
                    <tr
                      key={modelo.id_modelo_vehiculo}
                      className="hover:bg-accent/40 transition-colors"
                    >
                      {/* id_modelo */}
                      <td className="py-3.5 px-4 font-mono font-bold text-foreground text-center">
                        #{modelo.id_modelo_vehiculo}
                      </td>

                      {/* nombre (modelo) */}
                      <td className="py-3.5 px-4 font-semibold text-foreground text-center">
                        {modelo.nombre}
                      </td>

                      {/* nombre (marca) */}
                      <td className="py-3.5 px-4 text-foreground text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted/60 text-foreground border border-border/60">
                          {nombreMarca}
                        </span>
                      </td>

                      {/* Acciones: Editar */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/vehiculos/modelos/${modelo.id_modelo_vehiculo}`)}
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
              className={`w-8 h-8 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                validCurrentPage === pageNum
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

export default ModeloVehiculoPage;
