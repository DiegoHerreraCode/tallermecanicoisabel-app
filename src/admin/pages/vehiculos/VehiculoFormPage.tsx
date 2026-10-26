import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Save, Lock, User, Car } from 'lucide-react';
import { getVehiculoByIdAction } from '../../actions/get-vehiculo-by-id.action';
import { getClientesAction } from '../../actions/get-clientes.action';
import { getTiposVehiculosAction } from '../../actions/get-tipos-vehiculos.action';
import { getModelosVehiculosAction } from '../../actions/get-modelos-vehiculos.action';
import { getMarcasVehiculosAction } from '../../actions/get-marcas-vehiculos.action';
import { useVehiculoMutation } from '../../hooks/useVehiculoMutation';
import type { CreateUpdateVehiculoPayload } from '../../interfaces/vehiculo.interface';

export const VehiculoFormPage = () => {
  const { id } = useParams<{ id: string }>();

  // Si id === 'new', estamos creando; en cualquier otro caso estamos editando
  const isCreating = !id || id === 'new';

  const { saveVehiculo, isPending } = useVehiculoMutation();

  // Consultas de catálogos necesarios
  const { data: clientes = [], isLoading: isLoadingClientes } = useQuery({
    queryKey: ['clientes-listado'],
    queryFn: getClientesAction,
  });

  const { data: tiposVehiculos = [], isLoading: isLoadingTipos } = useQuery({
    queryKey: ['tipos-vehiculos-listado'],
    queryFn: getTiposVehiculosAction,
  });

  const { data: modelosVehiculos = [], isLoading: isLoadingModelos } = useQuery({
    queryKey: ['modelos-vehiculos-listado'],
    queryFn: getModelosVehiculosAction,
  });

  const { data: marcasVehiculos = [], isLoading: isLoadingMarcas } = useQuery({
    queryKey: ['marcas-vehiculos-listado'],
    queryFn: getMarcasVehiculosAction,
  });

  // Consulta los datos del vehículo si estamos en modo edición
  const { data: vehiculoData, isLoading: isLoadingVehiculo } = useQuery({
    queryKey: ['vehiculo-item', id],
    queryFn: () => getVehiculoByIdAction(id!),
    enabled: !isCreating,
  });

  const [formData, setFormData] = useState<CreateUpdateVehiculoPayload>({
    id_cliente: 0,
    id_tipo_vehiculo: 0,
    id_modelo_vehiculo: 0,
    placa: '',
    annio: '',
  });

  // Marca seleccionada para filtrar los modelos disponibles de forma ágil
  const [selectedMarcaId, setSelectedMarcaId] = useState<number>(0);

  // Mapa de marcas
  const marcasMap = useMemo(() => {
    const map = new Map<number, string>();
    marcasVehiculos.forEach((m) => map.set(m.id_marca_vehiculo, m.nombre));
    return map;
  }, [marcasVehiculos]);

  // Modelos filtrados por marca si hay una marca seleccionada
  const filteredModelos = useMemo(() => {
    if (!selectedMarcaId) return modelosVehiculos;
    return modelosVehiculos.filter((m) => m.id_marca_vehiculo === selectedMarcaId);
  }, [modelosVehiculos, selectedMarcaId]);

  // Sincronizar datos al cargar vehículo existente
  useEffect(() => {
    if (vehiculoData) {
      setFormData({
        id_cliente: vehiculoData.id_cliente || 0,
        id_tipo_vehiculo: vehiculoData.id_tipo_vehiculo || 0,
        id_modelo_vehiculo: vehiculoData.id_modelo_vehiculo || 0,
        placa: vehiculoData.placa || '',
        annio: vehiculoData.annio || '',
      });

      // Si el modelo tiene marca asociada, sincronizar marca seleccionada
      const foundModelo = modelosVehiculos.find(
        (m) => m.id_modelo_vehiculo === vehiculoData.id_modelo_vehiculo
      );
      if (foundModelo && foundModelo.id_marca_vehiculo) {
        setSelectedMarcaId(foundModelo.id_marca_vehiculo);
      }
    }
  }, [vehiculoData, modelosVehiculos]);

  // Manejar cambios en inputs y selects
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'placa') {
      // Placas en mayúsculas
      setFormData((prev) => ({
        ...prev,
        placa: value.toUpperCase(),
      }));
      return;
    }

    if (
      name === 'id_cliente' ||
      name === 'id_tipo_vehiculo' ||
      name === 'id_modelo_vehiculo'
    ) {
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

  // Manejar cambio en selector de marca (filtro auxiliar de modelos)
  const handleMarcaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const marcaId = Number(e.target.value);
    setSelectedMarcaId(marcaId);

    // Si el modelo actualmente seleccionado no pertenece a la nueva marca, resetearlo
    if (marcaId > 0 && formData.id_modelo_vehiculo) {
      const modeloActual = modelosVehiculos.find(
        (m) => m.id_modelo_vehiculo === formData.id_modelo_vehiculo
      );
      if (modeloActual && modeloActual.id_marca_vehiculo !== marcaId) {
        setFormData((prev) => ({ ...prev, id_modelo_vehiculo: 0 }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isCreating && (!formData.id_cliente || formData.id_cliente <= 0)) {
      toast.warning('Por favor selecciona un cliente');
      return;
    }

    if (!formData.id_tipo_vehiculo || formData.id_tipo_vehiculo <= 0) {
      toast.warning('Por favor selecciona un tipo de vehículo');
      return;
    }

    if (!formData.id_modelo_vehiculo || formData.id_modelo_vehiculo <= 0) {
      toast.warning('Por favor selecciona un modelo de vehículo');
      return;
    }

    if (!formData.placa.trim()) {
      toast.warning('Por favor ingresa la placa del vehículo');
      return;
    }

    if (!formData.annio.trim()) {
      toast.warning('Por favor ingresa el año del vehículo');
      return;
    }

    if (isCreating) {
      saveVehiculo({
        payload: {
          id_cliente: Number(formData.id_cliente),
          id_tipo_vehiculo: Number(formData.id_tipo_vehiculo),
          id_modelo_vehiculo: Number(formData.id_modelo_vehiculo),
          placa: formData.placa.trim().toUpperCase(),
          annio: formData.annio.trim(),
        },
      });
    } else {
      // En modo edición el id_cliente NO es editable bajo ninguna circunstancia
      saveVehiculo({
        payload: {
          id_tipo_vehiculo: Number(formData.id_tipo_vehiculo),
          id_modelo_vehiculo: Number(formData.id_modelo_vehiculo),
          placa: formData.placa.trim().toUpperCase(),
          annio: formData.annio.trim(),
        },
        id,
      });
    }
  };

  const isLoadingCatalogs =
    isLoadingClientes || isLoadingTipos || isLoadingModelos || isLoadingMarcas;

  if (isLoadingVehiculo || (isLoadingCatalogs && !isCreating)) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Obtener datos del cliente actual para mostrar en modo edición
  const clienteActual = clientes.find(
    (c) => c.id_cliente === formData.id_cliente
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Encabezado con Botón Volver */}
      <div className="flex items-center justify-between pb-2 border-b border-border/80">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/vehiculos/listado"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Car className="w-6 h-6 text-emerald-500" />
              {isCreating ? 'Registrar Nuevo Vehiculo' : 'Editar Vehiculo'}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isCreating
                ? 'Agrega un nuevo vehiculo'
                : `Modificando datos del vehiculo`}
            </p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-card p-6 rounded-2xl border border-border/80 shadow-xs space-y-5">
        {/* Cliente asociado: NO editable cuando se está editando */}
        <div>
          <label className="block text-xs font-bold text-foreground mb-1.5">
            Cliente Propietario <span className="text-rose-500">*</span>
          </label>

          {isCreating ? (
            <div className="relative">
              <select
                name="id_cliente"
                value={formData.id_cliente}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 cursor-pointer"
                required
              >
                <option value={0}>Selecciona un cliente...</option>
                {clientes.map((cli) => (
                  <option key={cli.id_cliente} value={cli.id_cliente}>
                    {cli.nombre} - C.I. {cli.cedula}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="relative flex items-center justify-between p-3.5 bg-muted/40 border border-border/80 rounded-xl">
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <span className="font-semibold text-sm text-foreground">
                    {clienteActual ? clienteActual.nombre : `Cliente #${formData.id_cliente}`}
                  </span>
                  {clienteActual?.cedula && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (C.I. {clienteActual.cedula})
                    </span>
                  )}
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-foreground border border-border/80">
                <Lock className="w-3 h-3" />
                No editable
              </span>
            </div>
          )}
          {!isCreating && (
            <p className="text-xs text-muted-foreground mt-1">
              El cliente asociado a este vehículo no puede ser modificado durante la edición.
            </p>
          )}
        </div>

        {/* Tipo de Vehículo */}
        <div>
          <label className="block text-xs font-bold text-foreground mb-1.5">
            Tipo de Vehículo <span className="text-rose-500">*</span>
          </label>
          <select
            name="id_tipo_vehiculo"
            value={formData.id_tipo_vehiculo}
            onChange={handleChange}
            className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 cursor-pointer"
            required
          >
            <option value={0}>Selecciona un tipo de vehículo...</option>
            {tiposVehiculos.map((tipo) => (
              <option key={tipo.id_tipo_vehiculo} value={tipo.id_tipo_vehiculo}>
                {tipo.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Marca (Filtro auxiliar) y Modelo de Vehículo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Marca (Filtrar modelos)
            </label>
            <select
              value={selectedMarcaId}
              onChange={handleMarcaChange}
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 cursor-pointer"
            >
              <option value={0}>Todas las marcas...</option>
              {marcasVehiculos.map((marca) => (
                <option key={marca.id_marca_vehiculo} value={marca.id_marca_vehiculo}>
                  {marca.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Modelo de Vehículo <span className="text-rose-500">*</span>
            </label>
            <select
              name="id_modelo_vehiculo"
              value={formData.id_modelo_vehiculo}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 cursor-pointer"
              required
            >
              <option value={0}>Selecciona un modelo...</option>
              {filteredModelos.map((mod) => {
                const marcaNombre =
                  mod.marca?.nombre || marcasMap.get(mod.id_marca_vehiculo) || '';
                return (
                  <option key={mod.id_modelo_vehiculo} value={mod.id_modelo_vehiculo}>
                    {mod.nombre} {marcaNombre ? `(${marcaNombre})` : ''}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Placa y Año */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Placa <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="placa"
              value={formData.placa}
              onChange={handleChange}
              placeholder="Ej. ABC12D"
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground uppercase font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Año <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="annio"
              value={formData.annio}
              onChange={handleChange}
              placeholder="Ej. 2018"
              maxLength={4}
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              required
            />
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80">
          <Link
            to="/admin/vehiculos/listado"
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Vehículo</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
