import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Save, Users } from 'lucide-react';
import { getMarcaRepuestoByIdAction } from '../../actions/get-marca-repuesto-by-id.action';
import { useMarcaRepuestoMutation } from '../../hooks/useMarcaRepuestoMutation';
import type { CreateUpdateMarcaRepuestoPayload } from '../../actions/create-update-marca-repuesto.action';

export const MarcaRepuestoFormPage = () => {
  const { id } = useParams<{ id: string }>();

  // Si id === 'new', estamos creando; en cualquier otro caso estamos editando
  const isCreating = !id || id === 'new';

  // Hook dedicado para guardar/actualizar marca de repuesto (Estilo Teslo Shop)
  const { saveMarcaRepuesto, isPending } = useMarcaRepuestoMutation();

  // Consulta los datos de la marca de repuesto si estamos en modo edición
  const { data: marcaRepuestoData, isLoading: isLoadingMarcaRepuesto } = useQuery({
    queryKey: ['marca-repuesto-item', id],
    queryFn: () => getMarcaRepuestoByIdAction(id!),
    enabled: !isCreating,
  });

  // Estado del formulario local unificado con formData
  const [formData, setFormData] = useState<CreateUpdateMarcaRepuestoPayload>({
    nombre: ''
  });

  // Sincronizar datos al cargar la marca de repuesto existente
  useEffect(() => {
    if (marcaRepuestoData) {
      setFormData({
        nombre: marcaRepuestoData.nombre || ''
      });
    }
  }, [marcaRepuestoData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.nombre
    ) {
      toast.warning('Por favor completa todos los campos requeridos');
      return;
    }

    saveMarcaRepuesto({
      payload: formData,
      id: isCreating ? undefined : id,
    });
  };

  if (isLoadingMarcaRepuesto) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl animate-fadeIn mx-auto">
      {/* Encabezado con Botón Volver */}
      <div className="flex items-center justify-between pb-2 border-b border-border/80">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/inventario-servicios/marcas"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-500" />
              {isCreating ? 'Registrar Nueva Marca de Repuesto' : 'Editar Marca de Repuesto'}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isCreating
                ? 'Agrega una nueva marca de repuesto'
                : `Modificando datos de la marca de repuesto: ${formData.nombre}`}
            </p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-card p-6 rounded-2xl border border-border/80 shadow-xs space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
          {/* Nombre */}
          <div className="sm:col-span-1">
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Nombre de la Marca <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Bosch, Brembo, Wix"
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Botones de Cancelar y Guardar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80">
          <Link
            to="/admin/inventario-servicios/marcas"
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isPending ? 'Guardando...' : 'Guardar Información'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MarcaRepuestoFormPage;
