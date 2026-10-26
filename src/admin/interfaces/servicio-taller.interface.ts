import type { TipoServicioTallerItem } from './tipo-servicio-taller.interface';

export interface ServicioTallerItem {
  id_servicio_taller: number;
  id_tipo_servicio_taller: number;
  nombre: string;
  descripcion?: string | null;
  costo: number;
  monto_venta: number;
  utilidad: number;
  porcentaje_ganancia: number;
  is_deleted: boolean;
  tipo_servicio_taller?: TipoServicioTallerItem;
}
