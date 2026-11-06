import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';
import { QuickCreateModal } from '@/components/ui/quick-create-modal';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { createUpdateVehiculoAction } from '../../actions/create-update-vehiculo.action';
import { QuickCreateClienteModal } from './QuickCreateClienteModal';
import { QuickCreateTipoVehiculoModal } from './QuickCreateTipoVehiculoModal';
import { QuickCreateModeloVehiculoModal } from './QuickCreateModeloVehiculoModal';
import type { VehiculoItem } from '../../interfaces/vehiculo.interface';
import type { ClienteItem } from '../../interfaces/cliente.interface';
import type { TipoVehiculoItem } from '../../interfaces/tipo-vehiculo.interface';
import type { ModeloVehiculoItem } from '../../interfaces/modelo-vehiculo.interface';
import type { MarcaVehiculoItem } from '../../interfaces/marca-vehiculo.interface';

interface QuickCreateVehiculoModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientes: ClienteItem[];
  tiposVehiculos: TipoVehiculoItem[];
  modelosVehiculos: ModeloVehiculoItem[];
  marcasVehiculos?: MarcaVehiculoItem[];
  defaultClienteId?: number;
  onSuccess: (newVehiculo: VehiculoItem) => void;
  zIndex?: number;
}

export const QuickCreateVehiculoModal: React.FC<QuickCreateVehiculoModalProps> = ({
  isOpen,
  onClose,
  clientes,
  tiposVehiculos,
  modelosVehiculos,
  marcasVehiculos = [],
  defaultClienteId,
  onSuccess,
  zIndex = 100,
}) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    id_cliente: defaultClienteId || 0,
    id_tipo_vehiculo: 0,
    id_modelo_vehiculo: 0,
    placa: '',
    annio: String(new Date().getFullYear()),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modales anidados (Modales dentro de modales con zIndex superior)
  const [isCreateClienteOpen, setIsCreateClienteOpen] = useState(false);
  const [isCreateTipoOpen, setIsCreateTipoOpen] = useState(false);
  const [isCreateModeloOpen, setIsCreateModeloOpen] = useState(false);

  React.useEffect(() => {
    if (defaultClienteId) {
      setFormData((prev) => ({ ...prev, id_cliente: defaultClienteId }));
    }
  }, [defaultClienteId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'placa') {
      setFormData((prev) => ({ ...prev, placa: value.toUpperCase() }));
      return;
    }
    if (name === 'id_cliente' || name === 'id_tipo_vehiculo' || name === 'id_modelo_vehiculo') {
      setFormData((prev) => ({ ...prev, [name]: Number(value) }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id_cliente || formData.id_cliente <= 0) {
      toast.warning('Por favor selecciona el cliente propietario');
      return;
    }
    if (!formData.id_tipo_vehiculo || formData.id_tipo_vehiculo <= 0) {
      toast.warning('Por favor selecciona el tipo de vehículo');
      return;
    }
    if (!formData.id_modelo_vehiculo || formData.id_modelo_vehiculo <= 0) {
      toast.warning('Por favor selecciona el modelo del vehículo');
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

    try {
      setIsSubmitting(true);
      const created = await createUpdateVehiculoAction({
        id_cliente: formData.id_cliente,
        id_tipo_vehiculo: formData.id_tipo_vehiculo,
        id_modelo_vehiculo: formData.id_modelo_vehiculo,
        placa: formData.placa.trim().toUpperCase(),
        annio: formData.annio.trim(),
      });
      toast.success('Vehículo registrado exitosamente');
      await queryClient.invalidateQueries({ queryKey: ['vehiculos-listado'] });
      setFormData({
        id_cliente: defaultClienteId || 0,
        id_tipo_vehiculo: 0,
        id_modelo_vehiculo: 0,
        placa: '',
        annio: String(new Date().getFullYear()),
      });
      onSuccess(created);
      onClose();
    } catch (error: any) {
      const errors = error.response?.data?.errors;
      if (errors && typeof errors === 'object') {
        const firstKey = Object.keys(errors)[0];
        toast.error(errors[firstKey][0]);
      } else {
        toast.error(error.response?.data?.message || 'Error al registrar el vehículo');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <LoadingOverlay
        isLoading={isSubmitting}
        message="Guardando datos del vehículo..."
        zIndex={zIndex + 50}
      />
      <QuickCreateModal
        isOpen={isOpen}
        onClose={onClose}
        title="Registrar Nuevo Vehículo"
        description="Ingresa los datos del vehículo para seleccionarlo en el ingreso"
        maxWidth="max-w-lg"
        zIndex={zIndex}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Cliente */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-foreground">
                  Cliente Propietario <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCreateClienteOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nuevo Cliente
                </button>
              </div>
              <select
                name="id_cliente"
                value={formData.id_cliente}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 disabled:opacity-50 cursor-pointer"
              >
                <option value={0}>Selecciona un cliente...</option>
                {clientes.map((c) => (
                  <option key={c.id_cliente} value={c.id_cliente}>
                    {c.nombre} (C.I. {c.cedula})
                  </option>
                ))}
              </select>
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
              <select
                name="id_tipo_vehiculo"
                value={formData.id_tipo_vehiculo}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 disabled:opacity-50 cursor-pointer"
              >
                <option value={0}>Selecciona un tipo...</option>
                {tiposVehiculos.map((t) => (
                  <option key={t.id_tipo_vehiculo} value={t.id_tipo_vehiculo}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Modelo */}
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
              <select
                name="id_modelo_vehiculo"
                value={formData.id_modelo_vehiculo}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 disabled:opacity-50 cursor-pointer"
              >
                <option value={0}>Selecciona un modelo...</option>
                {modelosVehiculos.map((m) => (
                  <option key={m.id_modelo_vehiculo} value={m.id_modelo_vehiculo}>
                    {m.nombre} {m.marca ? `(${m.marca.nombre})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Placa */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Placa <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="placa"
                value={formData.placa}
                onChange={handleChange}
                placeholder="Ej: ABC12D"
                required
                disabled={isSubmitting}
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground uppercase font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 disabled:opacity-50"
              />
            </div>

            {/* Año */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Año <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                name="annio"
                value={formData.annio}
                onChange={handleChange}
                min="1900"
                max={new Date().getFullYear() + 2}
                required
                disabled={isSubmitting}
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Registrar Vehículo</span>
            </button>
          </div>
        </form>
      </QuickCreateModal>

      {/* Modales Anidados */}
      <QuickCreateClienteModal
        isOpen={isCreateClienteOpen}
        onClose={() => setIsCreateClienteOpen(false)}
        zIndex={zIndex + 20}
        onSuccess={(newCliente) => {
          setFormData((prev) => ({ ...prev, id_cliente: newCliente.id_cliente }));
        }}
      />

      <QuickCreateTipoVehiculoModal
        isOpen={isCreateTipoOpen}
        onClose={() => setIsCreateTipoOpen(false)}
        zIndex={zIndex + 20}
        onSuccess={(newTipo) => {
          setFormData((prev) => ({ ...prev, id_tipo_vehiculo: newTipo.id_tipo_vehiculo }));
        }}
      />

      <QuickCreateModeloVehiculoModal
        isOpen={isCreateModeloOpen}
        onClose={() => setIsCreateModeloOpen(false)}
        marcas={marcasVehiculos}
        zIndex={zIndex + 20}
        onSuccess={(newModelo) => {
          setFormData((prev) => ({ ...prev, id_modelo_vehiculo: newModelo.id_modelo_vehiculo }));
        }}
      />
    </>
  );
};
