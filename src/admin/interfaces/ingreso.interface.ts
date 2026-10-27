import type { VehiculoItem } from './vehiculo.interface';
import type { TipoOrden } from './orden.interface';

export type IngresoEstadoType =
  | 'checklist_pendiente'
  | 'esperando_orden'
  | 'confirmando_presupuesto'
  | 'orden_creada'
  | 'anulado';

export interface IngresoItem {
  id_ingreso: number;
  id_tipo_orden: number;
  id_vehiculo: number;
  id_admin?: number;
  fecha_ingreso: string;
  estado: IngresoEstadoType;
  observaciones_cliente?: string | null;
  pdf_checklist?: string | null;
  last_update?: string;
  fecha_anulacion?: string | null;
  id_admin_anulacion?: number | null;
  motivo_anulacion?: string | null;

  // Relaciones
  vehiculo?: VehiculoItem;
  tipo_orden?: TipoOrden;
}

export interface CreateIngresoPayload {
  id_tipo_orden: number;
  id_vehiculo: number;
  observaciones_cliente?: string | null;
}

export interface AnularIngresoPayload {
  motivo_anulacion: string;
}
