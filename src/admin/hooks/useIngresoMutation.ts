import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  createUpdateIngresoAction,
  type CreateUpdateIngresoPayload,
} from '../actions/create-update-ingreso.action';
import { anularIngresoAction } from '../actions/anular-ingreso.action';
import { uploadPdfChecklistAction } from '../actions/upload-pdf-checklist.action';
import type { AnularIngresoPayload } from '../interfaces/ingreso.interface';

export const useIngresoMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Guardar (Crear o Actualizar) Ingreso
  const saveMutation = useMutation({
    mutationFn: ({
      payload,
      id,
    }: {
      payload: CreateUpdateIngresoPayload;
      id?: number | string;
    }) => createUpdateIngresoAction(payload, id),
    onSuccess: (_, variables) => {
      const isCreating = !variables.id || variables.id === 'new';
      toast.success(
        isCreating
          ? 'Ingreso registrado correctamente'
          : 'Ingreso actualizado correctamente'
      );
      queryClient.invalidateQueries({ queryKey: ['ingresos-listado'] });
      if (variables.id && variables.id !== 'new') {
        queryClient.invalidateQueries({ queryKey: ['ingreso-item', String(variables.id)] });
      }
      navigate('/admin/taller/ingresos');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Ocurrió un error al procesar la solicitud del ingreso';
      toast.error(message);
    },
  });

  // Anular Ingreso
  const anularMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: AnularIngresoPayload }) =>
      anularIngresoAction(id, payload),
    onSuccess: () => {
      toast.success('Ingreso anulado correctamente');
      queryClient.invalidateQueries({ queryKey: ['ingresos-listado'] });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Ocurrió un error al anular el ingreso';
      toast.error(message);
    },
  });

  // Subir PDF de Checklist
  const uploadPdfMutation = useMutation({
    mutationFn: ({ id, file }: { id: number | string; file: File }) =>
      uploadPdfChecklistAction(id, file),
    onSuccess: () => {
      toast.success('PDF de checklist subido correctamente');
      queryClient.invalidateQueries({ queryKey: ['ingresos-listado'] });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Ocurrió un error al subir el checklist en PDF';
      toast.error(message);
    },
  });

  return {
    saveIngreso: saveMutation.mutate,
    isPending: saveMutation.isPending,
    // Alias para compatibilidad
    createIngreso: (payload: CreateUpdateIngresoPayload) =>
      saveMutation.mutate({ payload }),
    isCreating: saveMutation.isPending,

    anularIngreso: anularMutation.mutate,
    isAnulando: anularMutation.isPending,
    uploadPdfChecklist: uploadPdfMutation.mutate,
    isUploadingPdf: uploadPdfMutation.isPending,
  };
};
