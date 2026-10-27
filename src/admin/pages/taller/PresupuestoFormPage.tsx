import { useState, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  FileText,
  Save,
} from 'lucide-react';

import { getIngresoByIdAction } from '../../actions/get-ingreso-by-id.action';
import { getOrdenByIdAction } from '../../actions/get-orden-by-id.action';
import { getRepuestosAction } from '../../actions/get-repuestos.action';
import { getServiciosTallerAction } from '../../actions/get-servicios-taller.action';
import { getVariablesAction } from '../../actions/get-variables.action';
import { usePresupuestoMutation } from '../../hooks/usePresupuestoMutation';

import type { RepuestoItem } from '../../interfaces/repuesto.interface';
import type { ServicioTallerItem } from '../../interfaces/servicio-taller.interface';
import type {
  CreatePresupuestoInicialPayload,
  CreatePresupuestoExtraPayload,
} from '../../interfaces/presupuesto.interface';

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
  isFromOrden?: boolean; // Verdadero si el repuesto ya formaba parte de la orden
}

// Interface para las líneas en la tabla de servicios seleccionados
interface ServicioLineState {
  id_servicio_taller: number;
  nombre: string;
  cantidad: number;
  costo_unitario: number;
  monto_total_linea_costo: number;
  porcentaje_ganancia: number;
  costo_unitario_con_ganancia: number; // precio_unitario
  monto_total_linea_con_ganancia: number; // monto_total_linea
  estado: string; // por defecto 'pendiente_asignacion'
  isFromOrden?: boolean; // Verdadero si el servicio ya formaba parte de la orden
}

export const PresupuestoFormPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Parámetros de la URL:
  // Inicial: /admin/taller/presupuestos/new?tipo=inicial&id_ingreso=x
  // Extra:   /admin/taller/presupuestos/new?tipo=extra&id_orden=x
  const tipoParam = (searchParams.get('tipo') || 'inicial') as 'inicial' | 'extra';
  const queryIngresoId = searchParams.get('id_ingreso');
  const queryOrdenId = searchParams.get('id_orden');

  const isExtra = tipoParam === 'extra';

  const { createPresupuesto, isCreatingPresupuesto } = usePresupuestoMutation();

  // 1. Consultar Orden asociada si es presupuesto extra
  const { data: ordenData, isLoading: isLoadingOrden } = useQuery({
    queryKey: ['orden-item', queryOrdenId],
    queryFn: () => getOrdenByIdAction(queryOrdenId!),
    enabled: isExtra && !!queryOrdenId,
  });

  // Determinar el id_ingreso efectivo: si es extra, se extrae de ordenData.id_ingreso
  const effectiveIngresoId = isExtra ? ordenData?.id_ingreso : queryIngresoId;

  // 2. Consultar Ingreso asociado para obtener observaciones del cliente
  const { data: ingresoData, isLoading: isLoadingIngreso } = useQuery({
    queryKey: ['ingreso-item', effectiveIngresoId],
    queryFn: () => getIngresoByIdAction(effectiveIngresoId!),
    enabled: !!effectiveIngresoId,
  });

  // Mapas de repuestos y servicios preexistentes en la orden (para cuando es tipo extra)
  const ordenRepuestosMap = useMemo(() => {
    const map = new Map<
      number,
      {
        costo_unitario_base: number;
        precio_unitario: number;
        porcentaje_ganancia: number;
      }
    >();
    if (isExtra && ordenData?.repuestos) {
      ordenData.repuestos.forEach((r) => {
        const costo = Number(r.costo_unitario_base ?? 0);
        const precio = Number(r.precio_unitario ?? 0);
        const ganancia = Number(r.porcentaje_ganancia ?? 0);
        map.set(r.id_repuesto, {
          costo_unitario_base: costo,
          precio_unitario: precio,
          porcentaje_ganancia: ganancia,
        });
      });
    }
    return map;
  }, [isExtra, ordenData]);

  const ordenServiciosMap = useMemo(() => {
    const map = new Map<
      number,
      {
        costo_unitario_base: number;
        precio_unitario: number;
        porcentaje_ganancia: number;
      }
    >();
    if (isExtra && ordenData?.servicios_taller) {
      ordenData.servicios_taller.forEach((s) => {
        const costo = Number(s.costo_unitario_base ?? 0);
        const precio = Number(s.precio_unitario ?? 0);
        const ganancia = Number(s.porcentaje_ganancia ?? 0);
        map.set(s.id_servicio_taller, {
          costo_unitario_base: costo,
          precio_unitario: precio,
          porcentaje_ganancia: ganancia,
        });
      });
    }
    return map;
  }, [isExtra, ordenData]);

  // 3. Catálogos: Repuestos y Servicios
  const { data: allRepuestos = [] } = useQuery({
    queryKey: ['repuestos-listado'],
    queryFn: getRepuestosAction,
  });

  const { data: allServicios = [] } = useQuery({
    queryKey: ['servicios-taller-listado'],
    queryFn: getServiciosTallerAction,
  });

  // 4. Variables de cálculo y porcentaje de IVA
  const { data: variables = [] } = useQuery({
    queryKey: ['variables-listado'],
    queryFn: getVariablesAction,
  });

  const modoCalculo = useMemo(() => {
    const v = variables.find((item) => item.nombre === 'calculo_ganancia');
    return v?.valor === 'sobre_costo' ? 'sobre_costo' : 'sobre_venta';
  }, [variables]);

  const ivaPercentage = useMemo(() => {
    const varIva = variables.find((v) =>
      v.nombre.toLowerCase().includes('iva')
    );
    if (varIva && !isNaN(Number(varIva.valor))) {
      return Number(varIva.valor);
    }
    return 19;
  }, [variables]);

  // Funciones de cálculo económico
  const calcularPrecioConGanancia = (costo: number, porcentajeGanancia: number): number => {
    const c = Number(costo) || 0;
    const p = Number(porcentajeGanancia) || 0;
    if (c <= 0) return 0;

    let v = 0;
    if (modoCalculo === 'sobre_costo') {
      v = c * (1 + p / 100);
    } else {
      if (p < 100) {
        v = c / (1 - p / 100);
      } else {
        v = c * (1 + p / 100);
      }
    }
    return Number(v.toFixed(2));
  };

  const calcularPorcentajeGanancia = (costo: number, precioVenta: number): number => {
    const c = Number(costo) || 0;
    const v = Number(precioVenta) || 0;
    const u = v - c;
    if (c <= 0) return 0;

    let p = 0;
    if (modoCalculo === 'sobre_costo') {
      p = (u / c) * 100;
    } else {
      if (v <= 0) return 0;
      p = (u / v) * 100;
    }
    return Number(p.toFixed(2));
  };

  // Estados locales para repuestos y servicios seleccionados
  const [selectedRepuestos, setSelectedRepuestos] = useState<RepuestoLineState[]>([]);
  const [selectedServicios, setSelectedServicios] = useState<ServicioLineState[]>([]);

  // Búsquedas en los paneles laterales
  const [searchRepuesto, setSearchRepuesto] = useState('');
  const [searchServicio, setSearchServicio] = useState('');

  // Listas filtradas de disponibles excluyendo los seleccionados
  const availableRepuestos = useMemo(() => {
    const selectedIds = new Set(selectedRepuestos.map((r) => r.id_repuesto));
    return allRepuestos.filter((r) => {
      if (selectedIds.has(r.id_repuesto)) return false;
      if (!searchRepuesto.trim()) return true;
      return r.nombre_modelo.toLowerCase().includes(searchRepuesto.trim().toLowerCase());
    });
  }, [allRepuestos, selectedRepuestos, searchRepuesto]);

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
    const existingInOrden = ordenRepuestosMap.get(r.id_repuesto);
    const isFromOrden = !!existingInOrden;

    let costoUnit = 0;
    let pctGanancia = 0;
    let precioUnitConGanancia = 0;

    if (existingInOrden) {
      costoUnit = existingInOrden.costo_unitario_base;
      pctGanancia = existingInOrden.porcentaje_ganancia;
      precioUnitConGanancia = existingInOrden.precio_unitario;
    } else {
      costoUnit = Number(r.ultimo_costo_compra_unitario) || 0;
      pctGanancia = Number(r.porcentaje_ganancia) || 0;
      precioUnitConGanancia =
        Number(r.monto_venta) || calcularPrecioConGanancia(costoUnit, pctGanancia);
    }

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
      isFromOrden,
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
        if (r.id_repuesto !== idRepuesto || r.isFromOrden) return r;
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
        if (r.id_repuesto !== idRepuesto || r.isFromOrden) return r;
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
    const existingInOrden = ordenServiciosMap.get(s.id_servicio_taller);
    const isFromOrden = !!existingInOrden;

    let costoUnit = 0;
    let pctGanancia = 0;
    let precioUnitConGanancia = 0;

    if (existingInOrden) {
      costoUnit = existingInOrden.costo_unitario_base;
      pctGanancia = existingInOrden.porcentaje_ganancia;
      precioUnitConGanancia = existingInOrden.precio_unitario;
    } else {
      costoUnit = Number(s.costo) || 0;
      pctGanancia = Number(s.porcentaje_ganancia) || 0;
      precioUnitConGanancia =
        Number(s.monto_venta) || calcularPrecioConGanancia(costoUnit, pctGanancia);
    }

    const cant = 1;

    const newLine: ServicioLineState = {
      id_servicio_taller: s.id_servicio_taller,
      nombre: s.nombre,
      estado: 'pendiente_asignacion',
      cantidad: cant,
      costo_unitario: Number(costoUnit.toFixed(2)),
      monto_total_linea_costo: Number((costoUnit * cant).toFixed(2)),
      porcentaje_ganancia: pctGanancia,
      costo_unitario_con_ganancia: Number(precioUnitConGanancia.toFixed(2)),
      monto_total_linea_con_ganancia: Number((precioUnitConGanancia * cant).toFixed(2)),
      isFromOrden,
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
        if (s.id_servicio_taller !== idServicio || s.isFromOrden) return s;
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
        if (s.id_servicio_taller !== idServicio || s.isFromOrden) return s;
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

  // Submit Handler: Crear Presupuesto (Inicial o Extra)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isExtra) {
      if (!queryOrdenId) {
        toast.error('No se ha especificado la orden de trabajo asociada');
        return;
      }
    } else {
      if (!queryIngresoId) {
        toast.error('No se ha especificado un ingreso vehicular asociado');
        return;
      }
    }

    if (selectedRepuestos.length === 0 && selectedServicios.length === 0) {
      toast.warning('Debes agregar al menos un repuesto o servicio del taller al presupuesto');
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
      costo_unitario_base: s.costo_unitario,
      precio_unitario: s.costo_unitario_con_ganancia,
      porcentaje_ganancia: s.porcentaje_ganancia,
      cantidad: s.cantidad,
      monto_total_linea_base: s.monto_total_linea_costo,
      monto_total_linea: s.monto_total_linea_con_ganancia,
    }));

    if (isExtra) {
      const payload: CreatePresupuestoExtraPayload = {
        id_orden: Number(queryOrdenId),
        monto_subtotal: economicData.monto_subtotal,
        porcentaje_iva: economicData.porcentaje_iva,
        monto_iva: economicData.monto_iva,
        monto_total: economicData.monto_total,
        repuestos: payloadRepuestos,
        servicios_taller: payloadServicios,
      };
      createPresupuesto(payload);
    } else {
      const payload: CreatePresupuestoInicialPayload = {
        id_ingreso: Number(queryIngresoId),
        monto_subtotal: economicData.monto_subtotal,
        porcentaje_iva: economicData.porcentaje_iva,
        monto_iva: economicData.monto_iva,
        monto_total: economicData.monto_total,
        repuestos: payloadRepuestos,
        servicios_taller: payloadServicios,
      };
      createPresupuesto(payload);
    }
  };

  const observacionesCliente =
    ingresoData?.observaciones_cliente || 'Sin observaciones registradas.';

  if (isLoadingIngreso || (isExtra && isLoadingOrden)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400" />
        <p className="text-sm text-muted-foreground animate-pulse">
          {isExtra ? 'Cargando datos de la orden e ingreso...' : 'Cargando datos del ingreso...'}
        </p>
      </div>
    );
  }

  const tituloPagina = isExtra
    ? `Registrar Nuevo Presupuesto Extra Asociado a la Orden #${queryOrdenId || 'x'}`
    : `Registrar Nuevo Presupuesto Inicial Asociado al Ingreso #${queryIngresoId || 'x'}`;

  const volverLink = isExtra && queryOrdenId
    ? `/admin/taller/ordenes/${queryOrdenId}`
    : '/admin/taller/presupuestos';

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* 1. BARRA SUPERIOR SEGÚN BOCETO */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {tituloPagina}
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to={volverLink}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </div>
      </div>

      {/* 2. FORMULARIO PRINCIPAL */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* LAYOUT CON 2 COLUMNAS (Lado izquierdo Observaciones del cliente, Lado derecho tablas y catálogos) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* COLUMNA IZQUIERDA: Observaciones del cliente */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-2">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-500" />
                Observaciones del cliente
              </h3>
              <div className="p-3 rounded-xl bg-background border border-border/80 text-xs text-foreground min-h-[140px] whitespace-pre-wrap">
                {observacionesCliente}
              </div>
            </div>
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
                          <th className="py-2.5 px-2 text-center w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {selectedRepuestos.length === 0 ? (
                          <tr>
                            <td
                              colSpan={8}
                              className="py-6 text-center text-muted-foreground text-xs"
                            >
                              No hay repuestos seleccionados en este presupuesto.
                            </td>
                          </tr>
                        ) : (
                          selectedRepuestos.map((r) => (
                            <tr key={r.id_repuesto} className="hover:bg-accent/40 transition-colors">
                              <td className="py-2.5 px-3 font-semibold text-foreground text-center">
                                {r.nombre}
                              </td>

                              {/* Cantidad editable siempre */}
                              <td className="py-2.5 px-2 text-center">
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
                              </td>

                              <td className="py-2.5 px-3 text-center text-muted-foreground">
                                {r.costo_unitario.toFixed(2)}
                              </td>

                              <td className="py-2.5 px-3 text-center text-muted-foreground font-medium">
                                {r.monto_total_linea_costo.toFixed(2)}
                              </td>

                              {/* Porcentaje de ganancia: editable sólo si NO es preexistente de la orden */}
                              <td className="py-2.5 px-2 text-center">
                                {r.isFromOrden ? (
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

                              {/* Costo unitario con ganancia (Precio unitario): editable sólo si NO es preexistente de la orden */}
                              <td className="py-2.5 px-2 text-center">
                                {r.isFromOrden ? (
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
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Panel Lateral: Selección de Repuestos */}
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
                          <th className="py-2.5 px-2 text-center w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {selectedServicios.length === 0 ? (
                          <tr>
                            <td
                              colSpan={9}
                              className="py-6 text-center text-muted-foreground text-xs"
                            >
                              No hay servicios del taller seleccionados (mínimo requerido 1).
                            </td>
                          </tr>
                        ) : (
                          selectedServicios.map((s) => (
                            <tr key={s.id_servicio_taller} className="hover:bg-accent/40 transition-colors">
                              <td className="py-2.5 px-3 font-semibold text-foreground text-center">
                                {s.nombre}
                              </td>

                              {/* Cantidad editable siempre */}
                              <td className="py-2.5 px-2 text-center">
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
                              </td>

                              <td className="py-2.5 px-3 text-center text-muted-foreground">
                                {s.costo_unitario.toFixed(2)}
                              </td>

                              <td className="py-2.5 px-3 text-center text-muted-foreground font-medium">
                                {s.monto_total_linea_costo.toFixed(2)}
                              </td>

                              {/* Porcentaje de ganancia: editable sólo si NO es preexistente de la orden */}
                              <td className="py-2.5 px-2 text-center">
                                {s.isFromOrden ? (
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

                              {/* Costo unitario con ganancia (Precio unitario): editable sólo si NO es preexistente de la orden */}
                              <td className="py-2.5 px-2 text-center">
                                {s.isFromOrden ? (
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
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-amber-500/10 text-amber-500 border-amber-500/20">
                                  Pendiente Asignación
                                </span>
                              </td>

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
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Panel Lateral: Selección de Servicios */}
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
              </div>
            </div>

            {/* SECCIÓN 3: DATA ECONÓMICA Y BOTONES SEGÚN BOCETO */}
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

              {/* Botones de Acción */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate(volverLink)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-all cursor-pointer shadow-xs"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isCreatingPresupuesto}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isCreatingPresupuesto ? (
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
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
