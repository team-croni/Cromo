"use client";

import { ButtonHTMLAttributes } from "react";

type ToolbarButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isActive?: boolean;
  label?: string;
};

export const ToolbarButton = ({
  isActive = false,
  children,
  className = "",
  label,
  ...props
}: ToolbarButtonProps) => {
  return (
    <button
      className={`flex items-center justify-center rounded ${label ? 'px-3 h-8' : 'w-8 h-8'} ${isActive
        ? "bg-primary! text-primary-foreground"
        : "hover:bg-foreground/5"
        } ${className}`}
      {...props}
    >
      {children}
      {label && <span className="ml-2 text-sm">{label}</span>}
    </button>
  );
};