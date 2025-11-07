import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "./utils";

type SmartBackButtonProps = {
  label?: string;
  className?: string;
  fallbackTo?: string; // Fallback route when history/state is unavailable
  to?: string; // Custom route to navigate to
};

export function SmartBackButton({
  label = "Back",
  className,
  fallbackTo = "/",
  to = "",
}: SmartBackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (to) {
      navigate(to);
      return;
    }
    const from = (location.state as any)?.from as string | undefined;
    if (from) {
      navigate(from);
      return;
    }
    // If we have navigation history or same-origin referrer, go back
    const referrer = document.referrer;
    try {
      const sameOriginRef = referrer && new URL(referrer).origin === window.location.origin;
      if (window.history.length > 2 || sameOriginRef) {
        navigate(-1);
        return;
      }
    } catch {}

    // Otherwise, go to the safe fallback route
    navigate(fallbackTo);
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={cn(
        "flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer",
        className
      )}
      aria-label={label}
    >
      <ArrowLeft className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );
}