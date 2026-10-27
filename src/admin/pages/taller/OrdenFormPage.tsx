import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router';
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
} from 'lucide-react';

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
  const navigate = useNavigate();

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
  } = useOrdenMutation();

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

  // Obtener porcentaje de IVA de las variables (default 16 o 19)
  const ivaPercentage = useMemo(() => {
    const varIva = variables.find((v) =>
      v.nombre.toLowerCase().includes('iva')
    );
    if (varIva && !isNaN(Number(varIva.valor))) {
      return Number(varIva.valor);
    }
    return 19;
  }, [variables]);

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

  // 6. Consultar hallazgos técnicos si estamos en una orden existente
  const { data: hallazgos = [] } = useQuery({
    queryKey: ['hallazgos-orden', id],
    queryFn: () => getHallazgosTecnicosAction(id!),
    enabled: !isNew && !!id,
  });

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

        return {
          id_repuesto: r.id_repuesto,
          nombre: matched?.nombre_modelo || `Repuesto #${r.id_repuesto}`,
          cantidad: cant,
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

        return {
          id_orden_servicio_taller: s.id_orden_servicio_taller,
          id_servicio_taller: s.id_servicio_taller,
          id_personal: s.id_personal || null,
          personal_nombre: personalNombre,
          estado: estadoFinal,
          nombre: matched?.nombre || s.servicio_taller?.nombre || `Servicio #${s.id_servicio_taller}`,
          cantidad: cant,
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
        return {
          ...r,
          cantidad: cant,
          monto_total_linea_costo: totalCosto,
          monto_total_linea_con_ganancia: totalConGanancia,
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
        return {
          ...s,
          cantidad: cant,
          monto_total_linea_costo: totalCosto,
          monto_total_linea_con_ganancia: totalConGanancia,
        };
      })
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
    const totalRepuestos = selectedRepuestos.reduce(
      (sum, r) => sum + r.monto_total_linea_con_ganancia,
      0
    );
    const totalServicios = selectedServicios.reduce(
      (sum, s) => sum + s.monto_total_linea_con_ganancia,
      0
    );

    const monto_subtotal = Number((totalRepuestos + totalServicios).toFixed(2));
    const porcentaje_iva = ivaPercentage;
    const monto_iva = Number(((monto_subtotal * porcentaje_iva) / 100).toFixed(2));
    const monto_total = Number((monto_subtotal + monto_iva).toFixed(2));

    return {
      monto_subtotal,
      porcentaje_iva,
      monto_iva,
      monto_total,
    };
  }, [selectedRepuestos, selectedServicios, ivaPercentage]);

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
          <Link
            to="/admin/taller/ordenes"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
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
          {mode === 'view' && ordenData.estado_operativo === 'anulada' && (
            <div className="flex items-center gap-3">
              <label className="text-xs sm:text-sm font-bold text-foreground">
                Motivo de Anulación:
              </label>
              <span className={`text-xs sm:text-sm font-bold ${getEstadoBadgeClass(
                ordenData.estado_operativo
              )} p-2 rounded-xl border border-border/80`}>
                {ordenData.motivo_anulacion}
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

            {/* Tarjeta: Hallazgos técnicos (visible cuando la orden ya existe) */}
            {!isNew && (
              <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    Hallazgos técnicos
                  </h3>
                  {(mode === 'view' && ordenData.estado_operativo !== 'finalizada' && ordenData.estado_operativo !== 'anulada') && (
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
                    hallazgos.map((h) => (
                      <div
                        key={h.id_hallazgo_tecnico}
                        className="p-2.5 bg-background border border-border/80 rounded-xl text-xs space-y-1 relative group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-foreground block">
                            {h.hallazgo}
                          </span>
                          {mode === 'view' && ordenData.estado_operativo !== 'finalizada' && ordenData.estado_operativo !== 'anulada' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`¿Estás seguro de eliminar el hallazgo "${h.hallazgo}"?`)) {
                                  deleteHallazgo({
                                    id: h.id_hallazgo_tecnico,
                                    ordenId: ordenData.id_orden
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
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA: Listas de Repuestos y Servicios con Paneles Laterales de Selección */}
          <div className="lg:col-span-9 space-y-6">
            {/* SECCIÓN 1: Lista de Repuestos Seleccionados */}
            <div className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                Lista de Repuestos Seleccionados
              </h2>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                {/* Tabla de Repuestos Seleccionados */}
                <div className="xl:col-span-8 bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                          <th className="py-2.5 px-3 text-center">nombre</th>
                          <th className="py-2.5 px-3 text-center w-16">cantidad</th>
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
                              colSpan={isReadOnly ? 7 : 8}
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
                              colSpan={mode === 'view' ? 11 : isReadOnly ? 8 : 9}
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/80">
              {/* Tarjeta de Data Económica */}
              <div className="w-full sm:w-auto flex-1 bg-card p-3.5 rounded-2xl border border-border/80 shadow-xs flex items-center justify-around gap-4 text-xs sm:text-sm">
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Subtotal:
                  </span>
                  <span className="font-bold text-foreground">
                    ${economicData.monto_subtotal.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    IVA ({economicData.porcentaje_iva}%):
                  </span>
                  <span className="font-bold text-foreground">
                    ${economicData.monto_iva.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Monto Total:
                  </span>
                  <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm sm:text-base">
                    ${economicData.monto_total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Botones de Acción según Modo */}
              <div className="flex items-center gap-3">
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

                {mode === 'view' && ordenData.estado_operativo !== 'finalizada' && ordenData.estado_operativo !== 'anulada' && (
                  <>
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
          </div>
        </div>
      </form>

      {/* MODAL: REGISTRAR HALLAZGO TÉCNICO (CON SCROLL VERTICAL) */}
      {showHallazgoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-card border border-border/80 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/80">
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

            <form onSubmit={handleSaveHallazgo} className="space-y-4">
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

              <div className="flex justify-end gap-2.5 pt-3 border-t border-border/80">
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
          <div className="bg-card border border-border/80 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/80">
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

            <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
              <p className="text-xs text-muted-foreground">Servicio seleccionado:</p>
              <p className="text-sm font-bold text-foreground mt-0.5">
                {assignModalService.nombre}
              </p>
            </div>

            <form onSubmit={handleSaveAssignPersonal} className="space-y-4">
              <div>
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
                <p className="text-[11px] text-muted-foreground mt-1">
                  Al asignar personal, el estado del servicio cambiará automáticamente a <span className="font-semibold text-blue-500">En Espera</span>.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-border/80">
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
    </div>
  );
};

export default OrdenFormPage;
