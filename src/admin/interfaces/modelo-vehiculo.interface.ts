import type { MarcaVehiculoItem } from './marca-vehiculo.interface';

export interface ModeloVehiculoItem {
  id_modelo_vehiculo: number;
  id_marca_vehiculo: number;
  nombre: string;
  marca?: MarcaVehiculoItem;
}

export interface CreateUpdateModeloVehiculoPayload {
  nombre: string;
  id_marca_vehiculo: number;
}
