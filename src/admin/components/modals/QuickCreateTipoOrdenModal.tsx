import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { QuickCreateModal } from '@/components/ui/quick-create-modal';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { createUpdateTipoOrdenAction } from '../../actions/create-update-tipo-orden.action';
import type { TipoOrdenItem } from '../../interfaces/tipo-orden.interface';

interface QuickCreateTipoOrdenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTipo: TipoOrdenItem) => void;
  zIndex?: number;
}

export const QuickCreateTipoOrdenModal: React.FC<QuickCreateTipoOrdenModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  zIndex = 100,
}) => {
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.warning('Por favor ingresa el nombre del tipo de orden');
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await createUpdateTipoOrdenAction({
        nombre: nombre.trim().toLowerCase(),
        descripcion: descripcion.trim() || undefined,
      });
      toast.success('Tipo de orden creado exitosamente');
      await queryClient.invalidateQueries({ queryKey: ['tipos-ordenes-listado'] });
      setNombre('');
      setDescripcion('');
      onSuccess(created);
      onClose();
    } catch (error: any) {
      const errors = error.response?.data?.errors;
      if (errors && typeof errors === 'object') {
        const firstKey = Object.keys(errors)[0];
        toast.error(errors[firstKey][0]);
      } else {
        toast.error(error.response?.data?.message || 'Error al crear el tipo de orden');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <LoadingOverlay
        isLoading={isSubmitting}
        message="Guardando tipo de orden..."
        zIndex={zIndex + 50}
      />
      <QuickCreateModal
        isOpen={isOpen}
        onClose={onClose}
        title="Nuevo Tipo de Orden"
        description="Registra una categoría operativa (ej: diagnóstico, mantenimiento, reparación)"
        zIndex={zIndex}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Nombre del Tipo de Orden <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: diagnóstico, mantenimiento, revisión general"
              required
              disabled={isSubmitting}
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 disabled:opacity-50"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Descripción (Opcional)
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalles sobre el alcance del tipo de orden..."
              rows={2}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 disabled:opacity-50 resize-none"
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
              <span>Crear Tipo de Orden</span>
            </button>
          </div>
        </form>
      </QuickCreateModal>
    </>
  );
};
