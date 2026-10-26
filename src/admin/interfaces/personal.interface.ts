export interface PersonalItem {
  id_personal: number;
  nombre: string;
  cedula: string;
  correo: string;
  num_tlf: string;
  direccion?: string | null;
  disponible: boolean;
  is_deleted: boolean;
}
