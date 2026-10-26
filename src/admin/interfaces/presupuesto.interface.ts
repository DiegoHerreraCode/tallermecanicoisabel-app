export interface PresupuestoItem {
  id_presupuesto: number;
  id_orden?: number | null;
  id_ingreso: number;
  id_admin: number;
  num_presupuesto_padre?: number | null;
  num_presupuesto: number;
  tipo: 'inicial' | 'extra';
  monto_subtotal: number | string;
  porcentaje_iva: number | string;
  monto_iva: number | string;
  monto_total: number | string;
  estado: 'pendiente' | 'aceptado' | 'rechazado' | 'anulado';
  pdf_presupuesto?: string | null;
  fecha_creacion: string;
  fecha_vencimiento?: string | null;
  fecha_anulacion?: string | null;
  id_admin_anulacion?: number | null;
  motivo_anulacion?: string | null;
}
