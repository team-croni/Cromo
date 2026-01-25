import React from 'react';

interface ToolbarDropdownItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  onClose?: () => void;
  className?: string;
  horizontal?: boolean;
  iconColor?: string;
  disabled?: boolean;
}

export const ToolbarDropdownItem: React.FC<ToolbarDropdownItemProps> = ({
  icon,
  label,
  isActive = false,
  onClick,
  onClose,
  className = '',
  horizontal,
  disabled = false,
}) => {
  const handleClick = () => {
    if (disabled) return;
    onClick();
    onClose?.();
  };

  return horizontal ? (
    <div
      onClick={handleClick}
      className={`
        ${disabled ? 'opacity-100 cursor-default' : 'cursor-pointer'} rounded-lg p-2 flex gap-3 items-center justify-between text-sm text-nowrap
        ${isActive ? 'transition bg-primary text-primary-foreground' : disabled ? '' : 'hover:bg-foreground/5'}
        ${className}
      `}
    >
      <div className='w-4 h-4 flex items-center justify-center'>
        {icon}
      </div>
    </div>
  ) : (
    <div
      onClick={handleClick}
      className={`
        ${disabled ? 'opacity-100 cursor-default' : 'cursor-pointer'} rounded-lg py-1.5 pl-2.5 pr-3 flex gap-3 items-center justify-between text-sm text-nowrap
        ${isActive ? 'transition bg-primary text-primary-foreground' : disabled ? '' : 'hover:bg-foreground/5'}
        ${className}
      `}
    >
      <div className={`w-4 h-4 flex items-center justify-center ${isActive ? 'text-primary-foreground' : disabled ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}>
        {icon}
      </div>
      <span className={`flex-1 ${isActive ? 'text-primary-foreground' : disabled ? 'text-muted-foreground/50' : 'text-foreground'}`}>{label}</span>
    </div>
  );
};
