export interface MarcaRepuestoItem {
  id_marca_repuesto: number;
  nombre: string;
}

export interface RepuestoItem {
  id_repuesto: number;
  id_marca_repuesto: number;
  nombre_modelo: string;
  ultimo_costo_compra_unitario: number | string;
  monto_venta: number | string;
  utilidad: number | string;
  porcentaje_ganancia: number | string;
  marca?: MarcaRepuestoItem;
}

export interface CreateUpdateRepuestoPayload {
  id_marca_repuesto: number;
  nombre_modelo: string;
  ultimo_costo_compra_unitario: number;
  monto_venta: number;
  utilidad: number;
  porcentaje_ganancia: number;
}
