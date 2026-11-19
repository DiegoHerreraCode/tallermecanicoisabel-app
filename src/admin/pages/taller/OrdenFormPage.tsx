import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Calendar,
  Plus,
  Trash2,
  Search,
  FileText,
  AlertCircle,
  Pencil,
  FilePlus,
  Save,
  X,
  UserCheck,
  Play,
  CheckCircle2,
  CheckCircle,
  Receipt,
  Eye,
} from 'lucide-react';

import { useAppNavigation } from '../../hooks/useAppNavigation';
import { getOrdenByIdAction } from '../../actions/get-orden-by-id.action';
import { getIngresoByIdAction } from '../../actions/get-ingreso-by-id.action';
import { getRepuestosAction } from '../../actions/get-repuestos.action';
import { getServiciosTallerAction } from '../../actions/get-servicios-taller.action';
import { getVariablesAction } from '../../actions/get-variables.action';
import { getHallazgosTecnicosAction } from '../../actions/get-hallazgos-tecnicos.action';
import { getPersonalAction } from '../../actions/get-personal.action';
import { useOrdenMutation } from '../../hooks/useOrdenMutation';

import type { RepuestoItem } from '../../interfaces/repuesto.interface';
import type { ServicioTallerItem } from '../../interfaces/servicio-taller.interface';

// Interface para las líneas en la tabla de repuestos seleccionados
interface RepuestoLineState {
  id_repuesto: number;
  nombre: string;
  cantidad: number;
  cantidad_cubierta_garantia: number;
  costo_unitario: number;
  monto_total_linea_costo: number;
  porcentaje_ganancia: number;
  costo_unitario_con_ganancia: number; // precio_unitario
  monto_total_linea_con_ganancia: number; // monto_total_linea
}

// Interface para las líneas en la tabla de servicios seleccionados
interface ServicioLineState {
  id_orden_servicio_taller?: number;
  id_servicio_taller: number;
  id_personal?: number | null;
  personal_nombre?: string;
  estado: string; // 'pendiente_asignacion' | 'en_espera' | 'en_proceso' | 'en_pausa' | 'finalizado' | 'anulado'
  nombre: string;
  cantidad: number;
  cantidad_cubierta_garantia: number;
  costo_unitario: number;
  monto_total_linea_costo: number;
  porcentaje_ganancia: number;
  costo_unitario_con_ganancia: number; // precio_unitario
  monto_total_linea_con_ganancia: number; // monto_total_linea
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
}

export const OrdenFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { goBack, navigate } = useAppNavigation();

  // Determinación de modo:
  // Si id === 'new', modo creación
  // Si id !== 'new', por defecto 'view' (Ver Detalle), o 'edit' si está editando directamente
  const isNew = id === 'new';
  const queryIngresoId = searchParams.get('id_ingreso');

  const [mode, setMode] = useState<'create' | 'view' | 'edit'>(
    isNew ? 'create' : 'view'
  );

  // Sincronizar el modo si la URL cambia (por ejemplo de 'new' a ':id' o viceversa)
  useEffect(() => {
    if (isNew) {
      setMode('create');
    } else {
      setMode('view');
    }
  }, [id, isNew]);

  const {
    createOrden,
    isCreating,
    updateOrden,
    isUpdating,
    createHallazgo,
    isCreatingHallazgo,
    deleteHallazgo,
    isDeletingHallazgo,
    updateServicio,
    isUpdatingServicio,
    finalizarOrden,
    isFinalizandoOrden,
  } = useOrdenMutation();

  // Modal para confirmar finalización de orden en modo view
  const [showFinalizarModal, setShowFinalizarModal] = useState(false);

  // 1. Consultar Orden si no es new
  const { data: ordenData, isLoading: isLoadingOrden } = useQuery({
    queryKey: ['orden-item', id],
    queryFn: () => getOrdenByIdAction(id!),
    enabled: !isNew && !!id,
  });

  // 2. Determinar id_ingreso
  const effectiveIngresoId = isNew ? queryIngresoId : ordenData?.id_ingreso;

  // 3. Consultar Ingreso asociado para obtener datos del cliente, vehículo y observaciones
  const { data: ingresoData, isLoading: isLoadingIngreso } = useQuery({
    queryKey: ['ingreso-item', effectiveIngresoId],
    queryFn: () => getIngresoByIdAction(effectiveIngresoId!),
    enabled: !!effectiveIngresoId,
  });

  // 4. Catálogos: Repuestos y Servicios
  const { data: allRepuestos = [] } = useQuery({
    queryKey: ['repuestos-listado'],
    queryFn: getRepuestosAction,
  });

  const { data: allServicios = [] } = useQuery({
    queryKey: ['servicios-taller-listado'],
    queryFn: getServiciosTallerAction,
  });

  // 4.1 Catálogo de Personal
  const { data: allPersonal = [] } = useQuery({
    queryKey: ['personal-listado'],
    queryFn: getPersonalAction,
  });

  // 5. Variables (para modo de cálculo de ganancia y porcentaje IVA)
  const { data: variables = [] } = useQuery({
    queryKey: ['variables-listado'],
    queryFn: getVariablesAction,
  });

  // Determinar la variable de calculo_ganancia ('sobre_costo' vs 'sobre_venta')
  const modoCalculo = useMemo(() => {
    const v = variables.find((item) => item.nombre === 'calculo_ganancia');
    return v?.valor === 'sobre_costo' ? 'sobre_costo' : 'sobre_venta';
  }, [variables]);

  // Obtener porcentaje de IVA:
  // Si la orden ya existe (modo view o edit), se toma el porcentaje_iva de la orden.
  // Si es una orden nueva, se obtiene de la tabla variables (por defecto 19 si no está definido).
  const ivaPercentage = useMemo(() => {
    if (!isNew && ordenData?.porcentaje_iva !== undefined && ordenData?.porcentaje_iva !== null) {
      const parsedOrdenIva = Number(ordenData.porcentaje_iva);
      if (!isNaN(parsedOrdenIva)) {
        return parsedOrdenIva;
      }
    }

    const varIva = variables.find((v) =>
      v.nombre.toLowerCase().includes('iva')
    );
    if (varIva && !isNaN(Number(varIva.valor))) {
      return Number(varIva.valor);
    }
    return 19;
  }, [isNew, ordenData?.porcentaje_iva, variables]);

  // Función utilitaria para calcular precio unitario con ganancia según modoCalculo
  const calcularPrecioConGanancia = (costo: number, porcentajeGanancia: number): number => {
    const c = Number(costo) || 0;
    const p = Number(porcentajeGanancia) || 0;
    if (c <= 0) return 0;

    let v = 0;
    if (modoCalculo === 'sobre_costo') {
      // v = c * (1 + p / 100)
      v = c * (1 + p / 100);
    } else {
      // sobre_venta: v = c / (1 - p / 100) (siempre que p < 100)
      if (p < 100) {
        v = c / (1 - p / 100);
      } else {
        v = c * (1 + p / 100);
      }
    }
    return Number(v.toFixed(2));
  };

  // Función utilitaria para calcular porcentaje de ganancia a partir del precio unitario de venta (costo con ganancia)
  const calcularPorcentajeGanancia = (costo: number, precioVenta: number): number => {
    const c = Number(costo) || 0;
    const v = Number(precioVenta) || 0;
    const u = v - c;

    let p = 0;
    if (modoCalculo === 'sobre_costo') {
      p = c > 0 ? (u / c) * 100 : 0;
    } else {
      p = v > 0 ? (u / v) * 100 : 0;
    }
    return Number(p.toFixed(1));
  };

  // 6. Consultar hallazgos técnicos asociados a la orden
  const { data: hallazgosOrden = [] } = useQuery({
    queryKey: ['hallazgos-orden', id],
    queryFn: () => getHallazgosTecnicosAction({ idOrden: id! }),
    enabled: !isNew && !!id,
  });

  // 7. Consultar hallazgos técnicos asociados al ingreso vinculado
  const { data: hallazgosIngreso = [] } = useQuery({
    queryKey: ['hallazgos-ingreso', effectiveIngresoId],
    queryFn: () => getHallazgosTecnicosAction({ idIngreso: effectiveIngresoId! }),
    enabled: !!effectiveIngresoId,
  });

  // Lista unificada o combinada de hallazgos
  const hallazgos = useMemo(() => {
    if (isNew) {
      // Al crear una nueva orden a partir de un ingreso: mostrar los hallazgos del ingreso
      return hallazgosIngreso;
    }
    // En orden existente: combinar hallazgos del ingreso y hallazgos propios de la orden
    const map = new Map<number, typeof hallazgosOrden[0]>();
    hallazgosIngreso.forEach((h) => map.set(h.id_hallazgo_tecnico, h));
    hallazgosOrden.forEach((h) => map.set(h.id_hallazgo_tecnico, h));
    return Array.from(map.values()).sort(
      (a, b) => a.id_hallazgo_tecnico - b.id_hallazgo_tecnico
    );
  }, [isNew, hallazgosIngreso, hallazgosOrden]);

  // Estado del Formulario
  const [fechaFinTentativa, setFechaFinTentativa] = useState('');
  const [selectedRepuestos, setSelectedRepuestos] = useState<RepuestoLineState[]>([]);
  const [selectedServicios, setSelectedServicios] = useState<ServicioLineState[]>([]);

  // Búsquedas en los paneles laterales
  const [searchRepuesto, setSearchRepuesto] = useState('');
  const [searchServicio, setSearchServicio] = useState('');

  // Modal para registrar hallazgo técnico
  const [showHallazgoModal, setShowHallazgoModal] = useState(false);
  const [hallazgoTitulo, setHallazgoTitulo] = useState('');
  const [hallazgoDetalle, setHallazgoDetalle] = useState('');

  // Modal para asignar personal a un servicio del taller
  const [assignModalService, setAssignModalService] = useState<ServicioLineState | null>(null);
  const [selectedPersonalId, setSelectedPersonalId] = useState<string>('');

  // Función para restablecer los datos originales de la orden
  const resetOrdenData = () => {
    if (!ordenData) return;

    if (ordenData.fecha_fin_tentativa) {
      const f = ordenData.fecha_fin_tentativa.substring(0, 10);
      setFechaFinTentativa(f);
    } else {
      setFechaFinTentativa('');
    }

    // Repuestos de la orden
    if (ordenData.repuestos) {
      const loadedRep: RepuestoLineState[] = ordenData.repuestos.map((r) => {
        const matched = allRepuestos.find((item) => item.id_repuesto === r.id_repuesto);
        const costoUnit =
          r.costo_unitario_base !== undefined && r.costo_unitario_base !== null
            ? Number(r.costo_unitario_base)
            : Number(matched?.ultimo_costo_compra_unitario || 0);

        const precioUnitConGanancia = Number(r.precio_unitario || 0);
        const cant = Number(r.cantidad || 1);

        const pctGanancia =
          r.porcentaje_ganancia !== undefined && r.porcentaje_ganancia !== null
            ? Number(r.porcentaje_ganancia)
            : costoUnit > 0
              ? Number((((precioUnitConGanancia - costoUnit) / costoUnit) * 100).toFixed(1))
              : Number(matched?.porcentaje_ganancia || 0);

        const totalCostoBase =
          r.monto_total_linea_base !== undefined && r.monto_total_linea_base !== null
            ? Number(r.monto_total_linea_base)
            : Number((costoUnit * cant).toFixed(2));

        const totalLineaConGanancia =
          r.monto_total_linea !== undefined && r.monto_total_linea !== null
            ? Number(r.monto_total_linea)
            : Number((precioUnitConGanancia * cant).toFixed(2));

        const cantGarantia = Math.min(
          cant,
          Math.max(0, Number(r.cantidad_cubierta_garantia || 0))
        );

        return {
          id_repuesto: r.id_repuesto,
          nombre: matched?.nombre_modelo || `Repuesto #${r.id_repuesto}`,
          cantidad: cant,
          cantidad_cubierta_garantia: cantGarantia,
          costo_unitario: Number(costoUnit.toFixed(2)),
          monto_total_linea_costo: Number(totalCostoBase.toFixed(2)),
          porcentaje_ganancia: pctGanancia,
          costo_unitario_con_ganancia: Number(precioUnitConGanancia.toFixed(2)),
          monto_total_linea_con_ganancia: Number(totalLineaConGanancia.toFixed(2)),
        };
      });
      setSelectedRepuestos(loadedRep);
    } else {
      setSelectedRepuestos([]);
    }

    // Servicios de la orden
    if (ordenData.servicios_taller) {
      const loadedSrv: ServicioLineState[] = ordenData.servicios_taller.map((s) => {
        const matched = allServicios.find((item) => item.id_servicio_taller === s.id_servicio_taller);
        const costoUnit =
          s.costo_unitario_base !== undefined && s.costo_unitario_base !== null
            ? Number(s.costo_unitario_base)
            : Number(matched?.costo || 0);

        const precioUnitConGanancia = Number(s.precio_unitario || 0);
        const cant = Number(s.cantidad || 1);

        const pctGanancia =
          s.porcentaje_ganancia !== undefined && s.porcentaje_ganancia !== null
            ? Number(s.porcentaje_ganancia)
            : costoUnit > 0
              ? Number((((precioUnitConGanancia - costoUnit) / costoUnit) * 100).toFixed(1))
              : Number(matched?.porcentaje_ganancia || 0);

        const totalCostoBase =
          s.monto_total_linea_base !== undefined && s.monto_total_linea_base !== null
            ? Number(s.monto_total_linea_base)
            : Number((costoUnit * cant).toFixed(2));

        const totalLineaConGanancia =
          s.monto_total_linea !== undefined && s.monto_total_linea !== null
            ? Number(s.monto_total_linea)
            : Number((precioUnitConGanancia * cant).toFixed(2));

        let estadoFinal = s.estado || 'pendiente_asignacion';
        if (!s.estado && s.id_personal) {
          estadoFinal = 'en_espera';
        }

        const matchedPersonal = allPersonal.find((p) => p.id_personal === s.id_personal);
        const personalNombre = s.personal?.nombre || matchedPersonal?.nombre || '';

        const cantGarantia = Math.min(
          cant,
          Math.max(0, Number(s.cantidad_cubierta_garantia || 0))
        );

        return {
          id_orden_servicio_taller: s.id_orden_servicio_taller,
          id_servicio_taller: s.id_servicio_taller,
          id_personal: s.id_personal || null,
          personal_nombre: personalNombre,
          estado: estadoFinal,
          nombre: matched?.nombre || s.servicio_taller?.nombre || `Servicio #${s.id_servicio_taller}`,
          cantidad: cant,
          cantidad_cubierta_garantia: cantGarantia,
          costo_unitario: Number(costoUnit.toFixed(2)),
          monto_total_linea_costo: Number(totalCostoBase.toFixed(2)),
          porcentaje_ganancia: pctGanancia,
          costo_unitario_con_ganancia: Number(precioUnitConGanancia.toFixed(2)),
          monto_total_linea_con_ganancia: Number(totalLineaConGanancia.toFixed(2)),
          fecha_inicio: s.fecha_inicio || null,
          fecha_fin: s.fecha_fin || null,
        };
      });
      setSelectedServicios(loadedSrv);
    } else {
      setSelectedServicios([]);
    }
  };

  // Sincronizar datos al cargar la orden para view/edit
  useEffect(() => {
    resetOrdenData();
  }, [ordenData, allRepuestos, allServicios, allPersonal]);

  // Manejo de cancelación de la edición
  const handleCancelEdit = () => {
    resetOrdenData();
    setSearchRepuesto('');
    setSearchServicio('');
    setMode('view');
  };

  // Lista de repuestos disponibles filtrados por búsqueda y excluyendo los ya seleccionados
  const availableRepuestos = useMemo(() => {
    const selectedIds = new Set(selectedRepuestos.map((r) => r.id_repuesto));
    return allRepuestos.filter((r) => {
      if (selectedIds.has(r.id_repuesto)) return false;
      if (!searchRepuesto.trim()) return true;
      return r.nombre_modelo.toLowerCase().includes(searchRepuesto.trim().toLowerCase());
    });
  }, [allRepuestos, selectedRepuestos, searchRepuesto]);

  // Lista de servicios disponibles filtrados por búsqueda y excluyendo los ya seleccionados
  const availableServicios = useMemo(() => {
    const selectedIds = new Set(selectedServicios.map((s) => s.id_servicio_taller));
    return allServicios.filter((s) => {
      if (selectedIds.has(s.id_servicio_taller)) return false;
      if (!searchServicio.trim()) return true;
      return s.nombre.toLowerCase().includes(searchServicio.trim().toLowerCase());
    });
  }, [allServicios, selectedServicios, searchServicio]);

  // Handlers para Repuestos
  const handleAddRepuesto = (r: RepuestoItem) => {
    const costoUnit = Number(r.ultimo_costo_compra_unitario) || 0;
    const pctGanancia = Number(r.porcentaje_ganancia) || 0;
    const precioUnitConGanancia =
      Number(r.monto_venta) || calcularPrecioConGanancia(costoUnit, pctGanancia);
    const cant = 1;

    const newLine: RepuestoLineState = {
      id_repuesto: r.id_repuesto,
      nombre: r.nombre_modelo,
      cantidad: cant,
      cantidad_cubierta_garantia: 0,
      costo_unitario: Number(costoUnit.toFixed(2)),
      monto_total_linea_costo: Number((costoUnit * cant).toFixed(2)),
      porcentaje_ganancia: pctGanancia,
      costo_unitario_con_ganancia: Number(precioUnitConGanancia.toFixed(2)),
      monto_total_linea_con_ganancia: Number((precioUnitConGanancia * cant).toFixed(2)),
    };

    setSelectedRepuestos((prev) => [...prev, newLine]);
  };

  const handleRemoveRepuesto = (idRepuesto: number) => {
    setSelectedRepuestos((prev) => prev.filter((r) => r.id_repuesto !== idRepuesto));
  };

  const handleUpdateRepuestoCantidad = (idRepuesto: number, cantidad: number) => {
    const cant = Math.max(1, cantidad || 1);
    setSelectedRepuestos((prev) =>
      prev.map((r) => {
        if (r.id_repuesto !== idRepuesto) return r;
        const totalCosto = Number((r.costo_unitario * cant).toFixed(2));
        const totalConGanancia = Number((r.costo_unitario_con_ganancia * cant).toFixed(2));
        const nuevaCantGarantia = Math.min(cant, r.cantidad_cubierta_garantia);
        return {
          ...r,
          cantidad: cant,
          cantidad_cubierta_garantia: nuevaCantGarantia,
          monto_total_linea_costo: totalCosto,
          monto_total_linea_con_ganancia: totalConGanancia,
        };
      })
    );
  };

  const handleUpdateRepuestoGarantia = (idRepuesto: number, cantidadGarantia: number) => {
    setSelectedRepuestos((prev) =>
      prev.map((r) => {
        if (r.id_repuesto !== idRepuesto) return r;
        const validGarantia = Math.min(r.cantidad, Math.max(0, cantidadGarantia || 0));
        return {
          ...r,
          cantidad_cubierta_garantia: validGarantia,
        };
      })
    );
  };

  const handleUpdateRepuestoGanancia = (idRepuesto: number, porcentaje: number) => {
    const pct = Math.max(0, porcentaje || 0);
    setSelectedRepuestos((prev) =>
      prev.map((r) => {
        if (r.id_repuesto !== idRepuesto) return r;
        const unitConGanancia = calcularPrecioConGanancia(r.costo_unitario, pct);
        const totalConGanancia = Number((unitConGanancia * r.cantidad).toFixed(2));
        return {
          ...r,
          porcentaje_ganancia: pct,
          costo_unitario_con_ganancia: unitConGanancia,
          monto_total_linea_con_ganancia: totalConGanancia,
        };
      })
    );
  };

  const handleUpdateRepuestoPrecio = (idRepuesto: number, precio: number) => {
    const p = Math.max(0, precio || 0);
    setSelectedRepuestos((prev) =>
      prev.map((r) => {
        if (r.id_repuesto !== idRepuesto) return r;
        const pct = calcularPorcentajeGanancia(r.costo_unitario, p);
        const totalConGanancia = Number((p * r.cantidad).toFixed(2));
        return {
          ...r,
          porcentaje_ganancia: pct,
          costo_unitario_con_ganancia: Number(p.toFixed(2)),
          monto_total_linea_con_ganancia: totalConGanancia,
        };
      })
    );
  };

  // Handlers para Servicios
  const handleAddServicio = (s: ServicioTallerItem) => {
    const costoUnit = Number(s.costo) || 0;
    const pctGanancia = Number(s.porcentaje_ganancia) || 0;
    const precioUnitConGanancia =
      Number(s.monto_venta) || calcularPrecioConGanancia(costoUnit, pctGanancia);
    const cant = 1;

    const newLine: ServicioLineState = {
      id_servicio_taller: s.id_servicio_taller,
      nombre: s.nombre,
      estado: 'pendiente_asignacion',
      id_personal: null,
      personal_nombre: '',
      cantidad: cant,
      cantidad_cubierta_garantia: 0,
      costo_unitario: Number(costoUnit.toFixed(2)),
      monto_total_linea_costo: Number((costoUnit * cant).toFixed(2)),
      porcentaje_ganancia: pctGanancia,
      costo_unitario_con_ganancia: Number(precioUnitConGanancia.toFixed(2)),
      monto_total_linea_con_ganancia: Number((precioUnitConGanancia * cant).toFixed(2)),
    };

    setSelectedServicios((prev) => [...prev, newLine]);
  };

  const handleRemoveServicio = (idServicio: number) => {
    setSelectedServicios((prev) => prev.filter((s) => s.id_servicio_taller !== idServicio));
  };

  const handleUpdateServicioCantidad = (idServicio: number, cantidad: number) => {
    const cant = Math.max(1, cantidad || 1);
    setSelectedServicios((prev) =>
      prev.map((s) => {
        if (s.id_servicio_taller !== idServicio) return s;
        const totalCosto = Number((s.costo_unitario * cant).toFixed(2));
        const totalConGanancia = Number((s.costo_unitario_con_ganancia * cant).toFixed(2));
        const nuevaCantGarantia = Math.min(cant, s.cantidad_cubierta_garantia);
        return {
          ...s,
          cantidad: cant,
          cantidad_cubierta_garantia: nuevaCantGarantia,
          monto_total_linea_costo: totalCosto,
          monto_total_linea_con_ganancia: totalConGanancia,
        };
      })
    );
  };

  const handleUpdateServicioGarantia = (idServicio: number, cantidadGarantia: number) => {
    setSelectedServicios((prev) =>
      prev.map((s) => {
        if (s.id_servicio_taller !== idServicio) return s;
        const validGarantia = Math.min(s.cantidad, Math.max(0, cantidadGarantia || 0));
        return {
          ...s,
          cantidad_cubierta_garantia: validGarantia,
        };
      })
    );
  };

  // Acciones en lote para Garantía (Todos al 100% o Todos a 0)
  const areAllItemsFullyUnderWarranty = useMemo(() => {
    const allRepuestosFull =
      selectedRepuestos.length > 0 &&
      selectedRepuestos.every((r) => r.cantidad_cubierta_garantia === r.cantidad);
    const allServiciosFull =
      selectedServicios.length > 0 &&
      selectedServicios.every((s) => s.cantidad_cubierta_garantia === s.cantidad);

    if (selectedRepuestos.length === 0 && selectedServicios.length === 0) return false;
    if (selectedRepuestos.length > 0 && !allRepuestosFull) return false;
    if (selectedServicios.length > 0 && !allServiciosFull) return false;
    return true;
  }, [selectedRepuestos, selectedServicios]);

  const handleToggleAllWarranty = () => {
    const shouldCoverAll = !areAllItemsFullyUnderWarranty;
    setSelectedRepuestos((prev) =>
      prev.map((r) => ({
        ...r,
        cantidad_cubierta_garantia: shouldCoverAll ? r.cantidad : 0,
      }))
    );
    setSelectedServicios((prev) =>
      prev.map((s) => ({
        ...s,
        cantidad_cubierta_garantia: shouldCoverAll ? s.cantidad : 0,
      }))
    );
  };

  const handleUpdateServicioGanancia = (idServicio: number, porcentaje: number) => {
    const pct = Math.max(0, porcentaje || 0);
    setSelectedServicios((prev) =>
      prev.map((s) => {
        if (s.id_servicio_taller !== idServicio) return s;
        const unitConGanancia = calcularPrecioConGanancia(s.costo_unitario, pct);
        const totalConGanancia = Number((unitConGanancia * s.cantidad).toFixed(2));
        return {
          ...s,
          porcentaje_ganancia: pct,
          costo_unitario_con_ganancia: unitConGanancia,
          monto_total_linea_con_ganancia: totalConGanancia,
        };
      })
    );
  };

  const handleUpdateServicioPrecio = (idServicio: number, precio: number) => {
    const p = Math.max(0, precio || 0);
    setSelectedServicios((prev) =>
      prev.map((s) => {
        if (s.id_servicio_taller !== idServicio) return s;
        const pct = calcularPorcentajeGanancia(s.costo_unitario, p);
        const totalConGanancia = Number((p * s.cantidad).toFixed(2));
        return {
          ...s,
          porcentaje_ganancia: pct,
          costo_unitario_con_ganancia: Number(p.toFixed(2)),
          monto_total_linea_con_ganancia: totalConGanancia,
        };
      })
    );
  };

  // Handlers para Acciones de Estado del Servicio (en modo 'view')
  const handleOpenAssignModal = (servicio: ServicioLineState) => {
    setAssignModalService(servicio);
    setSelectedPersonalId(servicio.id_personal ? String(servicio.id_personal) : '');
  };

  const handleSaveAssignPersonal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalService?.id_orden_servicio_taller) {
      toast.error('No se pudo identificar el servicio de la orden');
      return;
    }
    if (!selectedPersonalId) {
      toast.error('Por favor seleccione un empleado');
      return;
    }

    const personalIdNum = Number(selectedPersonalId);
    updateServicio({
      id: assignModalService.id_orden_servicio_taller,
      payload: {
        id_personal: personalIdNum,
        estado: 'en_espera',
      },
      ordenId: id,
    });
    setAssignModalService(null);
  };

  const handleStartServicio = (servicio: ServicioLineState) => {
    if (!servicio.id_orden_servicio_taller) {
      toast.error('No se pudo identificar el servicio de la orden');
      return;
    }

    updateServicio({
      id: servicio.id_orden_servicio_taller,
      payload: {
        estado: 'en_proceso',
      },
      ordenId: id,
    });
  };

  const handleFinishServicio = (servicio: ServicioLineState) => {
    if (!servicio.id_orden_servicio_taller) {
      toast.error('No se pudo identificar el servicio de la orden');
      return;
    }

    updateServicio({
      id: servicio.id_orden_servicio_taller,
      payload: {
        estado: 'finalizado',
      },
      ordenId: id,
    });
  };

  // Cálculos de Data Económica
  const economicData = useMemo(() => {
    // Totales brutos
    const totalRepuestos = selectedRepuestos.reduce(
      (sum, r) => sum + r.monto_total_linea_con_ganancia,
      0
    );
    const totalServicios = selectedServicios.reduce(
      (sum, s) => sum + s.monto_total_linea_con_ganancia,
      0
    );

    // Subtotal cubierto por garantía
    const subtotalGarantiaRepuestos = selectedRepuestos.reduce((sum, r) => {
      const cantGarantia = Math.min(r.cantidad, Math.max(0, r.cantidad_cubierta_garantia || 0));
      return sum + cantGarantia * r.costo_unitario_con_ganancia;
    }, 0);

    const subtotalGarantiaServicios = selectedServicios.reduce((sum, s) => {
      const cantGarantia = Math.min(s.cantidad, Math.max(0, s.cantidad_cubierta_garantia || 0));
      return sum + cantGarantia * s.costo_unitario_con_ganancia;
    }, 0);

    const subtotal_garantia = Number((subtotalGarantiaRepuestos + subtotalGarantiaServicios).toFixed(2));

    // Subtotal cobrable (excluye garantía)
    const subtotalCobrableRepuestos = selectedRepuestos.reduce((sum, r) => {
      const cantGarantia = Math.min(r.cantidad, Math.max(0, r.cantidad_cubierta_garantia || 0));
      const cantCobrable = Math.max(0, r.cantidad - cantGarantia);
      return sum + cantCobrable * r.costo_unitario_con_ganancia;
    }, 0);

    const subtotalCobrableServicios = selectedServicios.reduce((sum, s) => {
      const cantGarantia = Math.min(s.cantidad, Math.max(0, s.cantidad_cubierta_garantia || 0));
      const cantCobrable = Math.max(0, s.cantidad - cantGarantia);
      return sum + cantCobrable * s.costo_unitario_con_ganancia;
    }, 0);

    const subtotal_cobrable = Number((subtotalCobrableRepuestos + subtotalCobrableServicios).toFixed(2));
    const monto_subtotal_bruto = Number((totalRepuestos + totalServicios).toFixed(2));

    // IVA solo sobre lo NO cubierto por garantía (subtotal_cobrable)
    const porcentaje_iva = ivaPercentage;
    const monto_iva = Number(((subtotal_cobrable * porcentaje_iva) / 100).toFixed(2));

    // Nueva lógica: monto_total es el reflejo de lo que el cliente debe pagar (subtotal cobrable + IVA)
    const monto_total = Number((subtotal_cobrable + monto_iva).toFixed(2));

    // Sumar todos los pagos ya registrados a la orden
    const totalPagado = Array.isArray(ordenData?.pagos)
      ? ordenData.pagos.reduce((sum, p) => sum + Number(p.monto || 0), 0)
      : 0;

    // Diferencia entre lo que debe pagar y lo que ya ha pagado
    const balance = Number((monto_total - totalPagado).toFixed(2));
    const monto_por_cobrar = balance > 0 ? balance : 0.00;
    const monto_a_favor = balance < 0 ? Math.abs(balance) : 0.00;

    return {
      monto_subtotal_bruto,
      monto_subtotal: subtotal_cobrable,
      subtotal_garantia,
      subtotal_cobrable,
      porcentaje_iva,
      monto_iva,
      monto_total,
      monto_por_cobrar,
      monto_a_favor,
      total_pagado: totalPagado,
    };
  }, [selectedRepuestos, selectedServicios, ivaPercentage, ordenData?.pagos]);

  // Submit Handler: Crear o Actualizar Orden
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fechaFinTentativa) {
      toast.warning('Por favor ingresa la fecha de finalización tentativa');
      return;
    }

    if (selectedServicios.length === 0) {
      toast.warning('Debes agregar al menos un servicio del taller a la orden');
      return;
    }

    const payloadRepuestos = selectedRepuestos.map((r) => ({
      id_repuesto: r.id_repuesto,
      costo_unitario_base: r.costo_unitario,
      precio_unitario: r.costo_unitario_con_ganancia,
      porcentaje_ganancia: r.porcentaje_ganancia,
      cantidad: r.cantidad,
      cantidad_cubierta_garantia: r.cantidad_cubierta_garantia,
      monto_total_linea_base: r.monto_total_linea_costo,
      monto_total_linea: r.monto_total_linea_con_ganancia,
    }));

    const payloadServicios = selectedServicios.map((s) => ({
      id_servicio_taller: s.id_servicio_taller,
      id_personal: s.id_personal || null,
      costo_unitario_base: s.costo_unitario,
      precio_unitario: s.costo_unitario_con_ganancia,
      porcentaje_ganancia: s.porcentaje_ganancia,
      cantidad: s.cantidad,
      cantidad_cubierta_garantia: s.cantidad_cubierta_garantia,
      monto_total_linea_base: s.monto_total_linea_costo,
      monto_total_linea: s.monto_total_linea_con_ganancia,
    }));

    if (mode === 'create') {
      if (!effectiveIngresoId) {
        toast.error('No se pudo identificar el ingreso asociado a la orden');
        return;
      }

      const idCliente = ingresoData?.vehiculo?.id_cliente || 1;
      const idTipoOrden = ingresoData?.id_tipo_orden || 1;

      createOrden({
        id_ingreso: Number(effectiveIngresoId),
        id_tipo_orden: Number(idTipoOrden),
        id_cliente: Number(idCliente),
        fecha_fin_tentativa: `${fechaFinTentativa} 18:00:00`,
        monto_subtotal: economicData.monto_subtotal,
        porcentaje_iva: economicData.porcentaje_iva,
        monto_iva: economicData.monto_iva,
        monto_total: economicData.monto_total,
        repuestos: payloadRepuestos,
        servicios_taller: payloadServicios,
      });
    } else {
      // Modo edición directa
      updateOrden({
        id: id!,
        payload: {
          fecha_fin_tentativa: `${fechaFinTentativa} 18:00:00`,
          monto_subtotal: economicData.monto_subtotal,
          porcentaje_iva: economicData.porcentaje_iva,
          monto_iva: economicData.monto_iva,
          monto_total: economicData.monto_total,
          repuestos: payloadRepuestos,
          servicios_taller: payloadServicios,
        },
      });
      setMode('view');
    }
  };

  // Crear hallazgo técnico
  const handleSaveHallazgo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hallazgoTitulo.trim()) {
      toast.warning('Por favor ingresa el título del hallazgo');
      return;
    }

    createHallazgo(
      {
        id_orden: Number(id),
        hallazgo: hallazgoTitulo.trim(),
        detalle: hallazgoDetalle.trim() ? hallazgoDetalle.trim() : undefined,
      },
      {
        onSuccess: () => {
          setShowHallazgoModal(false);
          setHallazgoTitulo('');
          setHallazgoDetalle('');
        },
      }
    );
  };

  // Observaciones del cliente resueltas desde el ingreso
  const observacionesCliente =
    ingresoData?.observaciones_cliente || 'Sin observaciones registradas.';

  // Estados visuales badges
  const getEstadoBadgeClass = (estado?: string) => {
    switch (estado) {
      case 'en_espera':
        return 'bg-amber-500/10 text-dark dark:text-dark border-amber-500/20';
      case 'en_proceso':
        return 'bg-blue-500/10 text-dark dark:text-dark border-blue-500/20';
      case 'finalizada':
        return 'bg-emerald-500/10 text-dark dark:text-dark border-emerald-500/20';
      case 'anulada':
        return 'bg-rose-500/10 text-dark dark:text-dark border-rose-500/20';
      case 'pagada':
        return 'bg-emerald-500/10 text-dark dark:text-dark border-emerald-500/20';
      case 'parcialmente_pagada':
        return 'bg-purple-500/10 text-dark dark:text-dark border-purple-500/20';
      case 'pendiente_pago':
      default:
        return 'bg-amber-500/10 text-dark dark:text-dark border-amber-500/20';
    }
  };

  // Resuelve la URL pública del backend para la imagen del comprobante
  const getBackendImageUrl = (path?: string | null) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const baseUrlImg = import.meta.env.VITE_IMG_URL || 'http://localhost:8000';
    return `${baseUrlImg}/${path}`;
  };

  if (!isNew && (isLoadingOrden || isLoadingIngreso)) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const isReadOnly = mode === 'view';

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. BARRA SUPERIOR SEGÚN BOCETO */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {mode === 'create'
              ? `Registrar Nueva Orden Asociada al Ingreso #${effectiveIngresoId || ''}`
              : mode === 'edit'
                ? `Editar Orden #${id}`
                : `Ver Detalle de la Orden #${id}`}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {mode === 'create'
              ? 'Configuración inicial de repuestos y servicios del taller'
              : mode === 'edit'
                ? 'Edición directa de la orden de trabajo sin presupuesto extra'
                : 'Información general, datos económicos y hallazgos técnicos'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => goBack('/admin/taller/ordenes')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
        </div>
      </div>

      {/* 2. CONTENEDOR PRINCIPAL */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* BLOQUE DE FECHAS Y ESTADOS (SEGÚN BOCETO) */}
        <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
          {/* Fecha tentativa (en todos los modos) */}
          <div className="flex items-center gap-3">
            <label className="text-xs sm:text-sm font-bold text-foreground">
              Fecha de Finalización Tentativa:
            </label>
            <div className="relative">
              <input
                type="date"
                value={fechaFinTentativa}
                disabled={isReadOnly}
                onChange={(e) => setFechaFinTentativa(e.target.value)}
                required
                className="px-3.5 py-1.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 disabled:opacity-75 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Fechas y Estados adicionales visibles en 'Ver Detalle' */}
          {mode === 'view' && ordenData && (
            <div className="flex items-center gap-3 flex-wrap">
              {/* Fecha Creación */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-border/80 text-xs font-medium text-foreground">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Creación: {ordenData.fecha_creacion?.substring(0, 10)}</span>
              </div>

              {/* Fecha Fin */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-border/80 text-xs font-medium text-foreground">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Fin: {ordenData.fecha_fin ? ordenData.fecha_fin.substring(0, 10) : 'Pendiente'}</span>
              </div>

              {/* Estado Operativo con su color de badge pero con texto negro */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  estado operativo
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getEstadoBadgeClass(
                    ordenData.estado_operativo
                  )}`}
                >
                  {ordenData.estado_operativo}
                </span>
              </div>

              {/* Estado Administrativo */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  estado administrativo
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getEstadoBadgeClass(
                    ordenData.estado_administrativo
                  )}`}
                >
                  {ordenData.estado_administrativo}
                </span>
              </div>
            </div>
          )}

          {/* mostrar motivo de anulacion con su color de badge */}
          {mode === 'view' && ordenData?.estado_operativo === 'anulada' && (
            <div className="flex items-center gap-3">
              <label className="text-xs sm:text-sm font-bold text-foreground">
                Motivo de Anulación:
              </label>
              <span className={`text-xs sm:text-sm font-bold ${getEstadoBadgeClass(
                ordenData?.estado_operativo
              )} p-2 rounded-xl border border-border/80`}>
                {ordenData?.motivo_anulacion}
              </span>
            </div>
          )}
        </div>

        {/* 3. LAYOUT CENTRAL CON 2 COLUMNAS (Lado izquierdo tarjetas de observaciones/hallazgos, Lado derecho tablas y catálogo) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* COLUMNA IZQUIERDA: Observaciones del cliente y Hallazgos técnicos */}
          <div className="lg:col-span-3 space-y-6">
            {/* Tarjeta: Observaciones del cliente */}
            <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-2">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-500" />
                Observaciones del cliente
              </h3>
              <div className="p-3 rounded-xl bg-background border border-border/80 text-xs text-foreground min-h-[140px] whitespace-pre-wrap">
                {observacionesCliente}
              </div>
            </div>

            {/* Tarjeta: Hallazgos técnicos (visible tanto en nueva orden como en orden existente) */}
            <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  Hallazgos técnicos
                </h3>
                {(mode === 'view' && ordenData?.estado_operativo !== 'finalizada' && ordenData?.estado_operativo !== 'anulada') && (
                  <button
                    type="button"
                    onClick={() => setShowHallazgoModal(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Nuevo
                  </button>
                )}
              </div>

              {/* Lista de hallazgos registrados */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {hallazgos.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-4">
                    Sin hallazgos técnicos registrados.
                  </p>
                ) : (
                  hallazgos.map((h) => {
                    const isFromIngreso = !h.id_orden && !!h.id_ingreso;
                    return (
                      <div
                        key={h.id_hallazgo_tecnico}
                        className="p-2.5 bg-background border border-border/80 rounded-xl text-xs space-y-1 relative group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-foreground block">
                              {h.hallazgo}
                            </span>
                            {isFromIngreso && (
                              <span className="inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 mt-0.5">
                                Del Ingreso #{h.id_ingreso}
                              </span>
                            )}
                          </div>
                          {mode === 'view' && ordenData?.estado_operativo !== 'finalizada' && ordenData?.estado_operativo !== 'anulada' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`¿Estás seguro de eliminar el hallazgo "${h.hallazgo}"?`)) {
                                  deleteHallazgo({
                                    id: h.id_hallazgo_tecnico,
                                    ordenId: ordenData?.id_orden,
                                    ingresoId: h.id_ingreso ?? undefined,
                                  });
                                }
                              }}
                              disabled={isDeletingHallazgo}
                              className="text-rose-500 hover:text-rose-700 p-1 rounded-md hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                              title="Eliminar hallazgo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        {h.detalle && (
                          <p className="text-muted-foreground text-[11px] whitespace-pre-wrap">
                            {h.detalle}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: Listas de Repuestos y Servicios con Paneles Laterales de Selección */}
          <div className="lg:col-span-9 space-y-6">
            {/* SECCIÓN 1: Lista de Repuestos Seleccionados */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                  Lista de Repuestos Seleccionados
                </h2>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={handleToggleAllWarranty}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs shadow-blue-500/20 transition-all cursor-pointer"
                    title="Alterna garantía completa (100%) o 0 en todos los repuestos y servicios"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                    <span>{areAllItemsFullyUnderWarranty ? 'Quitar Garantía a Todos' : 'Cubrir Todos con Garantía'}</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                {/* Tabla de Repuestos Seleccionados */}
                <div className="xl:col-span-8 bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                          <th className="py-2.5 px-3 text-center">nombre</th>
                          <th className="py-2.5 px-3 text-center w-16">cantidad</th>
                          <th className="py-2.5 px-3 text-center w-20">cant. garantía</th>
                          <th className="py-2.5 px-3 text-center">costo unitario</th>
                          <th className="py-2.5 px-3 text-center">monto total línea</th>
                          <th className="py-2.5 px-3 text-center w-16">% ganancia</th>
                          <th className="py-2.5 px-3 text-center">costo unitario con ganancia</th>
                          <th className="py-2.5 px-3 text-center">monto total línea con ganancia</th>
                          {!isReadOnly && <th className="py-2.5 px-2 text-center w-10"></th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {selectedRepuestos.length === 0 ? (
                          <tr>
                            <td
                              colSpan={isReadOnly ? 8 : 9}
                              className="py-6 text-center text-muted-foreground text-xs"
                            >
                              No hay repuestos seleccionados en esta orden.
                            </td>
                          </tr>
                        ) : (
                          selectedRepuestos.map((r) => (
                            <tr key={r.id_repuesto} className="hover:bg-accent/40 transition-colors">
                              <td className="py-2.5 px-3 font-semibold text-foreground text-center">
                                {r.nombre}
                                {r.cantidad_cubierta_garantia > 0 && (
                                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                                    {r.cantidad_cubierta_garantia >= r.cantidad ? '(Garantía total)' : `(Garantía: ${r.cantidad_cubierta_garantia}/${r.cantidad})`}
                                  </div>
                                )}
                              </td>

                              {/* Cantidad editable */}
                              <td className="py-2.5 px-2 text-center">
                                {isReadOnly ? (
                                  <span className="font-bold text-foreground">{r.cantidad}</span>
                                ) : (
                                  <input
                                    type="number"
                                    min={1}
                                    value={r.cantidad}
                                    onChange={(e) =>
                                      handleUpdateRepuestoCantidad(
                                        r.id_repuesto,
                                        parseInt(e.target.value) || 1
                                      )
                                    }
                                    className="w-14 text-center px-1.5 py-1 text-xs rounded-lg bg-background border border-border/80 text-foreground font-bold"
                                  />
                                )}
                              </td>

                              {/* Cantidad cubierta por garantía editable */}
                              <td className="py-2.5 px-2 text-center">
                                {isReadOnly ? (
                                  <span className={`font-semibold ${r.cantidad_cubierta_garantia > 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-muted-foreground'}`}>
                                    {r.cantidad_cubierta_garantia || 0}
                                  </span>
                                ) : (
                                  <div className="flex items-center justify-center gap-1">
                                    <input
                                      type="number"
                                      min={0}
                                      max={r.cantidad}
                                      value={r.cantidad_cubierta_garantia}
                                      onChange={(e) =>
                                        handleUpdateRepuestoGarantia(
                                          r.id_repuesto,
                                          parseInt(e.target.value) || 0
                                        )
                                      }
                                      className={`w-14 text-center px-1.5 py-1 text-xs rounded-lg bg-background border ${r.cantidad_cubierta_garantia > 0
                                        ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                                        : 'border-border/80 text-foreground'
                                        }`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateRepuestoGarantia(
                                          r.id_repuesto,
                                          r.cantidad_cubierta_garantia === r.cantidad ? 0 : r.cantidad
                                        )
                                      }
                                      className={`p-1 rounded text-[10px] font-semibold border transition-colors cursor-pointer ${r.cantidad_cubierta_garantia === r.cantidad
                                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                                        : 'bg-muted/50 text-muted-foreground border-border/60 hover:text-foreground'
                                        }`}
                                      title={r.cantidad_cubierta_garantia === r.cantidad ? 'Quitar garantía' : 'Cubrir toda la cantidad'}
                                    >
                                      {r.cantidad_cubierta_garantia === r.cantidad ? '100%' : 'Max'}
                                    </button>
                                  </div>
                                )}
                              </td>

                              <td className="py-2.5 px-3 text-center text-muted-foreground">
                                {r.costo_unitario.toFixed(2)}
                              </td>

                              <td className="py-2.5 px-3 text-center text-muted-foreground font-medium">
                                {r.monto_total_linea_costo.toFixed(2)}
                              </td>

                              {/* Porcentaje de ganancia editable */}
                              <td className="py-2.5 px-2 text-center">
                                {isReadOnly ? (
                                  <span className="font-semibold text-foreground">
                                    {r.porcentaje_ganancia}%
                                  </span>
                                ) : (
                                  <input
                                    type="number"
                                    step="0.1"
                                    min={0}
                                    value={r.porcentaje_ganancia}
                                    onChange={(e) =>
                                      handleUpdateRepuestoGanancia(
                                        r.id_repuesto,
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="w-14 text-center px-1.5 py-1 text-xs rounded-lg bg-background border border-border/80 text-foreground font-semibold"
                                  />
                                )}
                              </td>

                              {/* Costo unitario con ganancia (Precio unitario de venta) editable */}
                              <td className="py-2.5 px-2 text-center">
                                {isReadOnly ? (
                                  <span className="font-semibold text-foreground">
                                    {r.costo_unitario_con_ganancia.toFixed(2)}
                                  </span>
                                ) : (
                                  <input
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    value={r.costo_unitario_con_ganancia}
                                    onChange={(e) =>
                                      handleUpdateRepuestoPrecio(
                                        r.id_repuesto,
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="w-18 text-center px-1.5 py-1 text-xs rounded-lg bg-background border border-border/80 text-foreground font-semibold"
                                  />
                                )}
                              </td>

                              <td className="py-2.5 px-3 text-center font-bold text-blue-600 dark:text-blue-400">
                                {r.monto_total_linea_con_ganancia.toFixed(2)}
                              </td>

                              {!isReadOnly && (
                                <td className="py-2.5 px-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveRepuesto(r.id_repuesto)}
                                    className="p-1 rounded-md text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                                    title="Quitar repuesto"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Panel Lateral: Selección de Repuestos (según boceto con buscador) */}
                {!isReadOnly && (
                  <div className="xl:col-span-4 bg-card p-3 rounded-2xl border border-border/80 shadow-xs flex flex-col h-[230px]">
                    <div className="relative mb-2">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Buscar por nombre..."
                        value={searchRepuesto}
                        onChange={(e) => setSearchRepuesto(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (availableRepuestos.length > 0) {
                              handleAddRepuesto(availableRepuestos[0]);
                              setSearchRepuesto('');
                            }
                          }
                        }}
                        className="w-full pl-8 pr-2 py-1.5 text-xs rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      />
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                      {availableRepuestos.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground text-center py-4">
                          No hay más repuestos disponibles.
                        </p>
                      ) : (
                        availableRepuestos.map((r) => (
                          <div
                            key={r.id_repuesto}
                            className="flex items-center justify-between p-2 rounded-xl bg-background border border-border/60 hover:border-blue-500/40 text-xs transition-colors"
                          >
                            <span className="font-semibold text-foreground truncate mr-2">
                              {r.nombre_modelo}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddRepuesto(r)}
                              className="p-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-2xs"
                              title="Agregar repuesto"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SECCIÓN 2: Lista de Servicios del Taller Seleccionados */}
            <div className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                Lista de Servicios del Taller Seleccionados
              </h2>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                {/* Tabla de Servicios Seleccionados */}
                <div className="xl:col-span-8 bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                          <th className="py-2.5 px-3 text-center">nombre</th>
                          <th className="py-2.5 px-3 text-center w-16">cantidad</th>
                          <th className="py-2.5 px-3 text-center w-20">cant. garantía</th>
                          <th className="py-2.5 px-3 text-center">costo unitario</th>
                          <th className="py-2.5 px-3 text-center">monto total línea</th>
                          <th className="py-2.5 px-3 text-center w-16">% ganancia</th>
                          <th className="py-2.5 px-3 text-center">costo unitario con ganancia</th>
                          <th className="py-2.5 px-3 text-center">monto total línea con ganancia</th>
                          <th className="py-2.5 px-3 text-center">estado</th>
                          {mode === 'view' && (
                            <>
                              <th className="py-2.5 px-3 text-center">fecha inicio</th>
                              <th className="py-2.5 px-3 text-center">fecha fin</th>
                              <th className="py-2.5 px-3 text-center">acciones</th>
                            </>
                          )}
                          {!isReadOnly && <th className="py-2.5 px-2 text-center w-10"></th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {selectedServicios.length === 0 ? (
                          <tr>
                            <td
                              colSpan={mode === 'view' ? 12 : isReadOnly ? 9 : 10}
                              className="py-6 text-center text-muted-foreground text-xs"
                            >
                              No hay servicios del taller seleccionados (mínimo requerido 1).
                            </td>
                          </tr>
                        ) : (
                          selectedServicios.map((s) => {
                            // Badge de estado y asignación
                            const estadoFormat = s.estado || 'pendiente_asignacion';
                            let badgeClass = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
                            let labelEstado = 'Pendiente Asignación';

                            if (estadoFormat === 'en_espera') {
                              badgeClass = 'bg-blue-500/10 text-blue-500 border-blue-500/20';
                              labelEstado = 'En Espera';
                            } else if (estadoFormat === 'en_proceso') {
                              badgeClass = 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
                              labelEstado = 'En Proceso';
                            } else if (estadoFormat === 'finalizado') {
                              badgeClass = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
                              labelEstado = 'Finalizado';
                            } else if (estadoFormat === 'anulado') {
                              badgeClass = 'bg-rose-500/10 text-rose-500 border-rose-500/20';
                              labelEstado = 'Anulado';
                            } else if (estadoFormat === 'en_pausa') {
                              badgeClass = 'bg-amber-600/10 text-amber-600 border-amber-600/20';
                              labelEstado = 'En Pausa';
                            }

                            return (
                              <tr key={s.id_servicio_taller} className="hover:bg-accent/40 transition-colors">
                                <td className="py-2.5 px-3 font-semibold text-foreground text-center">
                                  {s.nombre}
                                  {s.personal_nombre && (
                                    <div className="text-[10px] text-muted-foreground font-normal mt-0.5">
                                      Asignado a: <span className="font-medium text-foreground">{s.personal_nombre}</span>
                                    </div>
                                  )}
                                  {s.cantidad_cubierta_garantia > 0 && (
                                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                                      {s.cantidad_cubierta_garantia >= s.cantidad ? '(Garantía total)' : `(Garantía: ${s.cantidad_cubierta_garantia}/${s.cantidad})`}
                                    </div>
                                  )}
                                </td>

                                {/* Cantidad editable */}
                                <td className="py-2.5 px-2 text-center">
                                  {isReadOnly ? (
                                    <span className="font-bold text-foreground">{s.cantidad}</span>
                                  ) : (
                                    <input
                                      type="number"
                                      min={1}
                                      value={s.cantidad}
                                      onChange={(e) =>
                                        handleUpdateServicioCantidad(
                                          s.id_servicio_taller,
                                          parseInt(e.target.value) || 1
                                        )
                                      }
                                      className="w-14 text-center px-1.5 py-1 text-xs rounded-lg bg-background border border-border/80 text-foreground font-bold"
                                    />
                                  )}
                                </td>

                                {/* Cantidad cubierta por garantía editable */}
                                <td className="py-2.5 px-2 text-center">
                                  {isReadOnly ? (
                                    <span className={`font-semibold ${s.cantidad_cubierta_garantia > 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-muted-foreground'}`}>
                                      {s.cantidad_cubierta_garantia || 0}
                                    </span>
                                  ) : (
                                    <div className="flex items-center justify-center gap-1">
                                      <input
                                        type="number"
                                        min={0}
                                        max={s.cantidad}
                                        value={s.cantidad_cubierta_garantia}
                                        onChange={(e) =>
                                          handleUpdateServicioGarantia(
                                            s.id_servicio_taller,
                                            parseInt(e.target.value) || 0
                                          )
                                        }
                                        className={`w-14 text-center px-1.5 py-1 text-xs rounded-lg bg-background border ${s.cantidad_cubierta_garantia > 0
                                          ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                                          : 'border-border/80 text-foreground'
                                          }`}
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateServicioGarantia(
                                            s.id_servicio_taller,
                                            s.cantidad_cubierta_garantia === s.cantidad ? 0 : s.cantidad
                                          )
                                        }
                                        className={`p-1 rounded text-[10px] font-semibold border transition-colors cursor-pointer ${s.cantidad_cubierta_garantia === s.cantidad
                                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                                          : 'bg-muted/50 text-muted-foreground border-border/60 hover:text-foreground'
                                          }`}
                                        title={s.cantidad_cubierta_garantia === s.cantidad ? 'Quitar garantía' : 'Cubrir toda la cantidad'}
                                      >
                                        {s.cantidad_cubierta_garantia === s.cantidad ? '100%' : 'Max'}
                                      </button>
                                    </div>
                                  )}
                                </td>

                                <td className="py-2.5 px-3 text-center text-muted-foreground">
                                  {s.costo_unitario.toFixed(2)}
                                </td>

                                <td className="py-2.5 px-3 text-center text-muted-foreground font-medium">
                                  {s.monto_total_linea_costo.toFixed(2)}
                                </td>

                                {/* Porcentaje de ganancia editable */}
                                <td className="py-2.5 px-2 text-center">
                                  {isReadOnly ? (
                                    <span className="font-semibold text-foreground">
                                      {s.porcentaje_ganancia}%
                                    </span>
                                  ) : (
                                    <input
                                      type="number"
                                      step="0.1"
                                      min={0}
                                      value={s.porcentaje_ganancia}
                                      onChange={(e) =>
                                        handleUpdateServicioGanancia(
                                          s.id_servicio_taller,
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                      className="w-14 text-center px-1.5 py-1 text-xs rounded-lg bg-background border border-border/80 text-foreground font-semibold"
                                    />
                                  )}
                                </td>

                                {/* Costo unitario con ganancia (Precio unitario de venta) editable */}
                                <td className="py-2.5 px-2 text-center">
                                  {isReadOnly ? (
                                    <span className="font-semibold text-foreground">
                                      {s.costo_unitario_con_ganancia.toFixed(2)}
                                    </span>
                                  ) : (
                                    <input
                                      type="number"
                                      step="0.01"
                                      min={0}
                                      value={s.costo_unitario_con_ganancia}
                                      onChange={(e) =>
                                        handleUpdateServicioPrecio(
                                          s.id_servicio_taller,
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                      className="w-18 text-center px-1.5 py-1 text-xs rounded-lg bg-background border border-border/80 text-foreground font-semibold"
                                    />
                                  )}
                                </td>

                                <td className="py-2.5 px-3 text-center font-bold text-blue-600 dark:text-blue-400">
                                  {s.monto_total_linea_con_ganancia.toFixed(2)}
                                </td>

                                {/* Columna Estado */}
                                <td className="py-2.5 px-3 text-center">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badgeClass}`}
                                  >
                                    {labelEstado}
                                  </span>
                                </td>

                                {/* Columnas de Fechas (Únicamente cuando se está viendo el detalle de la orden: mode === 'view') */}
                                {mode === 'view' && (
                                  <>
                                    <td className="py-2.5 px-3 text-center text-muted-foreground whitespace-nowrap text-xs">
                                      {s.fecha_inicio ? s.fecha_inicio.substring(0, 10) : '—'}
                                    </td>
                                    <td className="py-2.5 px-3 text-center text-muted-foreground whitespace-nowrap text-xs">
                                      {s.fecha_fin ? s.fecha_fin.substring(0, 10) : '—'}
                                    </td>
                                  </>
                                )}

                                {/* Columna Acciones (Únicamente cuando se está viendo el detalle de la orden: mode === 'view') */}
                                {mode === 'view' && (
                                  <td className="py-2.5 px-3 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      {estadoFormat === 'pendiente_asignacion' && (
                                        <button
                                          type="button"
                                          disabled={isUpdatingServicio}
                                          onClick={() => handleOpenAssignModal(s)}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                                          title="Asignar Personal"
                                        >
                                          <UserCheck className="w-3.5 h-3.5" />
                                          Asignar Personal
                                        </button>
                                      )}

                                      {estadoFormat === 'en_espera' && (
                                        <button
                                          type="button"
                                          disabled={isUpdatingServicio}
                                          onClick={() => handleStartServicio(s)}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                                          title="Iniciar Servicio"
                                        >
                                          <Play className="w-3.5 h-3.5 fill-current" />
                                          Iniciar
                                        </button>
                                      )}

                                      {estadoFormat === 'en_proceso' && (
                                        <button
                                          type="button"
                                          disabled={isUpdatingServicio}
                                          onClick={() => handleFinishServicio(s)}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                                          title="Finalizar Servicio"
                                        >
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                          Finalizar
                                        </button>
                                      )}

                                      {estadoFormat === 'finalizado' && (
                                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                          Completado
                                        </span>
                                      )}

                                      {estadoFormat === 'anulado' && (
                                        <span className="text-[11px] text-muted-foreground">
                                          -
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                )}

                                {!isReadOnly && estadoFormat !== 'en_proceso' && estadoFormat !== 'finalizado' && (
                                  <td className="py-2.5 px-2 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveServicio(s.id_servicio_taller)}
                                      className="p-1 rounded-md text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                                      title="Quitar servicio"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                )}
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Panel Lateral: Selección de Servicios (según boceto con buscador) */}
                {!isReadOnly && (
                  <div className="xl:col-span-4 bg-card p-3 rounded-2xl border border-border/80 shadow-xs flex flex-col h-[230px]">
                    <div className="relative mb-2">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Buscar por nombre..."
                        value={searchServicio}
                        onChange={(e) => setSearchServicio(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (availableServicios.length > 0) {
                              handleAddServicio(availableServicios[0]);
                              setSearchServicio('');
                            }
                          }
                        }}
                        className="w-full pl-8 pr-2 py-1.5 text-xs rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      />
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                      {availableServicios.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground text-center py-4">
                          No hay más servicios disponibles.
                        </p>
                      ) : (
                        availableServicios.map((s) => (
                          <div
                            key={s.id_servicio_taller}
                            className="flex items-center justify-between p-2 rounded-xl bg-background border border-border/60 hover:border-blue-500/40 text-xs transition-colors"
                          >
                            <span className="font-semibold text-foreground truncate mr-2">
                              {s.nombre}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddServicio(s)}
                              className="p-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-2xs"
                              title="Agregar servicio"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SECCIÓN 3: DATA ECONÓMICA DE LA ORDEN Y BOTONES SEGÚN BOCETO */}
            <div className="space-y-4 pt-4 border-t border-border/80">
              {/* Tarjeta de Data Económica ocupando todo el ancho disponible */}
              <div className="w-full bg-card p-4 rounded-2xl border border-border/80 shadow-xs flex items-center justify-between gap-4 text-xs sm:text-sm overflow-x-auto">
                <div className="min-w-fit">
                  <span className="text-muted-foreground block text-[11px]">
                    Subtotal Bruto:
                  </span>
                  <span className="font-bold text-foreground">
                    ${economicData.monto_subtotal_bruto.toFixed(2)}
                  </span>
                </div>

                {economicData.subtotal_garantia > 0 && (
                  <div className="min-w-fit">
                    <span className="text-emerald-600 dark:text-emerald-400 block text-[11px] font-medium">
                      Cubierto Garantía:
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      -${economicData.subtotal_garantia.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="min-w-fit">
                  <span className="text-muted-foreground block text-[11px]">
                    Subtotal Cobrable:
                  </span>
                  <span className="font-bold text-foreground">
                    ${economicData.subtotal_cobrable.toFixed(2)}
                  </span>
                </div>

                <div className="min-w-fit">
                  <span className="text-muted-foreground block text-[11px]" title="IVA aplicado únicamente sobre los ítems/cantidades no cubiertas por garantía">
                    IVA ({economicData.porcentaje_iva}% cobrable):
                  </span>
                  <span className="font-bold text-foreground">
                    ${economicData.monto_iva.toFixed(2)}
                  </span>
                </div>

                <div className="min-w-fit">
                  <span className="text-muted-foreground block text-[11px]">
                    Monto Total Orden:
                  </span>
                  <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm sm:text-base">
                    ${economicData.monto_total.toFixed(2)}
                  </span>
                </div>

                <div className="min-w-fit border-l pl-4 border-border/60">
                  <span className="text-muted-foreground block text-[11px] font-semibold text-foreground">
                    Total Pagado:
                  </span>
                  <span className="font-bold text-foreground text-sm sm:text-base">
                    ${economicData.total_pagado.toFixed(2)}
                  </span>
                </div>

                <div className="min-w-fit">
                  <span className="text-muted-foreground block text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                    Monto por Cobrar:
                  </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 text-sm sm:text-base">
                    ${economicData.monto_por_cobrar.toFixed(2)}
                  </span>
                </div>

                <div className="min-w-fit">
                  {economicData.monto_a_favor > 0 ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                      <span className="text-emerald-600 dark:text-emerald-400 block text-[11px] font-semibold">
                        Monto a Favor:
                      </span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">
                        ${economicData.monto_a_favor.toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-muted-foreground block text-[11px]">
                        Monto a Favor:
                      </span>
                      <span className="font-semibold text-muted-foreground">
                        $0.00
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Fila inferior de Botones de Acción alineados a la derecha */}
              <div className="flex items-center justify-end gap-3">
                {mode === 'create' && (
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isCreating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        <span>Registrando...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Registrar Orden</span>
                      </>
                    )}
                  </button>
                )}

                {mode === 'edit' && (
                  <>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isUpdating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Guardar</span>
                        </>
                      )}
                    </button>
                  </>
                )}

                {mode === 'view' && ordenData?.estado_operativo !== 'finalizada' && ordenData?.estado_operativo !== 'anulada' && (
                  <>
                    {/* Botón Finalizar Orden (cuando la orden está 'en_proceso') */}
                    {ordenData?.estado_operativo === 'en_proceso' && (
                      <button
                        type="button"
                        onClick={() => setShowFinalizarModal(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                        title="Finalizar orden de trabajo"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Finalizar Orden
                      </button>
                    )}

                    {/* Botón Generar Presupuesto Extra */}
                    <button
                      type="button"
                      onClick={() => {
                        navigate(`/admin/taller/presupuestos/new?tipo=extra&id_orden=${id}`);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20 transition-all cursor-pointer"
                      title="Generar Presupuesto Extra"
                    >
                      <FilePlus className="w-4 h-4" />
                      Generar Presupuesto Extra
                    </button>

                    {/* Botón Editar Sin Generar Presupuesto */}
                    <button
                      type="button"
                      onClick={() => setMode('edit')}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                      Editar Sin Generar Presupuesto
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* SECCIÓN 4: TABLA DE PAGOS ASOCIADOS A LA ORDEN (solo en modo 'view') */}
            {mode === 'view' && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-blue-500" />
                    Historial de Pagos Registrados
                  </h2>
                  <span className="text-xs text-muted-foreground font-medium">
                    Total Acumulado:{' '}
                    <strong className="text-foreground font-bold">
                      ${economicData.total_pagado.toFixed(2)}
                    </strong>
                  </span>
                </div>

                <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                          <th className="py-2.5 px-3 text-center">Id Pago</th>
                          <th className="py-2.5 px-3 text-center">Fecha de Pago</th>
                          <th className="py-2.5 px-3 text-center">Método</th>
                          <th className="py-2.5 px-3 text-center">N° Referencia</th>
                          <th className="py-2.5 px-3 text-center">Monto</th>
                          <th className="py-2.5 px-3 text-center">Comprobante</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {!ordenData?.pagos || ordenData.pagos.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="py-6 text-center text-muted-foreground text-xs"
                            >
                              No hay pagos registrados para esta orden de trabajo.
                            </td>
                          </tr>
                        ) : (
                          ordenData.pagos.map((p) => {
                            const comprobanteUrl = getBackendImageUrl(p.imagePath) || '';
                            return (
                              <tr key={p.id_pago_cliente} className="hover:bg-accent/40 transition-colors">
                                <td className="py-2.5 px-3 font-mono font-bold text-center text-foreground">
                                  #{p.id_pago_cliente}
                                </td>
                                <td className="py-2.5 px-3 text-center text-foreground font-medium">
                                  {p.fecha_pago ? p.fecha_pago.substring(0, 10) : '—'}
                                </td>
                                <td className="py-2.5 px-3 text-center capitalize text-foreground font-medium">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                    {p.metodo_pago}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">
                                  {p.num_referencia || '—'}
                                </td>
                                <td className="py-2.5 px-3 text-center font-bold text-blue-600 dark:text-blue-400">
                                  ${Number(p.monto || 0).toFixed(2)}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {comprobanteUrl ? (
                                    <a
                                      href={comprobanteUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-blue-500" />
                                      Ver Detalle
                                    </a>
                                  ) : (
                                    <span className="text-muted-foreground italic text-[11px]">
                                      Sin adjunto
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>

      {/* MODAL: REGISTRAR HALLAZGO TÉCNICO (CON SCROLL VERTICAL) */}
      {showHallazgoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/80 shrink-0">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                Registrar Hallazgo Técnico
              </h3>
              <button
                type="button"
                onClick={() => setShowHallazgoModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHallazgo} className="flex flex-col flex-1 min-h-0 space-y-4">
              <div className="overflow-y-auto pr-1 space-y-4 flex-1">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Hallazgo / Resumen <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Fuga de aceite en la empacadura de la tapa..."
                    value={hallazgoTitulo}
                    onChange={(e) => setHallazgoTitulo(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Detalles / Especificaciones Técnicas
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe las observaciones técnicas y recomendaciones..."
                    value={hallazgoDetalle}
                    onChange={(e) => setHallazgoDetalle(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-border/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowHallazgoModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingHallazgo || !hallazgoTitulo.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isCreatingHallazgo ? 'Guardando...' : 'Guardar Hallazgo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ASIGNAR PERSONAL AL SERVICIO DEL TALLER */}
      {assignModalService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/80 shrink-0">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-500" />
                Asignar Personal
              </h3>
              <button
                type="button"
                onClick={() => setAssignModalService(null)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border/60 shrink-0">
              <p className="text-xs text-muted-foreground">Servicio seleccionado:</p>
              <p className="text-sm font-bold text-foreground mt-0.5">
                {assignModalService.nombre}
              </p>
            </div>

            <form onSubmit={handleSaveAssignPersonal} className="flex flex-col flex-1 min-h-0 space-y-4">
              <div className="overflow-y-auto pr-1 flex-1">
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Seleccionar Empleado / Mecánico <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedPersonalId}
                  onChange={(e) => setSelectedPersonalId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="">-- Seleccione un empleado --</option>
                  {allPersonal
                    .filter((p) => !p.is_deleted)
                    .map((p) => (
                      <option key={p.id_personal} value={p.id_personal}>
                        {p.nombre} {p.cedula ? `(C.I: ${p.cedula})` : ''}
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Al asignar personal, el estado del servicio cambiará automáticamente a <span className="font-semibold text-blue-500">En Espera</span>.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-border/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setAssignModalService(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingServicio || !selectedPersonalId}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingServicio ? 'Asignando...' : 'Confirmar Asignación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FINALIZAR ORDEN DE TRABAJO */}
      {showFinalizarModal && ordenData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-border/80 shrink-0">
              <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Finalizar Orden #{ordenData.id_orden}
              </h3>
              <button
                type="button"
                onClick={() => setShowFinalizarModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto pr-1 space-y-4">
              <p className="text-xs sm:text-sm text-foreground">
                ¿Estás seguro de que deseas marcar esta orden de trabajo como <strong className="text-emerald-600 dark:text-emerald-400">Finalizada</strong>?
              </p>

              <div className="p-3 bg-muted/40 rounded-xl border border-border/60 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID Orden:</span>
                  <span className="font-bold text-foreground">#{ordenData.id_orden}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-semibold text-foreground">
                    {ordenData.cliente?.nombre || ingresoData?.vehiculo?.cliente?.nombre || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monto Total:</span>
                  <span className="font-bold text-foreground">
                    ${Number(ordenData.monto_total || economicData.monto_total).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monto por Cobrar:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    ${Number(ordenData.monto_por_cobrar ?? economicData.monto_por_cobrar).toFixed(2)}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground">
                Recuerda que todos los servicios del taller asociados deben encontrarse finalizados para poder completar la orden.
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-border/80 shrink-0">
              <button
                type="button"
                onClick={() => setShowFinalizarModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isFinalizandoOrden}
                onClick={() => {
                  finalizarOrden(ordenData.id_orden, {
                    onSuccess: () => {
                      setShowFinalizarModal(false);
                    },
                  });
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isFinalizandoOrden ? 'Finalizando...' : 'Confirmar Finalización'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdenFormPage;
