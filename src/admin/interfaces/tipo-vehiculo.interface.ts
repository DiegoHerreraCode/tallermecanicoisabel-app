export interface TipoVehiculoItem {
  id_tipo_vehiculo: number;
  nombre: string;
}

export interface CreateUpdateTipoVehiculoPayload {
  nombre: string;
}