"use client";

import { ButtonHTMLAttributes } from "react";

type MemoActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: React.ReactNode;
  variant?: "default" | "destructive";
};

export const MemoActionButton = ({
  icon,
  children,
  className = "",
  variant = "default",
  ...props
}: MemoActionButtonProps) => {
  const baseClasses = "flex items-center border border-popover-border rounded-full px-4 py-2.5 text-sm hover:bg-foreground/3 hover:border-foreground/30";
  const variantClasses =
    variant === "destructive"
      ? "text-destructive/80 hover:text-destructive"
      : "text-muted-foreground hover:text-foreground";

  const combinedClasses = `${baseClasses} ${variantClasses} ${className}`;

  return (
    <button
      className={combinedClasses}
      {...props}
    >
      {icon && <span className="mr-1.5">{icon}</span>}
      {children}
    </button>
  );
};