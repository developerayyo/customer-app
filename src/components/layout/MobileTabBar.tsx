import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from "../ui/utils";
import { LayoutDashboard, Package, CreditCard, Menu } from "lucide-react";

interface MobileTabBarProps {
  onMenuClick: () => void;
}

const tabs = [
  { icon: LayoutDashboard, label: "Home", path: "/" },
  { icon: Package, label: "Orders", path: "/orders" },
  { icon: CreditCard, label: "Payments", path: "/payments" },
  { icon: Menu, label: "More", path: "menu" },
];

export function MobileTabBar({ onMenuClick }: MobileTabBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  const navigateTo = (path: string) => {
    if (path === "menu") return onMenuClick();
    if (path === pathname) return;
    navigate(path);
  };

  return (
    <nav className="tabbar lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border/50 shadow-lg">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isMenu = tab.path === "menu";
          // Consider child routes active for their parent tabs
          const matchesTab = !isMenu && (pathname === tab.path || pathname.startsWith(`${tab.path}/`));
          const isKnownTabPath = tabs
            .filter(t => t.path !== "menu")
            .some(t => pathname === t.path || pathname.startsWith(`${t.path}/`));
          const isActive = isMenu ? !isKnownTabPath : matchesTab;
          
          return (
            <button
              key={tab.path}
              onClick={() => navigateTo(tab.path)}
              className={cn(
                "tabbar-item flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 min-w-0 flex-1",
                isActive ? "tabbar-item-active text-[#D4AF37]" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("size-5", isActive && "scale-110")} />
              <span className="text-xs font-medium truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
