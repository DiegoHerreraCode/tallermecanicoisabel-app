import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  className?: string;
  zIndex?: number;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = 'Procesando solicitud...',
  className = '',
  zIndex = 9999,
}) => {
  if (!isLoading) return null;

  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xs transition-all animate-fadeIn ${className}`}
      style={{ zIndex }}
      tabIndex={-1}
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-card p-6 rounded-2xl border border-border/80 shadow-2xl flex flex-col items-center gap-3.5 max-w-xs w-full mx-4 text-center">
        <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-foreground">Por favor espera</h4>
          <p className="text-xs text-muted-foreground mt-1">{message}</p>
        </div>
      </div>
    </div>
  );
};
