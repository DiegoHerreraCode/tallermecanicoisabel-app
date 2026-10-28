import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Plus,
  Filter,
  Car,
  Eye,
  Ban,
  Upload,
  // User,
  // Calendar,
  X,
  FileText,
} from 'lucide-react';
import { useIngresos } from '../../hooks/useIngresos';
import { useIngresoMutation } from '../../hooks/useIngresoMutation';
import type { IngresoItem } from '../../interfaces/ingreso.interface';

export const IngresoPage = () => {
  const {
    ingresos,
    vehiculos,
    clientes,
    modelosVehiculos,
    marcasVehiculos,
    tiposOrdenes,
    isLoading,
  } = useIngresos();

  const { anularIngreso, isAnulando, uploadPdfChecklist, isUploadingPdf } =
    useIngresoMutation();

  const navigate = useNavigate();

  // Filtros según boceto: id_ingreso, tipo de orden, modelo/marca, placa, nombre/cedula, estado, fecha desde y fecha hasta
  const [idIngresoFilter, setIdIngresoFilter] = useState('');
  const [tipoOrdenFilter, setTipoOrdenFilter] = useState('');
  const [modeloMarcaFilter, setModeloMarcaFilter] = useState('');
  const [placaFilter, setPlacaFilter] = useState('');
  const [clienteFilter, setClienteFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [fechaDesdeFilter, setFechaDesdeFilter] = useState('');
  const [fechaHastaFilter, setFechaHastaFilter] = useState('');

  // Paginación: 7 filas por página
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Estados para modales
  const [selectedIngresoDetalle, setSelectedIngresoDetalle] =
    useState<IngresoItem | null>(null);
  const [ingresoParaAnular, setIngresoParaAnular] =
    useState<IngresoItem | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [ingresoParaPdf, setIngresoParaPdf] = useState<IngresoItem | null>(
    null
  );
  const [archivoPdf, setArchivoPdf] = useState<File | null>(null);

  // Mapas para resolver relaciones rápidamente
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

  const vehiculosMap = useMemo(() => {
    const map = new Map<
      number,
      {
        placa: string;
        idCliente: number;
        idModelo: number;
        annio: string;
      }
    >();
    vehiculos.forEach((v) => {
      map.set(v.id_vehiculo, {
        placa: v.placa,
        idCliente: v.id_cliente,
        idModelo: v.id_modelo_vehiculo,
        annio: v.annio,
      });
    });
    return map;
  }, [vehiculos]);

  const tiposOrdenesMap = useMemo(() => {
    const map = new Map<number, string>();
    tiposOrdenes.forEach((to) => map.set(to.id_tipo_orden, to.nombre));
    // Defaults por si no cargan de la api
    map.set(1, 'diagnostico');
    map.set(2, 'reparacion');
    map.set(3, 'mantenimiento');
    return map;
  }, [tiposOrdenes]);

  // Helper para resolver los datos completos de un ingreso
  const getIngresoResolvedData = (ingreso: IngresoItem) => {
    const vehiculoData =
      ingreso.vehiculo || vehiculosMap.get(ingreso.id_vehiculo);
    const placa = vehiculoData?.placa || '';
    const idCliente =
      ingreso.vehiculo?.id_cliente ||
      (vehiculoData && 'idCliente' in vehiculoData
        ? vehiculoData.idCliente
        : 0) ||
      0;
    const clienteData =
      ingreso.vehiculo?.cliente || clientesMap.get(idCliente);
    const clienteNombre = clienteData?.nombre || 'Sin cliente';
    const clienteCedula = clienteData?.cedula || '';

    const idModelo =
      ingreso.vehiculo?.id_modelo_vehiculo ||
      (vehiculoData && 'idModelo' in vehiculoData
        ? vehiculoData.idModelo
        : 0) ||
      0;
    const modeloData =
      ingreso.vehiculo?.modelo || modelosMap.get(idModelo);
    const modeloNombre =
      ingreso.vehiculo?.modelo?.nombre ||
      (modeloData && 'nombre' in modeloData ? modeloData.nombre : '') ||
      'N/A';
    const rawMarca =
      ingreso.vehiculo?.modelo?.marca?.nombre ||
      (modeloData && 'marca' in modeloData
        ? typeof modeloData.marca === 'object' && modeloData.marca !== null
          ? (modeloData.marca as { nombre?: string }).nombre || ''
          : String(modeloData.marca || '')
        : '') ||
      'N/A';
    const marcaNombre: string = rawMarca;

    const tipoOrdenNombre =
      ingreso.tipo_orden?.nombre ||
      tiposOrdenesMap.get(ingreso.id_tipo_orden) ||
      `Tipo #${ingreso.id_tipo_orden}`;

    const fechaIngresoSolo = ingreso.fecha_ingreso
      ? ingreso.fecha_ingreso.substring(0, 10)
      : '';

    return {
      placa,
      clienteNombre,
      clienteCedula,
      modeloNombre,
      marcaNombre,
      tipoOrdenNombre,
      fechaIngresoSolo,
    };
  };

  // Filtrado reactivo de ingresos
  const filteredIngresos = useMemo(() => {
    return ingresos.filter((ing: IngresoItem) => {
      const resolved = getIngresoResolvedData(ing);

      // 1. Filtro por ID ingreso
      if (
        idIngresoFilter.trim() &&
        !String(ing.id_ingreso).includes(idIngresoFilter.trim())
      ) {
        return false;
      }

      // 2. Filtro por tipo de orden
      if (tipoOrdenFilter.trim()) {
        const queryTipo = tipoOrdenFilter.trim().toLowerCase();
        if (!resolved.tipoOrdenNombre.toLowerCase().includes(queryTipo)) {
          return false;
        }
      }

      // 3. Filtro por modelo/marca
      if (modeloMarcaFilter.trim()) {
        const queryMod = modeloMarcaFilter.trim().toLowerCase();
        if (
          !resolved.modeloNombre.toLowerCase().includes(queryMod) &&
          !resolved.marcaNombre.toLowerCase().includes(queryMod)
        ) {
          return false;
        }
      }

      // 4. Filtro por placa
      if (
        placaFilter.trim() &&
        !resolved.placa.toLowerCase().includes(placaFilter.trim().toLowerCase())
      ) {
        return false;
      }

      // 5. Filtro por cliente (nombre o cédula)
      if (clienteFilter.trim()) {
        const queryCli = clienteFilter.trim().toLowerCase();
        if (
          !resolved.clienteNombre.toLowerCase().includes(queryCli) &&
          !resolved.clienteCedula.toLowerCase().includes(queryCli)
        ) {
          return false;
        }
      }

      // 6. Filtro por estado
      if (estadoFilter.trim() && ing.estado !== estadoFilter) {
        return false;
      }

      // 7. Filtro fecha desde
      if (fechaDesdeFilter) {
        if (!resolved.fechaIngresoSolo || resolved.fechaIngresoSolo < fechaDesdeFilter) {
          return false;
        }
      }

      // 8. Filtro fecha hasta
      if (fechaHastaFilter) {
        if (!resolved.fechaIngresoSolo || resolved.fechaIngresoSolo > fechaHastaFilter) {
          return false;
        }
      }

      return true;
    });
  }, [
    ingresos,
    idIngresoFilter,
    tipoOrdenFilter,
    modeloMarcaFilter,
    placaFilter,
    clienteFilter,
    estadoFilter,
    fechaDesdeFilter,
    fechaHastaFilter,
    vehiculosMap,
    clientesMap,
    modelosMap,
    tiposOrdenesMap,
  ]);

  // Ordenar el arreglo FilteredIngresos por el campo last_update de forma descendente
  filteredIngresos.sort((a: IngresoItem, b: IngresoItem) => {
    if (a.last_update < b.last_update) return 1;
    if (a.last_update > b.last_update) return -1;
    return 0;
  });

  // Paginación
  const totalPages = Math.ceil(filteredIngresos.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedIngresos = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    return filteredIngresos.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredIngresos, validCurrentPage, itemsPerPage]);

  // Manejo de anulación
  const handleConfirmAnulacion = () => {
    if (!ingresoParaAnular) return;
    if (!motivoAnulacion.trim()) return;

    anularIngreso(
      {
        id: ingresoParaAnular.id_ingreso,
        payload: { motivo_anulacion: motivoAnulacion.trim() },
      },
      {
        onSuccess: () => {
          setIngresoParaAnular(null);
          setMotivoAnulacion('');
        },
      }
    );
  };

  // Manejo de subida de PDF
  const handleConfirmUploadPdf = () => {
    if (!ingresoParaPdf || !archivoPdf) return;

    uploadPdfChecklist(
      {
        id: ingresoParaPdf.id_ingreso,
        file: archivoPdf,
      },
      {
        onSuccess: () => {
          setIngresoParaPdf(null);
          setArchivoPdf(null);
        },
      }
    );
  };

  // Estilo de badge según estado
  const getEstadoBadgeClass = (estado: string) => {
    switch (estado) {
      case 'checklist_pendiente':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'esperando_orden':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'confirmando_presupuesto':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'orden_creada':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'anulado':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border/80';
    }
  };

  // Resuelve la URL pública del backend para el archivo PDF del checklist
  const getBackendChecklistUrl = (path?: string | null) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const baseUrlChecklist = import.meta.env.VITE_IMG_URL || 'http://localhost:8000';
    return `${baseUrlChecklist}/${path}`;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. BARRA SUPERIOR: Título, Volver y Nuevo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Listado de Ingresos
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Registro y control de ingresos de vehículos al taller
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/taller"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <Link
            to="/admin/taller/ingresos/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nuevo
          </Link>
        </div>
      </div>

      {/* 2. OPCIONES DE FILTRADO (según boceto) */}
      <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Filter className="w-3.5 h-3.5 text-blue-500" />
            Opciones de Filtrado
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* ID Ingreso */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              ID Ingreso
            </label>
            <input
              type="text"
              placeholder="Ej: 1, 2..."
              value={idIngresoFilter}
              onChange={(e) => {
                setIdIngresoFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Tipo de Orden */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Tipo de Orden
            </label>
            <select
              value={tipoOrdenFilter}
              onChange={(e) => {
                setTipoOrdenFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="">Todos los tipos...</option>
              <option value="diagnostico">Diagnóstico</option>
              <option value="reparacion">Reparación</option>
              <option value="mantenimiento">Mantenimiento</option>
            </select>
          </div>

          {/* Modelo / Marca */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Modelo / Marca
            </label>
            <input
              type="text"
              placeholder="Ej: Tucson, Hyundai..."
              value={modeloMarcaFilter}
              onChange={(e) => {
                setModeloMarcaFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Placa */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Placa
            </label>
            <input
              type="text"
              placeholder="Ej: ABC123..."
              value={placaFilter}
              onChange={(e) => {
                setPlacaFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Cliente (Nombre o Cédula) */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Nombre / Cédula
            </label>
            <input
              type="text"
              placeholder="Ej: Diego, 30.433.366..."
              value={clienteFilter}
              onChange={(e) => {
                setClienteFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Estado */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Estado
            </label>
            <select
              value={estadoFilter}
              onChange={(e) => {
                setEstadoFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="">Todos los estados...</option>
              <option value="checklist_pendiente">checklist_pendiente</option>
              <option value="esperando_orden">esperando_orden</option>
              <option value="confirmando_presupuesto">confirmando_presupuesto</option>
              <option value="orden_creada">orden_creada</option>
              <option value="anulado">anulado</option>
            </select>
          </div>

          {/* Fecha Desde */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Fecha Desde
            </label>
            <input
              type="date"
              value={fechaDesdeFilter}
              onChange={(e) => {
                setFechaDesdeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer"
            />
          </div>

          {/* Fecha Hasta */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Fecha Hasta
            </label>
            <input
              type="date"
              value={fechaHastaFilter}
              onChange={(e) => {
                setFechaHastaFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 3. TABLA DE INGRESOS (Máximo 7 filas por página según el boceto) */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                <th scope="col" className="py-3 px-4 text-center">
                  ID ingreso
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  tipo de orden
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  modelo/marca (vehiculo)
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  placa (vehiculo)
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  nombre (cliente)
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  fecha de ingreso
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  estado
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                      Cargando listado de ingresos...
                    </div>
                  </td>
                </tr>
              ) : paginatedIngresos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    <Car className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground">
                      No se encontraron ingresos
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      No hay registros que coincidan con los filtros aplicados o no hay ingresos registrados.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedIngresos.map((ing) => {
                  const resolved = getIngresoResolvedData(ing);
                  const isChecklistPendiente = ing.estado === 'checklist_pendiente';
                  const isEsperandoOrden = ing.estado === 'esperando_orden';
                  const isAnulado = ing.estado === 'anulado';
                  const isOrdenCreada = ing.estado === 'orden_creada';

                  return (
                    <tr
                      key={ing.id_ingreso}
                      className="hover:bg-accent/40 transition-colors"
                    >
                      {/* ID ingreso */}
                      <td className="py-3.5 px-4 font-mono font-bold text-foreground text-center">
                        #{ing.id_ingreso}
                      </td>

                      {/* Tipo de orden */}
                      <td className="py-3.5 px-4 text-center font-medium capitalize text-foreground">
                        {resolved.tipoOrdenNombre}
                      </td>

                      {/* Modelo / Marca */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-semibold text-foreground">
                            {resolved.modeloNombre}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {resolved.marcaNombre}
                          </span>
                        </div>
                      </td>

                      {/* Placa */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-muted text-foreground border border-border/80 font-mono tracking-wider">
                          {resolved.placa}
                        </span>
                      </td>

                      {/* Nombre (Cliente) */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-semibold text-foreground flex items-center gap-1.5 justify-center">
                            {/* <User className="w-3.5 h-3.5 text-blue-500" /> */}
                            {resolved.clienteNombre}
                          </span>
                          {resolved.clienteCedula && (
                            <span className="text-xs text-muted-foreground">
                              C.I. {resolved.clienteCedula}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Fecha de ingreso */}
                      <td className="py-3.5 px-4 text-center text-foreground font-medium">
                        <div className="inline-flex items-center gap-1 text-xs">
                          {/* <Calendar className="w-3 h-3 text-muted-foreground" /> */}
                          {resolved.fechaIngresoSolo || '—'}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getEstadoBadgeClass(
                            ing.estado
                          )}`}
                        >
                          {ing.estado}
                        </span>
                      </td>

                      {/* Acciones según boceto */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* 1. Botón Subir PDF (visible cuando checklist_pendiente) */}
                          {isChecklistPendiente && (
                            <button
                              type="button"
                              onClick={() => setIngresoParaPdf(ing)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer shadow-2xs"
                              title="Subir PDF Checklist"
                            >
                              <Upload className="w-3.5 h-3.5 text-blue-500" />
                              Subir pdf
                            </button>
                          )}

                          {/* 2. Botón Generar Orden (cuando esperando_orden) */}
                          {isEsperandoOrden && (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-card border border-primary/30 text-primary hover:bg-primary/10 transition-colors cursor-pointer shadow-2xs"
                              title="Generar nueva orden"
                              onClick={() => {
                                navigate(`/admin/taller/ordenes/new?id_ingreso=${ing.id_ingreso}`);
                              }}
                            >
                              Generar Orden
                            </button>
                          )}

                          {/* 3. Botón Generar Presupuesto (cuando esperando_orden) */}
                          {isEsperandoOrden && (
                            <button
                              type="button"
                              onClick={() => {
                                navigate(`/admin/taller/presupuestos/new?tipo=inicial&id_ingreso=${ing.id_ingreso}`);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-card border border-purple-500/30 text-purple-600 hover:bg-purple-500/10 transition-colors cursor-pointer shadow-2xs"
                              title="Generar Presupuesto Inicial"
                            >
                              Generar Presupuesto
                            </button>
                          )}

                          {/* 4. Botón Anular (disponible si no está anulado ni en orden_creada) */}
                          {!isAnulado && !isOrdenCreada && (
                            <button
                              type="button"
                              onClick={() => {
                                setIngresoParaAnular(ing);
                                setMotivoAnulacion('');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-card border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shadow-2xs"
                              title="Anular ingreso"
                            >
                              <Ban className="w-3.5 h-3.5 text-rose-500" />
                              Anular
                            </button>
                          )}

                          {/* 5. Botón Ver Detalle (siempre presente en todos los estados) */}
                          <button
                            type="button"
                            onClick={() => setSelectedIngresoDetalle(ing)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer shadow-2xs"
                            title="Ver detalle del ingreso"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-500" />
                            Ver Detalle
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

      {/* MODAL 1: Ver Detalle del Ingreso */}
      {selectedIngresoDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-card border border-border/80 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/80">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-500" />
                Detalle del Ingreso #{selectedIngresoDetalle.id_ingreso}
              </h3>
              <button
                onClick={() => setSelectedIngresoDetalle(null)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const res = getIngresoResolvedData(selectedIngresoDetalle);
              return (
                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="grid grid-cols-2 gap-3 bg-muted/40 p-3 rounded-xl border border-border/60">
                    <div>
                      <span className="text-muted-foreground block text-xs">
                        Tipo de Orden
                      </span>
                      <span className="font-semibold text-foreground capitalize">
                        {res.tipoOrdenNombre}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">
                        Estado
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getEstadoBadgeClass(
                          selectedIngresoDetalle.estado
                        )}`}
                      >
                        {selectedIngresoDetalle.estado}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">
                        Vehículo
                      </span>
                      <span className="font-semibold text-foreground">
                        {res.modeloNombre} ({res.marcaNombre})
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">
                        Placa
                      </span>
                      <span className="font-mono font-bold text-foreground">
                        {res.placa}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">
                        Cliente Propietario
                      </span>
                      <span className="font-semibold text-foreground">
                        {res.clienteNombre}
                      </span>
                      {res.clienteCedula && (
                        <span className="block text-xs text-muted-foreground">
                          C.I. {res.clienteCedula}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">
                        Fecha Ingreso
                      </span>
                      <span className="text-foreground">
                        {selectedIngresoDetalle.fecha_ingreso || '—'}
                      </span>
                    </div>
                  </div>

                  {/* Observaciones del cliente */}
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">
                      Observaciones del Cliente:
                    </label>
                    <div className="p-3 bg-background rounded-xl border border-border/80 text-foreground text-xs min-h-[60px] whitespace-pre-wrap">
                      {selectedIngresoDetalle.observaciones_cliente ||
                        'Sin observaciones registradas por el cliente.'}
                    </div>
                  </div>

                  {/* Si tiene archivo PDF de checklist agregar link para abrirlo en otra pestaña*/}
                  {selectedIngresoDetalle.pdf_checklist && (
                    <a
                      href={getBackendChecklistUrl(selectedIngresoDetalle.pdf_checklist) || ''}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cursor-pointer mb-3"
                    >
                      <div className="flex items-center gap-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 hover:border-blue-500/40 transition-colors cursor-pointer">
                        <FileText className="w-5 h-5 text-blue-500" />
                        <span className="text-sm font-semibold text-foreground">
                          Visualizar pdf de la revisión
                        </span>
                      </div>
                    </a>
                  )}

                  {/* Datos de Anulación si fue anulado */}
                  {selectedIngresoDetalle.estado === 'anulado' && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs space-y-1 mt-4">
                      <span className="font-bold text-rose-600 dark:text-rose-400 block">
                        Información de Anulación:
                      </span>
                      <p className="text-foreground">
                        <strong>Motivo:</strong>{' '}
                        {selectedIngresoDetalle.motivo_anulacion || 'No especificado'}
                      </p>
                      {selectedIngresoDetalle.fecha_anulacion && (
                        <p className="text-muted-foreground text-[11px]">
                          Fecha: {selectedIngresoDetalle.fecha_anulacion}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="flex justify-end pt-2 border-t border-border/80">
              <button
                type="button"
                onClick={() => setSelectedIngresoDetalle(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Anular Ingreso */}
      {ingresoParaAnular && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-card border border-border/80 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/80">
              <h3 className="text-lg font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <Ban className="w-5 h-5" />
                Anular Ingreso #{ingresoParaAnular.id_ingreso}
              </h3>
              <button
                onClick={() => setIngresoParaAnular(null)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-foreground">
              ¿Estás seguro de que deseas anular este ingreso de vehículo? Esta acción no se puede deshacer.
            </p>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Motivo de anulación <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={motivoAnulacion}
                onChange={(e) => setMotivoAnulacion(e.target.value)}
                placeholder="Ingresa la razón por la cual se anula el ingreso..."
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                required
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-border/80">
              <button
                type="button"
                onClick={() => setIngresoParaAnular(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!motivoAnulacion.trim() || isAnulando}
                onClick={handleConfirmAnulacion}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isAnulando ? 'Anulando...' : 'Confirmar Anulación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Subir PDF Checklist */}
      {ingresoParaPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-card border border-border/80 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/80">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-500" />
                Subir PDF de Checklist
              </h3>
              <button
                onClick={() => setIngresoParaPdf(null)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground">
              Adjunta el archivo PDF correspondiente al checklist del ingreso{' '}
              <strong className="text-foreground">#{ingresoParaPdf.id_ingreso}</strong>. Al subirlo, el estado pasará automáticamente a <span className="font-semibold text-blue-600 dark:text-blue-400">esperando_orden</span>.
            </p>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Archivo PDF <span className="text-rose-500">*</span>
              </label>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setArchivoPdf(file);
                }}
                className="w-full text-xs text-foreground file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-border/80">
              <button
                type="button"
                onClick={() => setIngresoParaPdf(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!archivoPdf || isUploadingPdf}
                onClick={handleConfirmUploadPdf}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isUploadingPdf ? 'Subiendo...' : 'Subir Archivo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IngresoPage;
