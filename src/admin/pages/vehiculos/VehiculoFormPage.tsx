import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Save, Lock, User, Car, Plus } from 'lucide-react';
import { getVehiculoByIdAction } from '../../actions/get-vehiculo-by-id.action';
import { getClientesAction } from '../../actions/get-clientes.action';
import { getTiposVehiculosAction } from '../../actions/get-tipos-vehiculos.action';
import { getModelosVehiculosAction } from '../../actions/get-modelos-vehiculos.action';
import { getMarcasVehiculosAction } from '../../actions/get-marcas-vehiculos.action';
import { useVehiculoMutation } from '../../hooks/useVehiculoMutation';
import type { CreateUpdateVehiculoPayload } from '../../interfaces/vehiculo.interface';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { QuickCreateClienteModal } from '../../components/modals/QuickCreateClienteModal';
import { QuickCreateTipoVehiculoModal } from '../../components/modals/QuickCreateTipoVehiculoModal';
import { QuickCreateMarcaVehiculoModal } from '../../components/modals/QuickCreateMarcaVehiculoModal';
import { QuickCreateModeloVehiculoModal } from '../../components/modals/QuickCreateModeloVehiculoModal';

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

  // Opciones para SearchableSelects
  const marcasOptions = useMemo(() => {
    return [
      { value: 0, label: 'Todas las marcas...', searchText: 'todas todas las marcas' },
      ...marcasVehiculos.map((m) => ({
        value: m.id_marca_vehiculo,
        label: m.nombre,
        searchText: m.nombre,
      })),
    ];
  }, [marcasVehiculos]);

  const tiposVehiculosOptions = useMemo(() => {
    return tiposVehiculos.map((t) => ({
      value: t.id_tipo_vehiculo,
      label: t.nombre,
      searchText: t.nombre,
    }));
  }, [tiposVehiculos]);

  // Opciones de clientes para SearchableSelect con búsqueda por nombre y cédula
  const clientesOptions = useMemo(() => {
    return clientes.map((c) => ({
      value: c.id_cliente,
      label: c.nombre,
      subtext: `C.I. ${c.cedula}`,
      searchText: `${c.nombre} ${c.cedula}`,
    }));
  }, [clientes]);

  const modelosVehiculosOptions = useMemo(() => {
    return filteredModelos.map((mod) => {
      const marcaNombre = mod.marca?.nombre || marcasMap.get(mod.id_marca_vehiculo) || '';
      return {
        value: mod.id_modelo_vehiculo,
        label: mod.nombre,
        subtext: marcaNombre ? `(${marcaNombre})` : undefined,
        searchText: `${mod.nombre} ${marcaNombre}`,
      };
    });
  }, [filteredModelos, marcasMap]);

  // Modales Quick-Create In-Situ
  const [isCreateClienteOpen, setIsCreateClienteOpen] = useState(false);
  const [isCreateTipoOpen, setIsCreateTipoOpen] = useState(false);
  const [isCreateMarcaOpen, setIsCreateMarcaOpen] = useState(false);
  const [isCreateModeloOpen, setIsCreateModeloOpen] = useState(false);

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

    const placaVal = formData.placa?.trim() ?? '';
    const annioVal = formData.annio?.trim() ?? '';

    if (!placaVal) {
      toast.warning('Por favor ingresa la placa del vehículo');
      return;
    }

    if (!annioVal) {
      toast.warning('Por favor ingresa el año del vehículo');
      return;
    }

    if (isCreating) {
      saveVehiculo({
        payload: {
          id_cliente: Number(formData.id_cliente),
          id_tipo_vehiculo: Number(formData.id_tipo_vehiculo),
          id_modelo_vehiculo: Number(formData.id_modelo_vehiculo),
          placa: placaVal.toUpperCase(),
          annio: annioVal,
        },
      });
    } else {
      // En modo edición el id_cliente NO es editable bajo ninguna circunstancia
      saveVehiculo({
        payload: {
          id_tipo_vehiculo: Number(formData.id_tipo_vehiculo),
          id_modelo_vehiculo: Number(formData.id_modelo_vehiculo),
          placa: placaVal.toUpperCase(),
          annio: annioVal,
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
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-foreground">
              Cliente Propietario <span className="text-rose-500">*</span>
            </label>
            {isCreating && (
              <button
                type="button"
                onClick={() => setIsCreateClienteOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Nuevo Cliente
              </button>
            )}
          </div>

          {isCreating ? (
            <SearchableSelect
              options={clientesOptions}
              value={formData.id_cliente}
              onChange={(val) =>
                setFormData((prev) => ({
                  ...prev,
                  id_cliente: val ? Number(val) : 0,
                }))
              }
              placeholder="Selecciona un cliente..."
              searchPlaceholder="Buscar por nombre o cédula..."
              emptyMessage="No se encontraron clientes"
              required
            />
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
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-foreground">
              Tipo de Vehículo <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setIsCreateTipoOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Nuevo Tipo
            </button>
          </div>
          <SearchableSelect
            options={tiposVehiculosOptions}
            value={formData.id_tipo_vehiculo}
            onChange={(val) =>
              setFormData((prev) => ({
                ...prev,
                id_tipo_vehiculo: val ? Number(val) : 0,
              }))
            }
            placeholder="Selecciona un tipo de vehículo..."
            searchPlaceholder="Buscar por nombre del tipo de vehículo..."
            emptyMessage="No se encontraron tipos de vehículos"
            required
          />
        </div>

        {/* Marca (Filtro auxiliar) y Modelo de Vehículo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-foreground">
                Marca (Filtrar modelos)
              </label>
              <button
                type="button"
                onClick={() => setIsCreateMarcaOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Nueva Marca
              </button>
            </div>
            <SearchableSelect
              options={marcasOptions}
              value={selectedMarcaId}
              onChange={(val) => {
                const marcaId = val ? Number(val) : 0;
                setSelectedMarcaId(marcaId);
                // Si el modelo actual no pertenece a la nueva marca, limpiar modelo
                if (marcaId !== 0) {
                  const modeloValido = modelosVehiculos.find(
                    (m) =>
                      m.id_modelo_vehiculo === formData.id_modelo_vehiculo &&
                      m.id_marca_vehiculo === marcaId
                  );
                  if (!modeloValido) {
                    setFormData((prev) => ({
                      ...prev,
                      id_modelo_vehiculo: 0,
                    }));
                  }
                }
              }}
              placeholder="Todas las marcas..."
              searchPlaceholder="Buscar por nombre de marca..."
              emptyMessage="No se encontraron marcas"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-foreground">
                Modelo de Vehículo <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCreateModeloOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Nuevo Modelo
              </button>
            </div>
            <SearchableSelect
              options={modelosVehiculosOptions}
              value={formData.id_modelo_vehiculo}
              onChange={(val) => {
                const modeloId = val ? Number(val) : 0;
                setFormData((prev) => ({
                  ...prev,
                  id_modelo_vehiculo: modeloId,
                }));
                // Sincronizar marca si está seleccionada "todas"
                if (modeloId) {
                  const mod = modelosVehiculos.find((m) => m.id_modelo_vehiculo === modeloId);
                  if (mod && mod.id_marca_vehiculo && !selectedMarcaId) {
                    setSelectedMarcaId(mod.id_marca_vehiculo);
                  }
                }
              }}
              placeholder="Selecciona un modelo..."
              searchPlaceholder="Buscar por nombre del modelo de vehículo..."
              emptyMessage="No se encontraron modelos de vehículos"
              required
            />
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

      {/* Modales Quick-Create In-Situ */}
      <QuickCreateClienteModal
        isOpen={isCreateClienteOpen}
        onClose={() => setIsCreateClienteOpen(false)}
        onSuccess={(newCliente) => {
          setFormData((prev) => ({
            ...prev,
            id_cliente: newCliente.id_cliente,
          }));
        }}
      />

      <QuickCreateTipoVehiculoModal
        isOpen={isCreateTipoOpen}
        onClose={() => setIsCreateTipoOpen(false)}
        onSuccess={(newTipo) => {
          setFormData((prev) => ({
            ...prev,
            id_tipo_vehiculo: newTipo.id_tipo_vehiculo,
          }));
        }}
      />

      <QuickCreateMarcaVehiculoModal
        isOpen={isCreateMarcaOpen}
        onClose={() => setIsCreateMarcaOpen(false)}
        onSuccess={(newMarca) => {
          setSelectedMarcaId(newMarca.id_marca_vehiculo);
        }}
      />

      <QuickCreateModeloVehiculoModal
        isOpen={isCreateModeloOpen}
        onClose={() => setIsCreateModeloOpen(false)}
        marcas={marcasVehiculos}
        defaultMarcaId={selectedMarcaId || undefined}
        onSuccess={(newModelo) => {
          setFormData((prev) => ({
            ...prev,
            id_modelo_vehiculo: newModelo.id_modelo_vehiculo,
          }));
          if (newModelo.id_marca_vehiculo) {
            setSelectedMarcaId(newModelo.id_marca_vehiculo);
          }
        }}
      />
    </div>
  );
};
