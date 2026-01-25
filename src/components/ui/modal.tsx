import { useFolderEditModal } from "@/hooks/useFolderEditModal";

interface DialogProps {
  className?: string;
  children?: React.ReactNode;
}

export function Modal({ className, children }: DialogProps) {
  const { modalProps } = useFolderEditModal();

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 ${modalProps.isOpen ? '' : 'pointer-events-none'}`}>
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition ${modalProps.isOpen ? '' : 'opacity-0'}`}
        onClick={modalProps.onClose}
      />
      <div className={`absolute transition shadow-xl/20 ${modalProps.isOpen ? '' : 'scale-95 opacity-0'} ${className}`}>
        {children}
      </div>
    </div>
  );
}

