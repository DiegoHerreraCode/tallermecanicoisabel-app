import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getVariablesAction } from '../actions/get-variables.action';
import { updateVariableAction } from '../actions/update-variable.action';
import type { UpdateVariablePayload } from '../interfaces/variable.interface';

export const useVariables = () => {
  const queryClient = useQueryClient();

  const variablesQuery = useQuery({
    queryKey: ['variables'],
    queryFn: getVariablesAction,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const updateVariableMutation = useMutation({
    mutationFn: (variablesToUpdate: UpdateVariablePayload[]) => {
      return Promise.all(variablesToUpdate.map((payload) => updateVariableAction(payload)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variables'] });
      toast.success('Variables del sistema actualizadas correctamente');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Error al guardar las variables del sistema';
      toast.error(message);
    },
  });

  return {
    variables: variablesQuery.data || [],
    isLoading: variablesQuery.isLoading,
    isSaving: updateVariableMutation.isPending,
    saveVariables: updateVariableMutation.mutateAsync,
    refetch: variablesQuery.refetch,
  };
};
