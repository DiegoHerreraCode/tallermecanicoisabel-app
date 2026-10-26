export interface MarcaVehiculoItem {
  id_marca_vehiculo: number;
  nombre: string;
}

export interface CreateUpdateMarcaVehiculoPayload {
  nombre: string;
}