import React from 'react';

interface ModalSectionProps {
  title?: string;
  children?: React.ReactNode;
  className?: string;
}

interface ModalItemProps {
  label: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

interface ModalLabelProps {
  children: React.ReactNode;
  className?: string;
}

// ModalSection 컴포넌트 - 드롭다운 내부의 섹션을 정의합니다
export const ModalSection: React.FC<ModalSectionProps> = ({
  title,
  children,
  className = ''
}) => {
  return (
    <div className={`py-2 last:pb-3 space-y-3 ${className}`}>
      {title && (
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/70">
          {title}
        </p>
      )}
      {children && (
        <div className="space-y-4">
          {children}
        </div>
      )}
    </div>
  );
};

// ModalLabel 컴포넌트 - 드롭다운 내부의 레이블을 정의합니다
export const ModalLabel: React.FC<ModalLabelProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`px-3 py-2 text-sm font-medium text-foreground ${className}`}>
      {children}
    </div>
  );
};

// ModalItem 컴포넌트 - 드롭다운 내부의 개별 항목을 정의합니다
export const ModalItem: React.FC<ModalItemProps> = ({
  label,
  icon,
  children,
  className = ''
}) => {
  return (
    <div className={`flex flex-col px-3 rounded-md ${className}`}>
      <label className='flex items-center justify-between cursor-pointer'>
        <div className="flex items-center pr-12">
          <div className="flex items-center text-sm whitespace-nowrap select-none">
            {icon && <div className="mr-3">{icon}</div>} {label}
          </div>
        </div>
        {children}
      </label>
    </div>
  );
};

// ModalSeparator 컴포넌트 - 드롭다운 내부의 구분선을 정의합니다
export const ModalSeparator: React.FC = () => {
  return <div className="h-px bg-border mx-1 my-2" />;
};

interface ModalHeaderProps {
  title: string;
  className?: string;
  children?: React.ReactNode;
}

export function ModalHeader({ title, className = "", children }: ModalHeaderProps) {
  return (
    <div className="h-14 mb-2">
      <div className={`h-full flex items-center justify-between px-4 ${className}`}>
        <p className="font-bold text-foreground">{title}</p>
        {children}
      </div>
      <div className="h-px bg-border" />
    </div>
  );
}

interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalBody({ children, className = "" }: ModalBodyProps) {
  return (
    <div className={`py-2 px-5 ${className}`}>
      {children}
    </div>
  );
}

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalFooter({ children, className = "" }: ModalFooterProps) {
  return (
    <div className={`flex gap-4 p-4 text-sm ${className}`}>
      {children}
    </div>
  );
}

interface ModalButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: 'default' | 'destructive' | 'primary';
}

export function ModalButton({ children, onClick, className = "", disabled = false, type = 'default' }: ModalButtonProps) {
  const classNameByType = {
    default: 'border hover:border-muted-foreground/50 hover:text-foreground text-sm text-foreground/70',
    destructive: 'border bg-destructive/5 hover:bg-destructive/10 border-destructive/30 text-destructive hover:border-destructive/70',
    primary: 'border bg-primary/5 hover:bg-primary/10 border-primary/70 hover:border-primary text-foreground/70 hover:text-foreground'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 py-2 rounded text-center ${classNameByType[type]} ${className} disabled:pointer-events-none`}
    >
      {children}
    </button>
  );
}
