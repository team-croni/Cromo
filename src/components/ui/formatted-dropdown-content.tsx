import React from 'react';

interface DropdownSectionProps {
  title?: string;
  children?: React.ReactNode;
  className?: string;
}

interface DropdownItemProps {
  label: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

interface DropdownLabelProps {
  children: React.ReactNode;
  className?: string;
}

// DropdownSection 컴포넌트 - 드롭다운 내부의 섹션을 정의합니다
export const DropdownSection: React.FC<DropdownSectionProps> = ({
  title,
  children,
  className = ''
}) => {
  return (
    <div className={`py-2 last:pb-3 space-y-3 ${className}`}>
      {title && (
        <p className="px-3 text-sm uppercase tracking-wider text-muted-foreground/70">
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

// DropdownLabel 컴포넌트 - 드롭다운 내부의 레이블을 정의합니다
export const DropdownLabel: React.FC<DropdownLabelProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`px-3 py-2 text-sm font-medium text-foreground ${className}`}>
      {children}
    </div>
  );
};

// DropdownItem 컴포넌트 - 드롭다운 내부의 개별 항목을 정의합니다
export const DropdownItem: React.FC<DropdownItemProps> = ({
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

// DropdownSeparator 컴포넌트 - 드롭다운 내부의 구분선을 정의합니다
export const DropdownSeparator: React.FC = () => {
  return <div className="h-px bg-border mx-1 my-2" />;
};