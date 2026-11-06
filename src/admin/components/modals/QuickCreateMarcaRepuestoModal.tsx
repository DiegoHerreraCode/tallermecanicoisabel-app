import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { QuickCreateModal } from '@/components/ui/quick-create-modal';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { createUpdateMarcaRepuestoAction } from '../../actions/create-update-marca-repuesto.action';
import type { MarcaRepuestoItem } from '../../interfaces/marca-repuesto.interface';

interface QuickCreateMarcaRepuestoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newMarca: MarcaRepuestoItem) => void;
  zIndex?: number;
}

export const QuickCreateMarcaRepuestoModal: React.FC<QuickCreateMarcaRepuestoModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  zIndex = 100,
}) => {
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.warning('Por favor ingresa el nombre de la marca');
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await createUpdateMarcaRepuestoAction({ nombre: nombre.trim() });
      toast.success('Marca de repuesto creada exitosamente');
      await queryClient.invalidateQueries({ queryKey: ['marcas-repuestos-listado'] });
      setNombre('');
      onSuccess(created);
      onClose();
    } catch (error: any) {
      const errors = error.response?.data?.errors;
      if (errors && typeof errors === 'object') {
        const firstKey = Object.keys(errors)[0];
        toast.error(errors[firstKey][0]);
      } else {
        toast.error(error.response?.data?.message || 'Error al crear la marca de repuesto');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <LoadingOverlay
        isLoading={isSubmitting}
        message="Guardando marca de repuesto..."
        zIndex={zIndex + 50}
      />
      <QuickCreateModal
        isOpen={isOpen}
        onClose={onClose}
        title="Nueva Marca de Repuesto"
        description="Registra rápidamente una marca para asignarla de inmediato"
        zIndex={zIndex}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Nombre de la Marca <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Bosch, Denso, AC Delco"
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
              <span>Crear Marca</span>
            </button>
          </div>
        </form>
      </QuickCreateModal>
    </>
  );
};
