import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative card max-w-md w-full animate-in fade-in zoom-in duration-200">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-warning" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-primary mb-2">{title || "Confirm Action"}</h3>
            <p className="text-text-muted text-sm leading-relaxed">
              {message || "Are you sure you want to proceed with this action?"}
            </p>
          </div>
          <div className="flex items-center gap-3 w-full pt-4">
            <button 
              onClick={onClose}
              className="btn-secondary w-full"
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm}
              className="btn-success w-full"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
