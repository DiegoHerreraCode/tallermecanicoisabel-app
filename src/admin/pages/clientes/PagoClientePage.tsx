import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Plus,
  Search,
  Receipt,
  Filter,
  Eye,
  X,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import { usePagosClientes } from '../../hooks/usePagosClientes';
import type { PagoClienteItem } from '../../interfaces/pago-cliente.interface';

export const PagoClientePage = () => {
  const navigate = useNavigate();
  const { pagos, clientes, isLoading, deletePago, isDeleting } = usePagosClientes();

  // Estados de filtrado
  const [searchTerm, setSearchTerm] = useState('');
  const [idOrdenFilter, setIdOrdenFilter] = useState('');
  const [metodoPagoFilter, setMetodoPagoFilter] = useState<'all' | 'transferencia' | 'efectivo' | 'cheque'>('all');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Paginación: Máximo 7 filas por página según el boceto
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Modal Pop-up para Eliminar Pago
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPagoId, setSelectedPagoId] = useState<number | null>(null);

  // Mapa de Clientes por ID para resolver Nombre y RUT
  const clientesMap = useMemo(() => {
    const map = new Map<number, (typeof clientes)[0]>();
    clientes.forEach((c) => map.set(c.id_cliente, c));
    return map;
  }, [clientes]);

  // Filtrado de pagos
  const filteredPagos = useMemo(() => {
    return pagos.filter((p: PagoClienteItem) => {
      const cliente = clientesMap.get(p.id_cliente);
      const nombreCliente = (cliente?.nombre || p.cliente?.nombre || '').toLowerCase();
      const cedulaCliente = (cliente?.cedula || '').toLowerCase();
      const term = searchTerm.toLowerCase().trim();

      // 1. Filtro de texto: Nombre o RUT del cliente
      if (term && !nombreCliente.includes(term) && !cedulaCliente.includes(term)) {
        return false;
      }

      // 2. Filtro por id_orden
      if (idOrdenFilter.trim() && String(p.id_orden) !== idOrdenFilter.trim()) {
        return false;
      }

      // 3. Filtro por método de pago
      if (metodoPagoFilter !== 'all' && (p.metodo_pago || '').toLowerCase() !== metodoPagoFilter) {
        return false;
      }

      // 4. Filtro por fechas
      const fechaLimpia = p.fecha_pago ? p.fecha_pago.split('T')[0].split(' ')[0] : '';
      if (fechaDesde && fechaLimpia && fechaLimpia < fechaDesde) {
        return false;
      }
      if (fechaHasta && fechaLimpia && fechaLimpia > fechaHasta) {
        return false;
      }

      return true;
    });
  }, [pagos, clientesMap, searchTerm, idOrdenFilter, metodoPagoFilter, fechaDesde, fechaHasta]);

  // Ordenar el arreglo FilteredPagos por el campo id_pago_cliente de forma descendente
  filteredPagos.sort((a: PagoClienteItem, b: PagoClienteItem) => {
    if (a.id_pago_cliente < b.id_pago_cliente) return 1;
    if (a.id_pago_cliente > b.id_pago_cliente) return -1;
    return 0;
  });

  // Cálculo de paginación
  const totalPages = Math.ceil(filteredPagos.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedPagos = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    return filteredPagos.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPagos, validCurrentPage, itemsPerPage]);

  const handleOpenAnularModal = (id_pago: number) => {
    setSelectedPagoId(id_pago);
    setIsModalOpen(true);
  };

  const handleConfirmAnulacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPagoId) return;

    try {
      await deletePago({ id: selectedPagoId });
      setIsModalOpen(false);
      setSelectedPagoId(null);
    } catch {
      // Manejado por onError en el hook
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. BARRA SUPERIOR: Título, Volver y Nuevo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Listado de Pagos de Clientes
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Registro de cobros y abonos aplicados a órdenes de trabajo
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/clientes"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <Link
            to="/admin/clientes/pagos-clientes/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nuevo
          </Link>
        </div>
      </div>

      {/* 2. OPCIONES DE FILTRADO (nombre, cedula, id_orden, metodo_pago, fecha desde y fecha hasta) */}
      <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Filter className="w-3.5 h-3.5 text-blue-500" />
          Filtros de Búsqueda
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Buscador de Nombre o cedula */}
          <div className="sm:col-span-2 lg:col-span-4 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por nombre o cedula de cliente..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Filtro por ID de Orden */}
          <div className="lg:col-span-2">
            <input
              type="number"
              value={idOrdenFilter}
              onChange={(e) => {
                setIdOrdenFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="ID Orden..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Filtro por Método de Pago */}
          <div className="lg:col-span-3">
            <select
              value={metodoPagoFilter}
              onChange={(e) => {
                setMetodoPagoFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            >
              <option value="all">Método: Todos</option>
              <option value="transferencia">Transferencia</option>
              <option value="efectivo">Efectivo</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>

          {/* Rango de Fechas con etiquetas claras y espacio generoso */}
          <div className="sm:col-span-2 lg:col-span-6 flex flex-col sm:flex-row items-center gap-2 bg-background/50 border border-border/60 p-1.5 px-3 rounded-xl">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Desde:</span>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => {
                setFechaDesde(e.target.value);
                setCurrentPage(1);
              }}
              title="Fecha de pago desde"
              className="w-full px-2.5 py-1.5 text-xs sm:text-sm rounded-lg bg-background border border-border/70 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-6 flex flex-col sm:flex-row items-center gap-2 bg-background/50 border border-border/60 p-1.5 px-3 rounded-xl">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Hasta:</span>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => {
                setFechaHasta(e.target.value);
                setCurrentPage(1);
              }}
              title="Fecha de pago hasta"
              className="w-full px-2.5 py-1.5 text-xs sm:text-sm rounded-lg bg-background border border-border/70 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* 3. TABLA DE PAGOS DE CLIENTES (Máximo 7 filas por página según el boceto) */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                <th className="py-3 px-4 text-center">ID orden</th>
                <th className="py-3 px-4 text-center">nombre (del cliente)</th>
                <th className="py-3 px-4 text-center">cedula (del cliente)</th>
                <th className="py-3 px-4 text-center">monto ($)</th>
                <th className="py-3 px-4 text-center">metodo pago</th>
                <th className="py-3 px-4 text-center">fecha pago</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                      Cargando pagos de clientes...
                    </div>
                  </td>
                </tr>
              ) : paginatedPagos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    <Receipt className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    No se encontraron pagos con los filtros seleccionados
                  </td>
                </tr>
              ) : (
                paginatedPagos.map((pago: PagoClienteItem) => {
                  const cliente = clientesMap.get(pago.id_cliente);
                  const nombreCliente = cliente?.nombre || pago.cliente?.nombre || 'Desconocido';
                  const cedulaCliente = cliente?.cedula || 'Sin Cédula';
                  const montoNum = Number(pago.monto || 0);
                  const fechaStr = pago.fecha_pago ? pago.fecha_pago.split('T')[0] : 'S/F';

                  return (
                    <tr
                      key={pago.id_pago_cliente}
                      className={`hover:bg-accent/40 transition-colors
                        }`}
                    >
                      {/* id_orden */}
                      <td className="py-3.5 px-4 font-bold text-foreground text-center">
                        #{pago.id_orden}
                      </td>

                      {/* nombre (del cliente) */}
                      <td className="py-3.5 px-4 font-medium text-foreground text-center">
                        {nombreCliente}
                      </td>

                      {/* cedula (del cliente) */}
                      <td className="py-3.5 px-4 text-muted-foreground text-center">
                        {cedulaCliente}
                      </td>

                      {/* monto ($) */}
                      <td className="py-3.5 px-4 text-center font-bold text-foreground">
                        ${montoNum.toLocaleString('es-CL')}
                      </td>

                      {/* metodo pago (justo despues de monto y antes de fecha pago) */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-accent/60 text-foreground border border-border/60">
                          {pago.metodo_pago || 'N/A'}
                        </span>
                      </td>

                      {/* fecha pago */}
                      <td className="py-3.5 px-4 text-muted-foreground text-center">
                        {fechaStr}
                      </td>

                      {/* Acciones: Ver Detalle y Eliminar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() =>
                              navigate(`/admin/clientes/pagos-clientes/${pago.id_pago_cliente}`)
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-500" />
                            Ver Detalle
                          </button>

                          <button
                            onClick={() => handleOpenAnularModal(pago.id_pago_cliente)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Eliminar
                          </button>
                        </div>
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
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            disabled={validCurrentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Anterior
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`w-8 h-8 text-xs font-semibold rounded-lg transition-all ${validCurrentPage === pageNum
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-card border border-border/80 text-foreground hover:bg-accent'
                }`}
            >
              {pageNum}
            </button>
          ))}

          <button
            disabled={validCurrentPage === totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* 5. POP-UP MODAL: Confirmar Eliminacion */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/80">
              <div className="flex items-center gap-2 text-rose-500 font-bold text-base">
                <AlertTriangle className="w-5 h-5" />
                Confirmar Eliminación del Pago  #{selectedPagoId}
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAnulacion} className="space-y-4">
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isDeleting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PagoClientePage;
