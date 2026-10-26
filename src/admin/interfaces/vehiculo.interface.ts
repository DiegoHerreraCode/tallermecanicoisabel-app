import type { ClienteItem } from './cliente.interface';
import type { TipoVehiculoItem } from './tipo-vehiculo.interface';
import type { ModeloVehiculoItem } from './modelo-vehiculo.interface';

export interface VehiculoItem {
  id_vehiculo: number;
  id_cliente: number;
  id_tipo_vehiculo: number;
  id_modelo_vehiculo: number;
  placa: string;
  annio: string;
  cliente?: ClienteItem;
  tipo_vehiculo?: TipoVehiculoItem;
  modelo?: ModeloVehiculoItem;
  created_at?: string;
  updated_at?: string;
}

export interface CreateVehiculoPayload {
  id_cliente: number;
  id_tipo_vehiculo: number;
  id_modelo_vehiculo: number;
  placa: string;
  annio: string;
}

export interface UpdateVehiculoPayload {
  id_tipo_vehiculo?: number;
  id_modelo_vehiculo?: number;
  placa?: string;
  annio?: string;
  // id_cliente no es editable al actualizar
  id_cliente?: number;
}

export type CreateUpdateVehiculoPayload = CreateVehiculoPayload | UpdateVehiculoPayload;
