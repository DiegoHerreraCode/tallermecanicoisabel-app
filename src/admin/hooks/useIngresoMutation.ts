import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { createIngresoAction } from '../actions/create-ingreso.action';
import { anularIngresoAction } from '../actions/anular-ingreso.action';
import { uploadPdfChecklistAction } from '../actions/upload-pdf-checklist.action';
import type { CreateIngresoPayload, AnularIngresoPayload } from '../interfaces/ingreso.interface';

export const useIngresoMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Mutación para crear ingreso
  const createMutation = useMutation({
    mutationFn: (payload: CreateIngresoPayload) => createIngresoAction(payload),
    onSuccess: () => {
      toast.success('Ingreso registrado correctamente');
      queryClient.invalidateQueries({ queryKey: ['ingresos-listado'] });
      navigate('/admin/taller/ingresos');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Ocurrió un error al registrar el ingreso del vehículo';
      toast.error(message);
    },
  });

  // Mutación para anular ingreso
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

  // Mutación para subir PDF de checklist
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
    createIngreso: createMutation.mutate,
    isCreating: createMutation.isPending,
    anularIngreso: anularMutation.mutate,
    isAnulando: anularMutation.isPending,
    uploadPdfChecklist: uploadPdfMutation.mutate,
    isUploadingPdf: uploadPdfMutation.isPending,
  };
};
