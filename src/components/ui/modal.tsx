"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function Modal({ isOpen, onClose, className, children }: DialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className={`fixed inset-0 flex items-center justify-center z-50 ${isOpen ? '' : 'pointer-events-none'}`}>
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition ${isOpen ? '' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div className={`relative transition shadow-xl/20 ${isOpen ? '' : 'scale-95 opacity-0'} ${className}`}>
        {children}
      </div>
    </div>,
    document.body
  );
}

