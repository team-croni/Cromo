import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
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

  // Calculate position for the dropdown to appear above the trigger
  const calculatePosition = () => {
    if (!triggerRef.current) return { top: 0, left: 0 };

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    // Position dropdown above the trigger button
    return {
      top: triggerRect.top + scrollTop - (dropdownRef.current?.offsetHeight || 0) - 12,
      left: triggerRect.left + scrollLeft
    };
  };

  const dropdownElement = (
    <div
      ref={dropdownRef}
      className={`fixed bg-popover border border-popover-border rounded-xl shadow-lg/15 z-50 p-1.5 transition-all duration-75 ${isOpen ? '' : 'opacity-0 translate-y-2.5 pointer-events-none'}`}
      style={calculatePosition()}
    >
      {React.isValidElement(children)
        ? React.cloneElement(children, { onClose: handleClose } as any)
        : children}
    </div>
  );

  return (
    <div className="shrink-0 relative" ref={triggerRef}>
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
        {titleShow && <span className={`ml-2 text-xs hidden md:inline text-${textColor}`}>{title}</span>}
        <div className='flex justify-center items-center w-2.5 h-2.5 ml-1 -mr-0.5'>
          <ChevronDown size={10} className={`transition-transform duration-75 ${isOpen ? 'text-foreground' : isActive ? 'text-foreground rotate-180' : 'text-muted-foreground rotate-180'}`} />
        </div>
      </ToolbarButton>

      {/* Render dropdown using Portal */}
      {mounted && typeof document !== 'undefined' && createPortal(dropdownElement, document.body)}
    </div>
  );
};