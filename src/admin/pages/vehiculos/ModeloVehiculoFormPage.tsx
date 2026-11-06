import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Save, Car, Plus } from 'lucide-react';
import { getModeloVehiculoByIdAction } from '../../actions/get-modelo-vehiculo-by-id.action';
import { getMarcasVehiculosAction } from '../../actions/get-marcas-vehiculos.action';
import { useModeloVehiculoMutation } from '../../hooks/useModeloVehiculoMutation';
import type { CreateUpdateModeloVehiculoPayload } from '../../interfaces/modelo-vehiculo.interface';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { QuickCreateMarcaVehiculoModal } from '../../components/modals/QuickCreateMarcaVehiculoModal';

export const ModeloVehiculoFormPage = () => {
  const { id } = useParams<{ id: string }>();

  // Si id === 'new', estamos creando; en cualquier otro caso estamos editando
  const isCreating = !id || id === 'new';

  const { saveModeloVehiculo, isPending } = useModeloVehiculoMutation();

  // Consulta listado de marcas de vehículos para el select
  const { data: marcasVehiculos = [] } = useQuery({
    queryKey: ['marcas-vehiculos-listado'],
    queryFn: getMarcasVehiculosAction,
  });

  // Opciones de marcas para SearchableSelect con búsqueda por nombre de marca
  const marcasOptions = useMemo(() => {
    return marcasVehiculos.map((m) => ({
      value: m.id_marca_vehiculo,
      label: m.nombre,
      searchText: m.nombre,
    }));
  }, [marcasVehiculos]);

  // Consulta los datos del modelo de vehículo si estamos en modo edición
  const { data: modeloVehiculoData, isLoading: isLoadingModeloVehiculo } = useQuery({
    queryKey: ['modelo-vehiculo-item', id],
    queryFn: () => getModeloVehiculoByIdAction(id!),
    enabled: !isCreating,
  });

  const [formData, setFormData] = useState<CreateUpdateModeloVehiculoPayload>({
    nombre: '',
    id_marca_vehiculo: 0,
  });

  // Modal de Creación In-Situ de Marca de Vehículo
  const [isCreateMarcaOpen, setIsCreateMarcaOpen] = useState(false);

  // Sincronizar datos al cargar el modelo de vehículo existente
  useEffect(() => {
    if (modeloVehiculoData) {
      setFormData({
        nombre: modeloVehiculoData.nombre || '',
        id_marca_vehiculo: modeloVehiculoData.id_marca_vehiculo || 0,
      });
    }
  }, [modeloVehiculoData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'id_marca_vehiculo' ? (value ? Number(value) : 0) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      toast.warning('Por favor ingresa el nombre del modelo');
      return;
    }

    if (!formData.id_marca_vehiculo || formData.id_marca_vehiculo <= 0) {
      toast.warning('Por favor selecciona una marca de vehículo');
      return;
    }

    saveModeloVehiculo({
      payload: {
        nombre: formData.nombre.trim(),
        id_marca_vehiculo: Number(formData.id_marca_vehiculo),
      },
      id: isCreating ? undefined : id,
    });
  };

  if (isLoadingModeloVehiculo) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl animate-fadeIn mx-auto">
      {/* Encabezado con Botón Volver */}
      <div className="flex items-center justify-between pb-2 border-b border-border/80">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/vehiculos/modelos"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Car className="w-6 h-6 text-blue-500" />
              {isCreating ? 'Registrar Nuevo Modelo de Vehículo' : 'Editar Modelo de Vehículo'}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isCreating
                ? 'Agrega un nuevo modelo de vehículo asociado a una marca'
                : `Modificando datos del modelo: ${formData.nombre}`}
            </p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-card p-6 rounded-2xl border border-border/80 shadow-xs space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Marca de Vehículo */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-foreground">
                Marca de Vehículo <span className="text-rose-500">*</span>
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
              value={formData.id_marca_vehiculo}
              onChange={(val) =>
                setFormData((prev) => ({
                  ...prev,
                  id_marca_vehiculo: val ? Number(val) : 0,
                }))
              }
              placeholder="Selecciona una marca..."
              searchPlaceholder="Buscar por nombre de marca..."
              emptyMessage="No se encontraron marcas"
              required
            />
          </div>

          {/* Nombre del Modelo */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Nombre del Modelo <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Corolla, Yaris, Hilux, Civic"
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Botones de Cancelar y Guardar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80">
          <Link
            to="/admin/vehiculos/modelos"
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isPending ? 'Guardando...' : 'Guardar Información'}
          </button>
        </div>
      </form>

      {/* Modal Quick-Create In-Situ de Marca de Vehículo */}
      <QuickCreateMarcaVehiculoModal
        isOpen={isCreateMarcaOpen}
        onClose={() => setIsCreateMarcaOpen(false)}
        onSuccess={(newMarca) => {
          setFormData((prev) => ({
            ...prev,
            id_marca_vehiculo: newMarca.id_marca_vehiculo,
          }));
        }}
      />
    </div>
  );
};

export default ModeloVehiculoFormPage;
