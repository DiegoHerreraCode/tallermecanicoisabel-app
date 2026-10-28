import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Plus,
  Filter,
  Car,
  Pencil,
  User,
  Tag,
} from 'lucide-react';
import { useVehiculos } from '../../hooks/useVehiculos';
import type { VehiculoItem } from '../../interfaces/vehiculo.interface';

export const VehiculoPage = () => {
  const navigate = useNavigate();
  const {
    vehiculos,
    clientes,
    tiposVehiculos,
    modelosVehiculos,
    marcasVehiculos,
    isLoading,
  } = useVehiculos();

  // Filtros de búsqueda
  const [placaFilter, setPlacaFilter] = useState('');
  const [clienteFilter, setClienteFilter] = useState('');
  const [modeloMarcaFilter, setModeloMarcaFilter] = useState('');

  // Paginación: 7 filas por página
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Mapas para resolver relaciones en caso de no venir embebidas
  const clientesMap = useMemo(() => {
    const map = new Map<number, { nombre: string; cedula: string }>();
    clientes.forEach((c) =>
      map.set(c.id_cliente, { nombre: c.nombre, cedula: c.cedula })
    );
    return map;
  }, [clientes]);

  const marcasMap = useMemo(() => {
    const map = new Map<number, string>();
    marcasVehiculos.forEach((m) => map.set(m.id_marca_vehiculo, m.nombre));
    return map;
  }, [marcasVehiculos]);

  const modelosMap = useMemo(() => {
    const map = new Map<number, { nombre: string; marca: string }>();
    modelosVehiculos.forEach((mod) => {
      const marcaNombre =
        mod.marca?.nombre || marcasMap.get(mod.id_marca_vehiculo) || '';
      map.set(mod.id_modelo_vehiculo, {
        nombre: mod.nombre,
        marca: marcaNombre,
      });
    });
    return map;
  }, [modelosVehiculos, marcasMap]);

  const tiposMap = useMemo(() => {
    const map = new Map<number, string>();
    tiposVehiculos.forEach((t) => map.set(t.id_tipo_vehiculo, t.nombre));
    return map;
  }, [tiposVehiculos]);

  // Filtrado reactivo de vehículos
  const filteredVehiculos = useMemo(() => {
    return vehiculos.filter((v: VehiculoItem) => {
      const placa = (v.placa || '').toLowerCase();

      // Resolver cliente
      const clienteData = clientesMap.get(v.id_cliente);
      const clienteNombre = (
        v.cliente?.nombre || clienteData?.nombre || ''
      ).toLowerCase();
      const clienteCedula = (
        v.cliente?.cedula || clienteData?.cedula || ''
      ).toLowerCase();

      // Resolver modelo y marca
      const modeloData = modelosMap.get(v.id_modelo_vehiculo);
      const modeloNombre = (
        v.modelo?.nombre || modeloData?.nombre || ''
      ).toLowerCase();
      const marcaNombre = (
        v.modelo?.marca?.nombre || modeloData?.marca || ''
      ).toLowerCase();

      // 1. Filtro por placa
      if (
        placaFilter.trim() &&
        !placa.includes(placaFilter.trim().toLowerCase())
      ) {
        return false;
      }

      // 2. Filtro por cliente (nombre o cédula)
      if (clienteFilter.trim()) {
        const queryCliente = clienteFilter.trim().toLowerCase();
        if (
          !clienteNombre.includes(queryCliente) &&
          !clienteCedula.includes(queryCliente)
        ) {
          return false;
        }
      }

      // 3. Filtro por modelo o marca
      if (modeloMarcaFilter.trim()) {
        const queryMod = modeloMarcaFilter.trim().toLowerCase();
        if (
          !modeloNombre.includes(queryMod) &&
          !marcaNombre.includes(queryMod)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    vehiculos,
    clientesMap,
    modelosMap,
    placaFilter,
    clienteFilter,
    modeloMarcaFilter,
  ]);

  // Ordenar el arreglo FilteredVehiculos por el campo id_vehiculo de forma descendente
  filteredVehiculos.sort((a: VehiculoItem, b: VehiculoItem) => {
    if (a.id_vehiculo < b.id_vehiculo) return 1;
    if (a.id_vehiculo > b.id_vehiculo) return -1;
    return 0;
  });

  // Paginación
  const totalPages = Math.ceil(filteredVehiculos.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedVehiculos = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    return filteredVehiculos.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredVehiculos, validCurrentPage, itemsPerPage]);

  return (
    <div className="space-y-6">
      {/* 1. BARRA SUPERIOR: Título, Volver y Nuevo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Listado de Vehículos
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Catálogo maestro de vehiculos
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
            to="/admin/vehiculos/listado/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nuevo
          </Link>
        </div>
      </div>

      {/* 2. OPCIONES DE FILTRADO */}
      <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Filter className="w-3.5 h-3.5 text-blue-500" />
          Opciones de Filtrado
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Placa del Vehículo
            </label>
            <input
              type="text"
              placeholder="Buscar por placa..."
              value={placaFilter}
              onChange={(e) => {
                setPlacaFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Cliente (Nombre o Cédula)
            </label>
            <input
              type="text"
              placeholder="Buscar por cliente..."
              value={clienteFilter}
              onChange={(e) => {
                setClienteFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Modelo o Marca
            </label>
            <input
              type="text"
              placeholder="Buscar por modelo o marca..."
              value={modeloMarcaFilter}
              onChange={(e) => {
                setModeloMarcaFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* 3. TABLA DE VEHÍCULOS (Máximo 7 filas por página) */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                <th scope="col" className="py-3 px-4 text-center">
                  ID Vehículo
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  Placa
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  Año
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  Cliente
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  Tipo
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  Modelo / Marca
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                      Cargando listado de vehículos...
                    </div>
                  </td>
                </tr>
              ) : paginatedVehiculos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    <Car className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground">
                      No se encontraron vehículos
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      {placaFilter || clienteFilter || modeloMarcaFilter
                        ? 'No hay registros que coincidan con los filtros aplicados.'
                        : 'Aún no hay vehículos registrados en el taller.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedVehiculos.map((v) => {
                  const clienteInfo = clientesMap.get(v.id_cliente);
                  const clienteNombre = v.cliente?.nombre || clienteInfo?.nombre || 'Sin cliente';
                  const clienteCedula = v.cliente?.cedula || clienteInfo?.cedula || '';

                  const modeloInfo = modelosMap.get(v.id_modelo_vehiculo);
                  const modeloNombre = v.modelo?.nombre || modeloInfo?.nombre || 'N/A';
                  const marcaNombre = v.modelo?.marca?.nombre || modeloInfo?.marca || 'N/A';

                  const tipoNombre =
                    v.tipo_vehiculo?.nombre || tiposMap.get(v.id_tipo_vehiculo) || 'N/A';

                  return (
                    <tr
                      key={v.id_vehiculo}
                      className="hover:bg-accent/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-foreground text-center">
                        #{v.id_vehiculo}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-muted text-foreground border border-border/80 font-mono tracking-wider">
                          {v.placa}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center text-foreground font-medium">
                        {v.annio || '—'}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-semibold text-foreground flex items-center gap-1.5 justify-center">
                            <User className="w-3.5 h-3.5 text-blue-500" />
                            {clienteNombre}
                          </span>
                          {clienteCedula && (
                            <span className="text-xs text-muted-foreground">
                              C.I. {clienteCedula}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          <Tag className="w-3 h-3" />
                          {tipoNombre}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-semibold text-foreground">
                            {modeloNombre}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {marcaNombre}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/admin/vehiculos/listado/${v.id_vehiculo}`)
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer shadow-2xs"
                          title="Editar vehículo"
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
