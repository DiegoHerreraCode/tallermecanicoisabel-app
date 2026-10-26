export interface VariableItem {
  id_variable: number;
  nombre: string;
  valor: string;
  tipo: string;
}

export interface UpdateVariablePayload {
  id_variable: number;
  nombre?: string;
  valor: string;
  tipo?: string;
}
