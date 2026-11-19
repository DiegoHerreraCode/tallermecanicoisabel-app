import type { VehiculoItem } from './vehiculo.interface';
import type { TipoOrdenItem } from './tipo-orden.interface';
import type { HallazgoTecnicoItem } from './orden.interface';

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
  reingreso_por_falla?: boolean;
  image?: string | null;
  imagePath?: string | null;
  last_update?: string;
  fecha_anulacion?: string | null;
  id_admin_anulacion?: number | null;
  motivo_anulacion?: string | null;

  // Relaciones
  vehiculo?: VehiculoItem;
  tipo_orden?: TipoOrdenItem;
  hallazgos_tecnicos?: HallazgoTecnicoItem[];
}

export interface CreateIngresoPayload {
  id_tipo_orden: number;
  id_vehiculo: number;
  observaciones_cliente?: string | null;
  reingreso_por_falla?: boolean;
}

export interface AnularIngresoPayload {
  motivo_anulacion: string;
}
