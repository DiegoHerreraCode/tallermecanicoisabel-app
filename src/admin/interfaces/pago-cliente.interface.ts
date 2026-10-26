export interface PagoClienteItem {
  id_pago_cliente: number;
  id_cliente: number;
  id_orden: number;
  monto: number | string;
  fecha_pago: string;
  metodo_pago: string;
  num_referencia?: string | null;
  image?: string | null;
  imagePath?: string | null;
  cliente?: {
    id_cliente: number;
    nombre: string;
  };
  orden?: {
    id_orden: number;
    id_tipo_orden?: number;
    monto_total?: number | string;
  };
}
