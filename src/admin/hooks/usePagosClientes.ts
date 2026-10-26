import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPagosClientesAction } from '../actions/get-pagos-clientes.action';
import { getClientesAction } from '../actions/get-clientes.action';
import { deletePagoClienteAction } from '../actions/delete-pago-cliente.action';
import { toast } from 'sonner';

export const usePagosClientes = () => {
  const queryClient = useQueryClient();

  // 1. Pagos de clientes
  const pagosQuery = useQuery({
    queryKey: ['pagos-clientes-listado'],
    queryFn: getPagosClientesAction,
    staleTime: 1000 * 60 * 3,
  });

  // 2. Clientes para mapear nombre y cedula de cada cliente según id_cliente
  const clientesQuery = useQuery({
    queryKey: ['clientes-map'],
    queryFn: getClientesAction,
    staleTime: 1000 * 60 * 5,
  });

  // Mutación para eliminar pago
  const deletePagoMutation = useMutation({
    mutationFn: ({ id }: { id: number | string; }) =>
      deletePagoClienteAction(id),
    onSuccess: () => {
      toast.success('Pago de cliente eliminado correctamente');
      queryClient.invalidateQueries({ queryKey: ['pagos-clientes-listado'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Error al eliminar el pago';
      toast.error(msg);
    },
  });

  return {
    pagos: pagosQuery.data || [],
    clientes: clientesQuery.data || [],
    isLoading: pagosQuery.isLoading || clientesQuery.isLoading,
    isError: pagosQuery.isError,
    refetch: pagosQuery.refetch,
    deletePago: deletePagoMutation.mutateAsync,
    isDeleting: deletePagoMutation.isPending,
  };
};
