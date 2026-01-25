import { ReactNode } from "react";

type ShortcutHintProps = {
  keys: string[];
  children?: ReactNode;
  className?: string;
};

export const ShortcutHint = ({ keys, children, className = "" }: ShortcutHintProps) => {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {children && <span className="text-xs text-muted-foreground mr-1">{children}:</span>}
      <div className="flex items-center gap-1">
        {keys.map((key, index) => (
          <span
            key={index}
            className="px-1.25 py-0.25 text-[0.625rem] bg-inverse/50 border rounded-sm font-mono text-muted-foreground"
          >
            {key}
          </span>
        ))}
      </div>
    </div>
  );
};