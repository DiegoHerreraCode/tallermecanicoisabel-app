import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';
import { QuickCreateModal } from '@/components/ui/quick-create-modal';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { createUpdateModeloVehiculoAction } from '../../actions/create-update-modelo-vehiculo.action';
import { QuickCreateMarcaVehiculoModal } from './QuickCreateMarcaVehiculoModal';
import type { ModeloVehiculoItem } from '../../interfaces/modelo-vehiculo.interface';
import type { MarcaVehiculoItem } from '../../interfaces/marca-vehiculo.interface';

interface QuickCreateModeloVehiculoModalProps {
  isOpen: boolean;
  onClose: () => void;
  marcas: MarcaVehiculoItem[];
  defaultMarcaId?: number;
  onSuccess: (newModelo: ModeloVehiculoItem) => void;
  zIndex?: number;
}

export const QuickCreateModeloVehiculoModal: React.FC<QuickCreateModeloVehiculoModalProps> = ({
  isOpen,
  onClose,
  marcas,
  defaultMarcaId,
  onSuccess,
  zIndex = 100,
}) => {
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState('');
  const [idMarca, setIdMarca] = useState<number>(defaultMarcaId || (marcas[0]?.id_marca_vehiculo ?? 0));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal anidado para crear nueva marca de vehículo desde este modal
  const [isCreateMarcaOpen, setIsCreateMarcaOpen] = useState(false);

  // Sincronizar defaultMarcaId si cambia
  React.useEffect(() => {
    if (defaultMarcaId) {
      setIdMarca(defaultMarcaId);
    } else if (marcas.length > 0 && !idMarca) {
      setIdMarca(marcas[0].id_marca_vehiculo);
    }
  }, [defaultMarcaId, marcas]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.warning('Por favor ingresa el nombre del modelo');
      return;
    }
    if (!idMarca || idMarca <= 0) {
      toast.warning('Por favor selecciona la marca a la que pertenece el modelo');
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await createUpdateModeloVehiculoAction({
        nombre: nombre.trim(),
        id_marca_vehiculo: idMarca,
      });
      toast.success('Modelo de vehículo creado exitosamente');
      await queryClient.invalidateQueries({ queryKey: ['modelos-vehiculos-listado'] });
      setNombre('');
      onSuccess(created);
      onClose();
    } catch (error: any) {
      const errors = error.response?.data?.errors;
      if (errors && typeof errors === 'object') {
        const firstKey = Object.keys(errors)[0];
        toast.error(errors[firstKey][0]);
      } else {
        toast.error(error.response?.data?.message || 'Error al crear el modelo de vehículo');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <LoadingOverlay
        isLoading={isSubmitting}
        message="Guardando modelo de vehículo..."
        zIndex={zIndex + 50}
      />
      <QuickCreateModal
        isOpen={isOpen}
        onClose={onClose}
        title="Nuevo Modelo de Vehículo"
        description="Registra un modelo asignándolo a su marca correspondiente"
        zIndex={zIndex}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-foreground">
                Marca del Vehículo <span className="text-rose-500">*</span>
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
            <select
              value={idMarca}
              onChange={(e) => setIdMarca(Number(e.target.value))}
              required
              disabled={isSubmitting}
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 disabled:opacity-50 cursor-pointer"
            >
              <option value={0}>Selecciona una marca...</option>
              {marcas.map((m) => (
                <option key={m.id_marca_vehiculo} value={m.id_marca_vehiculo}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Nombre del Modelo <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Corolla, Yaris, Hilux, Civic, Spark"
              required
              disabled={isSubmitting}
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 disabled:opacity-50"
              autoFocus
            />
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
              <span>Crear Modelo</span>
            </button>
          </div>
        </form>
      </QuickCreateModal>

      {/* Modal anidado para Crear Marca */}
      <QuickCreateMarcaVehiculoModal
        isOpen={isCreateMarcaOpen}
        onClose={() => setIsCreateMarcaOpen(false)}
        zIndex={zIndex + 20}
        onSuccess={(newMarca) => {
          setIdMarca(newMarca.id_marca_vehiculo);
        }}
      />
    </>
  );
};
