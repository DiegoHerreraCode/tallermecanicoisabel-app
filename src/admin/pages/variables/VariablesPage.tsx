import { useState, useEffect, useMemo } from 'react';
import { Settings, Save, RefreshCw } from 'lucide-react';
import { useVariables } from '../../hooks/useVariables';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const VariablesPage = () => {
  const { variables, isLoading, isSaving, saveVariables, refetch } = useVariables();

  // Estados locales para los valores de los inputs
  const [porcentajeIva, setPorcentajeIva] = useState<string>('19');
  const [calculoGanancia, setCalculoGanancia] = useState<'sobre_venta' | 'sobre_costo'>('sobre_venta');

  // Identificar los objetos originales en la base de datos
  const varIvaOriginal = useMemo(
    () => variables.find((v) => v.nombre === 'porcentaje_iva'),
    [variables]
  );
  const varCalculoOriginal = useMemo(
    () => variables.find((v) => v.nombre === 'calculo_ganancia'),
    [variables]
  );

  // Sincronizar el estado local cuando se cargan las variables del backend
  useEffect(() => {
    if (varIvaOriginal) {
      setPorcentajeIva(String(varIvaOriginal.valor ?? '19'));
    }
    if (varCalculoOriginal) {
      const val = varCalculoOriginal.valor === 'sobre_costo' ? 'sobre_costo' : 'sobre_venta';
      setCalculoGanancia(val);
    }
  }, [varIvaOriginal, varCalculoOriginal]);

  // Determinar si han habido cambios respecto a los valores del backend
  const hasChanges = useMemo(() => {
    const originalIvaVal = String(varIvaOriginal?.valor ?? '19');
    const originalCalculoVal = String(varCalculoOriginal?.valor ?? 'sobre_venta');

    const ivaChanged = porcentajeIva.trim() !== originalIvaVal.trim();
    const calculoChanged = calculoGanancia !== originalCalculoVal;

    return ivaChanged || calculoChanged;
  }, [porcentajeIva, calculoGanancia, varIvaOriginal, varCalculoOriginal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasChanges || isSaving) return;

    const updates = [];

    if (varIvaOriginal && porcentajeIva.trim() !== String(varIvaOriginal.valor).trim()) {
      updates.push({
        id_variable: varIvaOriginal.id_variable,
        valor: porcentajeIva.trim(),
      });
    }

    if (varCalculoOriginal && calculoGanancia !== varCalculoOriginal.valor) {
      updates.push({
        id_variable: varCalculoOriginal.id_variable,
        valor: calculoGanancia,
      });
    }

    if (updates.length > 0) {
      await saveVariables(updates);
    }
  };

  return (
    <div className="space-y-8 pb-10 max-w-4xl">
      {/* Título de la página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <Settings size={18} />
            Configuración General
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Variables del Sistema
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Administración de parámetros globales para cálculos de IVA y márgenes de ganancia
          </p>
        </div>

        <Button
          onClick={() => refetch()}
          variant="outline"
          size="sm"
          disabled={isLoading || isSaving}
          className="flex items-center gap-1.5 self-start sm:self-auto rounded-xl shadow-xs cursor-pointer"
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          <span>{isLoading ? 'Cargando...' : 'Recargar'}</span>
        </Button>
      </div>

      {/* Tarjeta / Contenedor principal del formulario según el boceto */}
      <div className="bg-card p-6 sm:p-10 rounded-2xl border border-border/80 shadow-xs w-full flex justify-center">
        <form onSubmit={handleSubmit} className="space-y-8 max-w-xl">
          {/* Fila: Porcentaje de Iva */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Label
              htmlFor="porcentaje_iva"
              className="text-base sm:text-lg font-medium text-foreground min-w-[200px]"
            >
              Porcentaje de Iva
            </Label>
            <div className="w-full sm:w-44">
              <Input
                id="porcentaje_iva"
                type="number"
                min="0"
                max="100"
                step="any"
                value={porcentajeIva}
                onChange={(e) => setPorcentajeIva(e.target.value)}
                disabled={isLoading || isSaving}
                className="text-center font-bold text-base h-11 rounded-xl border-border/80 focus:border-primary"
                placeholder="19"
                required
              />
            </div>
          </div>

          {/* Fila: Cálculo de Ganancia (Select con: sobre_venta, sobre_costo) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Label
              htmlFor="calculo_ganancia"
              className="text-base sm:text-lg font-medium text-foreground min-w-[200px]"
            >
              Cálculo de Ganancia
            </Label>
            <div className="w-full sm:w-44 relative">
              <select
                id="calculo_ganancia"
                value={calculoGanancia}
                onChange={(e) =>
                  setCalculoGanancia(e.target.value as 'sobre_venta' | 'sobre_costo')
                }
                disabled={isLoading || isSaving}
                className="w-full h-11 px-3.5 pr-8 rounded-xl border border-border/80 bg-background text-foreground text-sm font-semibold focus:outline-none focus:border-primary cursor-pointer transition-colors shadow-xs appearance-none"
              >
                <option value="sobre_venta">sobre_venta</option>
                <option value="sobre_costo">sobre_costo</option>
              </select>
              {/* Ícono de flecha hacia abajo SVG nativo como en el boceto */}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Botón Guardar (disabled si no han habido cambios) */}
          <div className="pt-4 flex justify-start sm:justify-center">
            <Button
              type="submit"
              disabled={!hasChanges || isSaving || isLoading}
              className="w-40 h-11 rounded-xl font-bold text-sm bg-sky-400 hover:bg-sky-500 text-sky-950 dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-white shadow-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save size={16} />
              <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VariablesPage;
