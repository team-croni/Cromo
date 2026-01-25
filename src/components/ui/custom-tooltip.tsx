import { useEffect } from "react";

interface CustomTooltipProps {
  children: React.ReactNode;
  message: string;
  show?: boolean;
  onHide?: () => void;
  position?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  delay?: number;
  hover?: boolean;
  variant?: "default" | "warning" | "error";
}

const CustomTooltip = ({
  children,
  message,
  show = false,
  onHide,
  position = "bottom",
  align = "end",
  delay = 5000,
  hover = false,
  variant = "default"
}: CustomTooltipProps) => {
  useEffect(() => {
    if (show && onHide) {
      const timer = setTimeout(() => {
        onHide();
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [show, onHide, delay]);

  const positionClasses = {
    top: "bottom-full mb-2",
    bottom: "top-full mt-2",
    left: "right-full mr-2",
    right: "left-full ml-2"
  };

  const alignClasses = {
    start: position === "top" || position === "bottom" ? "left-0" : "top-0",
    center: position === "top" || position === "bottom" ? "left-1/2 transform -translate-x-1/2" : "top-1/2 transform -translate-y-1/2",
    end: position === "top" || position === "bottom" ? "right-0" : "bottom-0"
  };

  const initialTransform = {
    top: "translate-y-1",
    bottom: "-translate-y-1",
    left: "translate-x-1",
    right: "-translate-x-1"
  };

  const variantClasses = {
    default: "bg-inverse/50 backdrop-blur-xl text-foreground",
    warning: "bg-secondary/20 backdrop-blur-xl text-foreground",
    error: "bg-destructive/20 backdrop-blur-xl text-foreground"
  };

  const opacityClass = show ? "opacity-100" : hover ? "opacity-0 group-hover:opacity-100" : "opacity-0";
  const transformClass = show ? "translate-x-0 translate-y-0" : hover ? `${initialTransform[position]} group-hover:translate-x-0 group-hover:translate-y-0` : initialTransform[position];

  return (
    <div className="relative group">
      {children}
      <div className={`absolute ${positionClasses[position]} ${alignClasses[align]} ${variantClasses[variant]} text-xs px-2.5 py-1.5 rounded whitespace-nowrap transition-all duration-100 pointer-events-none z-100 ${opacityClass} ${transformClass}`}>
        {message}
      </div>
    </div>
  );
};

export default CustomTooltip;