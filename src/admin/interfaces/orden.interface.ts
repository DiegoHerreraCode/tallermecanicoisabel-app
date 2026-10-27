import type { TipoOrdenItem } from './tipo-orden.interface';
import type { ClienteItem } from './cliente.interface';
import type { IngresoItem } from './ingreso.interface';
import type { RepuestoItem } from './repuesto.interface';
import type { ServicioTallerItem } from './servicio-taller.interface';

export interface HallazgoTecnicoItem {
  id_hallazgo_tecnico: number;
  id_orden: number;
  hallazgo: string;
  detalle?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface OrdenRepuestoItem {
  id_orden_repuesto?: number;
  id_orden?: number;
  id_repuesto: number;
  costo_unitario_base?: number | string | null;
  precio_unitario: number | string;
  porcentaje_ganancia?: number | string | null;
  cantidad: number | string;
  monto_total_linea_base?: number | string | null;
  monto_total_linea: number | string;
  repuesto?: RepuestoItem;
}

export interface OrdenServicioTallerItem {
  id_orden_servicio_taller?: number;
  id_orden?: number;
  id_servicio_taller: number;
  id_personal?: number | null;
  costo_unitario_base?: number | string | null;
  precio_unitario: number | string;
  porcentaje_ganancia?: number | string | null;
  cantidad: number | string;
  monto_total_linea_base?: number | string | null;
  monto_total_linea: number | string;
  estado?: string;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  servicio_taller?: ServicioTallerItem;
  personal?: {
    id_personal: number;
    nombre: string;
    cedula?: string;
  };
}

export interface OrdenItem {
  id_orden: number;
  id_ingreso: number;
  id_tipo_orden: number;
  id_cliente: number;
  fecha_creacion: string;
  fecha_fin?: string | null;
  fecha_fin_tentativa: string;
  estado_operativo: 'en_espera' | 'en_proceso' | 'finalizada' | 'anulada';
  estado_administrativo?: 'pendiente_pago' | 'parcialmente_pagada' | 'pagada';
  monto_subtotal: number | string;
  porcentaje_iva: number | string;
  monto_iva: number | string;
  monto_total: number | string;
  monto_pendiente?: number | string;
  last_update?: string;
  fecha_anulacion?: string | null;
  id_admin_anulacion?: number | null;
  motivo_anulacion?: string | null;

  // Relaciones
  cliente?: ClienteItem;
  tipo_orden?: TipoOrdenItem;
  ingreso?: IngresoItem;
  repuestos?: OrdenRepuestoItem[];
  servicios_taller?: OrdenServicioTallerItem[];
  hallazgos_tecnicos?: HallazgoTecnicoItem[];
}

export interface CreateOrdenPayload {
  id_ingreso: number;
  id_tipo_orden: number;
  id_cliente: number;
  fecha_fin_tentativa: string;
  monto_subtotal: number;
  porcentaje_iva: number;
  monto_iva: number;
  monto_total: number;
  repuestos?: Array<{
    id_repuesto: number;
    costo_unitario_base?: number;
    precio_unitario: number;
    porcentaje_ganancia?: number;
    cantidad: number;
    monto_total_linea_base?: number;
    monto_total_linea: number;
  }>;
  servicios_taller: Array<{
    id_servicio_taller: number;
    id_personal?: number | null;
    costo_unitario_base?: number;
    precio_unitario: number;
    porcentaje_ganancia?: number;
    cantidad: number;
    monto_total_linea_base?: number;
    monto_total_linea: number;
    fecha_inicio?: string | null;
    fecha_fin?: string | null;
  }>;
}

export interface UpdateOrdenPayload {
  fecha_fin?: string | null;
  fecha_fin_tentativa?: string;
  estado_operativo?: 'en_espera' | 'en_proceso' | 'finalizada' | 'anulada';
  estado_administrativo?: 'pendiente_pago' | 'parcialmente_pagada' | 'pagada';
  monto_subtotal?: number;
  porcentaje_iva?: number;
  monto_iva?: number;
  monto_total?: number;
  repuestos?: Array<{
    id_repuesto: number;
    costo_unitario_base?: number;
    precio_unitario: number;
    porcentaje_ganancia?: number;
    cantidad: number;
    monto_total_linea_base?: number;
    monto_total_linea: number;
  }>;
  servicios_taller?: Array<{
    id_servicio_taller: number;
    id_personal?: number | null;
    costo_unitario_base?: number;
    precio_unitario: number;
    porcentaje_ganancia?: number;
    cantidad: number;
    monto_total_linea_base?: number;
    monto_total_linea: number;
    fecha_inicio?: string | null;
    fecha_fin?: string | null;
  }>;
}

export interface CreateHallazgoTecnicoPayload {
  id_orden: number;
  hallazgo: string;
  detalle?: string;
}

export interface AnularOrdenPayload {
  motivo_anulacion: string;
}
