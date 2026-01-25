import { DropdownSeparator } from '@components/ui/formatted-dropdown-content';
import React, { useState, useRef, useEffect } from 'react';

interface CustomDropdownProps {
  Trigger: any;
  children: React.ReactNode;
  title?: string | React.ReactNode;
  actionButtons?: React.ReactNode | ((onClose: () => void) => React.ReactNode);
  align?: 'left' | 'right';
  className?: string;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  setOpen?: (open: boolean) => void;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  Trigger,
  children,
  title,
  actionButtons,
  align = 'left',
  className = '',
  onOpenChange,
  open,
  setOpen
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부에서 제어하는 경우 외부 state를 사용하고, 그렇지 않으면 내부 state 사용
  const isOpen = open !== undefined ? open : internalIsOpen;
  const setIsOpenInternal = setOpen || setInternalIsOpen;

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpenInternal(false);
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
    setIsOpenInternal(!isOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={handleTriggerClick} className="cursor-pointer">
        <Trigger isOpen={isOpen} />
      </button>
      {isOpen &&
        <div
          className="fixed inset-0 flex items-center justify-center z-100"
          onClick={() => setIsOpenInternal(false)}
        />
      }
      {isOpen && (
        <div
          className={`absolute overflow-hidden mt-2 min-w-40 bg-background border rounded-2xl shadow-xl/20 z-100 px-2 py-2.5 ${align === 'right' ? 'right-0' : 'left-0'} ${className}`}
        >
          {title && (
            <>
              <div className="flex items-center justify-between px-3 py-2">
                {typeof title === 'string' ? (
                  <p className='font-bold text-foreground text-sm'>{title}</p>
                ) : (
                  title
                )}
                {actionButtons && (
                  <div className="flex items-center gap-1">
                    {typeof actionButtons === 'function' ? (
                      actionButtons(() => setIsOpenInternal(false))
                    ) : (
                      actionButtons
                    )}
                  </div>
                )}
              </div>
              <DropdownSeparator />
            </>
          )}
          {children}
        </div>
      )}
    </div>
  );
};