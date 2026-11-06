import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { QuickCreateModal } from '@/components/ui/quick-create-modal';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { createUpdateClienteAction } from '../../actions/create-update-cliente.action';
import type { ClienteItem } from '../../interfaces/cliente.interface';

interface QuickCreateClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCliente: ClienteItem) => void;
  zIndex?: number;
}

export const QuickCreateClienteModal: React.FC<QuickCreateClienteModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  zIndex = 100,
}) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    nombre: '',
    cedula: '',
    correo: '',
    num_tlf: '',
    direccion: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.cedula.trim()) {
      toast.warning('El nombre y la cédula son obligatorios');
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await createUpdateClienteAction({
        nombre: formData.nombre.trim(),
        cedula: formData.cedula.trim(),
        correo: formData.correo.trim() || undefined,
        num_tlf: formData.num_tlf.trim() || undefined,
        direccion: formData.direccion.trim() || undefined,
      });
      toast.success('Cliente registrado exitosamente');
      await queryClient.invalidateQueries({ queryKey: ['clientes-listado'] });
      await queryClient.invalidateQueries({ queryKey: ['clientes-select'] });
      setFormData({
        nombre: '',
        cedula: '',
        correo: '',
        num_tlf: '',
        direccion: '',
      });
      onSuccess(created);
      onClose();
    } catch (error: any) {
      const errors = error.response?.data?.errors;
      if (errors && typeof errors === 'object') {
        const firstKey = Object.keys(errors)[0];
        toast.error(errors[firstKey][0]);
      } else {
        toast.error(error.response?.data?.message || 'Error al registrar el cliente');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <LoadingOverlay
        isLoading={isSubmitting}
        message="Guardando datos del cliente..."
        zIndex={zIndex + 50}
      />
      <QuickCreateModal
        isOpen={isOpen}
        onClose={onClose}
        title="Registrar Nuevo Cliente"
        description="Ingresa los datos del cliente para seleccionarlo inmediatamente"
        maxWidth="max-w-lg"
        zIndex={zIndex}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Nombre Completo <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Juan Pérez"
                required
                disabled={isSubmitting}
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 disabled:opacity-50"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Cédula / RIF <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="cedula"
                value={formData.cedula}
                onChange={handleChange}
                placeholder="Ej: V-12345678"
                required
                disabled={isSubmitting}
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Teléfono
              </label>
              <input
                type="tel"
                name="num_tlf"
                value={formData.num_tlf}
                onChange={handleChange}
                placeholder="Ej: +58 412 1234567"
                disabled={isSubmitting}
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Correo Electrónico
              </label>
              <input
                type="email"
                name="correo"
                value={formData.correo}
                onChange={handleChange}
                placeholder="cliente@ejemplo.com"
                disabled={isSubmitting}
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Dirección
            </label>
            <input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              placeholder="Ej: Av. Principal, Edificio Central, Apt. 4B"
              disabled={isSubmitting}
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 disabled:opacity-50"
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
              <span>Registrar Cliente</span>
            </button>
          </div>
        </form>
      </QuickCreateModal>
    </>
  );
};
