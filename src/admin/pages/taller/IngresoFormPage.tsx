import { useState, useMemo } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Save, Car } from 'lucide-react';
import { getVehiculosAction } from '../../actions/get-vehiculos.action';
import { getClientesAction } from '../../actions/get-clientes.action';
import { getModelosVehiculosAction } from '../../actions/get-modelos-vehiculos.action';
import { getMarcasVehiculosAction } from '../../actions/get-marcas-vehiculos.action';
import { getTiposOrdenesAction } from '../../actions/get-tipos-ordenes.action';
import { useIngresoMutation } from '../../hooks/useIngresoMutation';
import type { CreateIngresoPayload } from '../../interfaces/ingreso.interface';

export const IngresoFormPage = () => {
  const { createIngreso, isCreating } = useIngresoMutation();

  // 1. Tipos de ordenes
  const { data: tiposOrdenes = [] } = useQuery({
    queryKey: ['tipos-ordenes-listado'],
    queryFn: getTiposOrdenesAction,
  });

  // 2. Vehículos
  const { data: vehiculos = [], isLoading: isLoadingVehiculos } = useQuery({
    queryKey: ['vehiculos-listado'],
    queryFn: getVehiculosAction,
  });

  // 3. Clientes, Modelos y Marcas para enriquecer el select de vehículos
  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes-listado'],
    queryFn: getClientesAction,
  });

  const { data: modelosVehiculos = [] } = useQuery({
    queryKey: ['modelos-vehiculos-listado'],
    queryFn: getModelosVehiculosAction,
  });

  const { data: marcasVehiculos = [] } = useQuery({
    queryKey: ['marcas-vehiculos-listado'],
    queryFn: getMarcasVehiculosAction,
  });

  // Mapas
  const clientesMap = useMemo(() => {
    const map = new Map<number, { nombre: string; cedula: string }>();
    clientes.forEach((c) =>
      map.set(c.id_cliente, { nombre: c.nombre, cedula: c.cedula })
    );
    return map;
  }, [clientes]);

  const marcasMap = useMemo(() => {
    const map = new Map<number, string>();
    marcasVehiculos.forEach((m) => map.set(m.id_marca_vehiculo, m.nombre));
    return map;
  }, [marcasVehiculos]);

  const modelosMap = useMemo(() => {
    const map = new Map<number, { nombre: string; marca: string }>();
    modelosVehiculos.forEach((mod) => {
      const marcaNombre =
        mod.marca?.nombre || marcasMap.get(mod.id_marca_vehiculo) || '';
      map.set(mod.id_modelo_vehiculo, {
        nombre: mod.nombre,
        marca: marcaNombre,
      });
    });
    return map;
  }, [modelosVehiculos, marcasMap]);

  // Form State
  const [formData, setFormData] = useState<CreateIngresoPayload>({
    id_tipo_orden: 0,
    id_vehiculo: 0,
    observaciones_cliente: '',
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === 'id_tipo_orden' || name === 'id_vehiculo') {
      setFormData((prev) => ({
        ...prev,
        [name]: value ? Number(value) : 0,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.id_tipo_orden || formData.id_tipo_orden <= 0) {
      toast.warning('Por favor selecciona el tipo de orden');
      return;
    }

    if (!formData.id_vehiculo || formData.id_vehiculo <= 0) {
      toast.warning('Por favor selecciona el vehículo');
      return;
    }

    createIngreso({
      id_tipo_orden: Number(formData.id_tipo_orden),
      id_vehiculo: Number(formData.id_vehiculo),
      observaciones_cliente: formData.observaciones_cliente?.trim() || null,
    });
  };

  // Opciones de tipo de orden (asegurando las 3 opciones del boceto si no están cargadas aún)
  const tiposOrdenOptions = useMemo(() => {
    if (tiposOrdenes && tiposOrdenes.length > 0) {
      return tiposOrdenes;
    }
    return [
      { id_tipo_orden: 1, nombre: 'diagnostico' },
      { id_tipo_orden: 2, nombre: 'reparacion' },
      { id_tipo_orden: 3, nombre: 'mantenimiento' },
    ];
  }, [tiposOrdenes]);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* 1. Encabezado con Botón Volver */}
      <div className="flex items-center justify-between pb-2 border-b border-border/80">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/taller/ingresos"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Car className="w-6 h-6 text-blue-500" />
              Registrar Nuevo Ingreso
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Registra el ingreso de un vehículo de cliente al taller
            </p>
          </div>
        </div>
      </div>

      {/* 2. Formulario */}
      <form
        onSubmit={handleSubmit}
        className="bg-card p-6 rounded-2xl border border-border/80 shadow-xs space-y-5"
      >
        {/* Tipo de Orden */}
        <div>
          <label className="block text-xs font-bold text-foreground mb-1.5">
            Tipo de Orden <span className="text-rose-500">*</span>
          </label>
          <select
            name="id_tipo_orden"
            value={formData.id_tipo_orden}
            onChange={handleChange}
            required
            className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 cursor-pointer capitalize"
          >
            <option value={0}>seleccione el tipo de orden</option>
            {tiposOrdenOptions.map((to) => (
              <option key={to.id_tipo_orden} value={to.id_tipo_orden}>
                {to.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Vehículo */}
        <div>
          <label className="block text-xs font-bold text-foreground mb-1.5">
            Vehículo <span className="text-rose-500">*</span>
          </label>
          <select
            name="id_vehiculo"
            value={formData.id_vehiculo}
            onChange={handleChange}
            required
            disabled={isLoadingVehiculos}
            className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 cursor-pointer disabled:opacity-50"
          >
            <option value={0}>
              {isLoadingVehiculos
                ? 'Cargando vehículos...'
                : 'seleccione el vehículo'}
            </option>
            {vehiculos.map((v) => {
              const cliente = clientesMap.get(v.id_cliente);
              const modelo = modelosMap.get(v.id_modelo_vehiculo);
              const modeloNombre = modelo?.nombre || 'N/A';
              const marcaNombre = modelo?.marca || '';
              const clienteNombre = cliente?.nombre || 'Sin cliente';
              const clienteCedula = cliente?.cedula ? `(C.I. ${cliente.cedula})` : '';

              return (
                <option key={v.id_vehiculo} value={v.id_vehiculo}>
                  [{v.placa}] {modeloNombre} {marcaNombre} — Propietario: {clienteNombre} {clienteCedula}
                </option>
              );
            })}
          </select>
        </div>

        {/* Observaciones del Cliente */}
        <div>
          <label className="block text-xs font-bold text-foreground mb-1.5">
            Observaciones del Cliente
          </label>
          <textarea
            name="observaciones_cliente"
            rows={4}
            value={formData.observaciones_cliente || ''}
            onChange={handleChange}
            placeholder="Ingrese las observaciones del cliente..."
            className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          />
        </div>

        {/* Botón Guardar según boceto */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80">
          <Link
            to="/admin/taller/ingresos"
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isCreating}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default IngresoFormPage;
