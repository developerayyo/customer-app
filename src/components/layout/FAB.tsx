import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../ui/utils";

interface FABProps {
  onClick: () => void;
  label?: string;
  className?: string;
  icon?: ReactNode;
}

export function FAB({ onClick, label = "Create", className, icon }: FABProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fab fixed bottom-24 right-6 lg:bottom-8 lg:right-8 z-40",
        "size-16 rounded-full shadow-2xl",
        "bg-gradient-to-br from-[#D4AF37] to-[#B9972C]",
        "hover:from-[#B9972C] hover:to-[#D4AF37]",
        "hover:shadow-[0_12px_26px_rgba(212,175,55,0.38)]",
        "transition-all duration-300 hover:scale-110",
        "flex items-center justify-center",
        "text-[#222222] dark:text-[#121212]",
        "group cursor-pointer",
        className
      )}
      aria-label={label}
    >
      {icon ?? (
        <Plus className="size-8 group-hover:rotate-90 transition-transform duration-300" />
      )}
    </button>
  );
}
