import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Ring } from 'ldrs/react';
import { ToolbarButton } from '@components/ui/toolbar-button';

interface ToolbarDropdownProps {
  isActive?: boolean;
  title: string;
  disabled?: boolean;
  titleShow?: boolean;
  textColor?: string;
  triggerIcon: React.ReactNode;
  children: React.ReactNode;
  isLoading?: boolean;
}

export const ToolbarDropdown: React.FC<ToolbarDropdownProps> = ({
  isActive,
  title,
  disabled,
  titleShow,
  textColor = 'foreground',
  triggerIcon,
  children,
  isLoading = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleTriggerClick = () => {
    if (!disabled && !isLoading) {
      setIsOpen(!isOpen);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <ToolbarButton
        isActive={isActive}
        title={title}
        disabled={disabled || isLoading}
        className={`w-auto px-2 justify-between ${isOpen ? 'bg-foreground/5!' : ''}`}
        onClick={handleTriggerClick}
      >
        {isLoading ? (
          <div className='flex justify-center items-center w-4.5 h-4.5 text-primary'>
            <Ring size="18"
              speed="2"
              stroke={2}
              color="currentColor"
              bgOpacity={0.2}
            />
          </div>
        ) : (
          triggerIcon
        )}
        {titleShow && <span className={`ml-2 text-xs text-${textColor}`}>{title}</span>}
        <div className='flex justify-center items-center w-3 h-3 ml-1 -mr-0.5'>
          <ChevronDown size={12} className={`transition-transform duration-75 ${isOpen ? 'text-foreground' : isActive ? 'text-foreground rotate-180' : 'text-muted-foreground rotate-180'}`} />
        </div>
      </ToolbarButton>

      <div
        className={`absolute -left-1.5 -translate-y-full overflow-hidden bg-popover border border-popover-border rounded-xl shadow-lg/15 z-50 p-1 transition-all duration-75 ${isOpen ? '-top-2.5' : '-top-0.5 opacity-0 pointer-events-none'}`}
      >
        {React.isValidElement(children)
          ? React.cloneElement(children, { onClose: handleClose } as any)
          : children}
      </div>
    </div>
  );
};