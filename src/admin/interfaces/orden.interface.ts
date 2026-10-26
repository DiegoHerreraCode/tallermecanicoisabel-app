export interface TipoOrden {
  id_tipo_orden: number;
  nombre: string;
  descripcion?: string | null;
}

export interface OrdenRepuestoItem {
  id_orden_repuesto?: number;
  id_orden?: number;
  id_repuesto: number;
  precio_unitario: number | string;
  cantidad: number | string;
  monto_total_linea: number | string;
  repuesto?: {
    id_repuesto: number;
    id_marca_repuesto?: number;
  };
}

export interface OrdenServicioTallerItem {
  id_orden_servicio_taller?: number;
  id_orden?: number;
  id_servicio_taller: number;
  id_personal?: number | null;
  precio_unitario: number | string;
  cantidad: number | string;
  monto_total_linea: number | string;
  estado?: string;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  servicio_taller?: {
    id_servicio_taller: number;
    nombre: string;
    id_tipo_servicio_taller?: number;
  };
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
  cliente?: {
    id_cliente?: number;
    nombre?: string;
    cedula?: string;
    telefono?: string;
    email?: string;
  };
  tipo_orden?: TipoOrden;
  repuestos?: OrdenRepuestoItem[];
  servicios_taller?: OrdenServicioTallerItem[];
}
