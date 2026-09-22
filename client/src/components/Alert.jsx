import React from 'react';
import { AlertCircle, CheckCircle2, XCircle, Info } from 'lucide-react';

export default function Alert({ type = 'info', message, onClose }) {
  if (!message) return null;

  const styles = {
    error: 'bg-danger/10 border-danger/20 text-danger',
    success: 'bg-success/10 border-success/20 text-success',
    info: 'bg-accent/10 border-accent/20 text-accent',
    warning: 'bg-warning/10 border-warning/20 text-warning'
  };

  const icons = {
    error: <XCircle className="h-4 w-4 mt-0.5 shrink-0" />,
    success: <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />,
    info: <Info className="h-4 w-4 mt-0.5 shrink-0" />,
    warning: <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
  };

  return (
    <div className={`flex items-start justify-between gap-2.5 p-3 rounded-xl border text-sm transition-all duration-300 ease-in-out ${styles[type]}`}>
      <div className="flex items-start gap-2.5">
        {icons[type]}
        <span>{message}</span>
      </div>
      {onClose && (
        <button type="button" onClick={onClose} className="hover:opacity-70 transition-opacity focus:outline-none">
          <XCircle className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
