import type { TipoOrdenItem } from './tipo-orden.interface';
import type { IngresoItem } from './ingreso.interface';
import type { OrdenItem } from './orden.interface';

export interface PresupuestoItem {
  id_presupuesto: number;
  id_orden?: number | null;
  id_ingreso: number;
  id_admin: number;
  num_presupuesto_padre?: number | string | null;
  num_presupuesto: string | number;
  tipo: 'inicial' | 'extra';
  monto_subtotal: number | string;
  porcentaje_iva: number | string;
  monto_iva: number | string;
  monto_total: number | string;
  estado: 'pendiente' | 'aceptada' | 'rechazada' | 'anulada' | 'aceptado' | 'rechazado' | 'anulado';
  pdf_presupuesto?: string | null;
  fecha_creacion: string;
  fecha_vencimiento?: string | null;
  fecha_anulacion?: string | null;
  id_admin_anulacion?: number | null;
  motivo_anulacion?: string | null;

  // Relaciones cargadas por el backend
  ingreso?: IngresoItem & {
    tipoOrden?: TipoOrdenItem;
    tipo_orden?: TipoOrdenItem;
  };
  orden?: OrdenItem & {
    tipoOrden?: TipoOrdenItem;
    tipo_orden?: TipoOrdenItem;
  };
}

export interface PresupuestoRepuestoItem {
  id_repuesto: number;
  costo_unitario_base?: number;
  precio_unitario: number;
  porcentaje_ganancia?: number;
  cantidad: number;
  monto_total_linea_base?: number;
  monto_total_linea: number;
}

export interface PresupuestoServicioTallerItem {
  id_servicio_taller: number;
  costo_unitario_base?: number;
  precio_unitario: number;
  porcentaje_ganancia?: number;
  cantidad: number;
  monto_total_linea_base?: number;
  monto_total_linea: number;
}

export interface CreatePresupuestoInicialPayload {
  id_ingreso: number;
  monto_subtotal: number;
  porcentaje_iva: number;
  monto_iva: number;
  monto_total: number;
  repuestos?: PresupuestoRepuestoItem[];
  servicios_taller?: PresupuestoServicioTallerItem[];
}

export interface CreatePresupuestoExtraPayload {
  id_orden: number;
  id_ingreso?: number;
  monto_subtotal: number;
  porcentaje_iva: number;
  monto_iva: number;
  monto_total: number;
  repuestos?: PresupuestoRepuestoItem[];
  servicios_taller?: PresupuestoServicioTallerItem[];
}

export type CreateUpdatePresupuestoPayload = CreatePresupuestoInicialPayload | CreatePresupuestoExtraPayload;

export interface AceptarPresupuestoPayload {
  fecha_fin_tentativa?: string;
  id_cliente?: number;
}

export interface AnularPresupuestoPayload {
  motivo_anulacion: string;
}

