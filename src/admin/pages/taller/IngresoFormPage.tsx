import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Save, Car, Plus, Upload, X, ImageIcon } from 'lucide-react';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { getVehiculosAction } from '../../actions/get-vehiculos.action';
import { getClientesAction } from '../../actions/get-clientes.action';
import { getModelosVehiculosAction } from '../../actions/get-modelos-vehiculos.action';
import { getMarcasVehiculosAction } from '../../actions/get-marcas-vehiculos.action';
import { getTiposOrdenesAction } from '../../actions/get-tipos-ordenes.action';
import { getTiposVehiculosAction } from '../../actions/get-tipos-vehiculos.action';
import { createUpdateIngresoAction } from '../../actions/create-update-ingreso.action';
import { uploadImageChecklistAction } from '../../actions/upload-pdf-checklist.action';
import { useIngresoMutation } from '../../hooks/useIngresoMutation';
import type { CreateIngresoPayload } from '../../interfaces/ingreso.interface';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { QuickCreateVehiculoModal } from '../../components/modals/QuickCreateVehiculoModal';
import { QuickCreateTipoOrdenModal } from '../../components/modals/QuickCreateTipoOrdenModal';
import { useQueryClient } from '@tanstack/react-query';

export const IngresoFormPage = () => {
  const queryClient = useQueryClient();
  const { createIngreso, isCreating } = useIngresoMutation();
  const { goBack, navigate } = useAppNavigation();

  // Estados para modal de Subir Checklist (Guardar y Subir Checklist)
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [archivoImagen, setArchivoImagen] = useState<File | null>(null);
  const [previewImagen, setPreviewImagen] = useState<string | null>(null);
  const [isSavingWithChecklist, setIsSavingWithChecklist] = useState(false);

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

  const { data: tiposVehiculos = [] } = useQuery({
    queryKey: ['tipos-vehiculos-listado'],
    queryFn: getTiposVehiculosAction,
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

  // Opciones de vehículos para SearchableSelect con búsqueda por cliente, cédula y placa
  const vehiculoOptions = useMemo(() => {
    return vehiculos.map((v) => {
      const cliente = clientesMap.get(v.id_cliente);
      const modelo = modelosMap.get(v.id_modelo_vehiculo);
      const modeloNombre = modelo?.nombre || 'N/A';
      const marcaNombre = modelo?.marca || '';
      const clienteNombre = cliente?.nombre || 'Sin cliente';
      const clienteCedula = cliente?.cedula ? `C.I. ${cliente.cedula}` : '';

      return {
        value: v.id_vehiculo,
        label: `[${v.placa}] ${modeloNombre} ${marcaNombre}`,
        description: `Propietario: ${clienteNombre} ${clienteCedula ? `(${clienteCedula})` : ''}`,
        searchText: `${v.placa} ${clienteNombre} ${cliente?.cedula || ''} ${modeloNombre} ${marcaNombre}`,
      };
    });
  }, [vehiculos, clientesMap, modelosMap]);

  // Form State
  const [formData, setFormData] = useState<CreateIngresoPayload>({
    id_tipo_orden: 0,
    id_vehiculo: 0,
    observaciones_cliente: '',
  });

  // Modales Quick-Create In-Situ
  const [isCreateVehiculoOpen, setIsCreateVehiculoOpen] = useState(false);
  const [isCreateTipoOrdenOpen, setIsCreateTipoOrdenOpen] = useState(false);

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

  const validateForm = (): boolean => {
    if (!formData.id_tipo_orden || formData.id_tipo_orden <= 0) {
      toast.warning('Por favor selecciona el tipo de orden');
      return false;
    }

    if (!formData.id_vehiculo || formData.id_vehiculo <= 0) {
      toast.warning('Por favor selecciona el vehículo');
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    createIngreso({
      id_tipo_orden: Number(formData.id_tipo_orden),
      id_vehiculo: Number(formData.id_vehiculo),
      observaciones_cliente: formData.observaciones_cliente?.trim() || null,
      reingreso_por_falla: Boolean(formData.reingreso_por_falla),
    });
  };

  // Abrir modal para Guardar y Subir Checklist
  const handleOpenChecklistModal = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsChecklistModalOpen(true);
  };

  // Confirmar Guardar y Subir Checklist en modal
  const handleConfirmSaveWithChecklist = async () => {
    if (!archivoImagen) {
      toast.warning('Por favor selecciona la imagen del checklist');
      return;
    }

    try {
      setIsSavingWithChecklist(true);
      // 1. Crear el ingreso
      const nuevoIngreso = await createUpdateIngresoAction({
        id_tipo_orden: Number(formData.id_tipo_orden),
        id_vehiculo: Number(formData.id_vehiculo),
        observaciones_cliente: formData.observaciones_cliente?.trim() || null,
        reingreso_por_falla: Boolean(formData.reingreso_por_falla),
      });

      // 2. Subir imagen del checklist al nuevo ingreso (pasa automáticamente a esperando_orden)
      await uploadImageChecklistAction(nuevoIngreso.id_ingreso, archivoImagen);

      toast.success('Ingreso registrado y checklist subido correctamente (estado: esperando_orden)');
      queryClient.invalidateQueries({ queryKey: ['ingresos-listado'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate('/admin/taller/ingresos');
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Error al registrar el ingreso con el checklist';
      toast.error(msg);
    } finally {
      setIsSavingWithChecklist(false);
    }
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
          <button
            type="button"
            onClick={() => goBack('/admin/taller/ingresos')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
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
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-foreground">
              Vehículo <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setIsCreateVehiculoOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Nuevo Vehículo
            </button>
          </div>
          <SearchableSelect
            options={vehiculoOptions}
            value={formData.id_vehiculo}
            onChange={(val) =>
              setFormData((prev) => ({
                ...prev,
                id_vehiculo: val ? Number(val) : 0,
              }))
            }
            placeholder={
              isLoadingVehiculos
                ? 'Cargando vehículos...'
                : 'Seleccione el vehículo...'
            }
            searchPlaceholder="Buscar por placa, cliente o cédula..."
            emptyMessage="No se encontraron vehículos registrados"
            disabled={isLoadingVehiculos}
            required
          />
        </div>

        {/* Observaciones del Cliente */}
        <div>
          <label className="block text-xs font-bold text-foreground mb-1.5">
            Observaciones del Cliente
          </label>
          <textarea
            name="observaciones_cliente"
            rows={8}
            value={formData.observaciones_cliente || ''}
            onChange={handleChange}
            placeholder="Ingrese las observaciones del cliente..."
            className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          />
        </div>

        {/* Checkbox: Reingreso por Falla */}
        <div className="flex items-center gap-2 p-3 bg-muted/30 border border-border/70 rounded-xl">
          <input
            type="checkbox"
            id="reingreso_por_falla"
            name="reingreso_por_falla"
            checked={Boolean(formData.reingreso_por_falla)}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                reingreso_por_falla: e.target.checked,
              }))
            }
            className="w-4 h-4 rounded border-border/80 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <label htmlFor="reingreso_por_falla" className="text-xs sm:text-sm font-semibold text-foreground cursor-pointer select-none">
            ¿Es un reingreso por falla previa?
          </label>
        </div>

        {/* Botones de acción: Guardar y Guardar y Subir Checklist */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-border/80">
          <button
            type="button"
            onClick={() => goBack('/admin/taller/ingresos')}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={isCreating || isSavingWithChecklist}
            onClick={handleOpenChecklistModal}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20 transition-all cursor-pointer disabled:opacity-50"
            title="Registrar el ingreso y subir de inmediato la imagen del checklist (quedando en estado esperando_orden)"
          >
            <Upload className="w-4 h-4" />
            <span>Guardar y Subir Checklist</span>
          </button>

          <button
            type="submit"
            disabled={isCreating || isSavingWithChecklist}
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

      {/* MODAL: Subir Imagen de Checklist al Guardar */}
      {isChecklistModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-card border border-border/80 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/80">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-purple-500" />
                Guardar y Subir Checklist
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsChecklistModalOpen(false);
                  setArchivoImagen(null);
                  setPreviewImagen(null);
                }}
                className="p-1 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground">
              Adjunta la imagen correspondiente al checklist de este nuevo ingreso. Al confirmar, se creará el ingreso con su checklist asociado y su estado será directamente{' '}
              <span className="font-semibold text-blue-600 dark:text-blue-400">esperando_orden</span>.
            </p>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Foto o Imagen del Checklist <span className="text-rose-500">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setArchivoImagen(file);
                    setPreviewImagen(URL.createObjectURL(file));
                  }
                }}
                className="w-full text-xs text-foreground file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
              />
            </div>

            {/* Previsualización de la imagen seleccionada */}
            {previewImagen && (
              <div className="p-2 border border-border/80 rounded-xl bg-muted/20 flex flex-col items-center">
                <img
                  src={previewImagen}
                  alt="Vista previa del checklist"
                  className="max-h-48 object-contain rounded-lg"
                />
                <span className="text-[11px] text-muted-foreground mt-1 truncate max-w-xs">
                  {archivoImagen?.name}
                </span>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2 border-t border-border/80">
              <button
                type="button"
                disabled={isSavingWithChecklist}
                onClick={() => {
                  setIsChecklistModalOpen(false);
                  setArchivoImagen(null);
                  setPreviewImagen(null);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!archivoImagen || isSavingWithChecklist}
                onClick={handleConfirmSaveWithChecklist}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isSavingWithChecklist ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span>Guardando y Subiendo...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Confirmar y Subir</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modales Quick-Create In-Situ */}
      <QuickCreateVehiculoModal
        isOpen={isCreateVehiculoOpen}
        onClose={() => setIsCreateVehiculoOpen(false)}
        clientes={clientes}
        tiposVehiculos={tiposVehiculos}
        modelosVehiculos={modelosVehiculos}
        marcasVehiculos={marcasVehiculos}
        onSuccess={(newVehiculo) => {
          setFormData((prev) => ({
            ...prev,
            id_vehiculo: newVehiculo.id_vehiculo,
          }));
        }}
      />

      <QuickCreateTipoOrdenModal
        isOpen={isCreateTipoOrdenOpen}
        onClose={() => setIsCreateTipoOrdenOpen(false)}
        onSuccess={(newTipo) => {
          setFormData((prev) => ({
            ...prev,
            id_tipo_orden: newTipo.id_tipo_orden,
          }));
        }}
      />
    </div>
  );
};

export default IngresoFormPage;
