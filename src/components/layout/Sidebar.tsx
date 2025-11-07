import { cn } from "../ui/utils";
import { 
  LayoutDashboard, 
  Package, 
  CreditCard, 
  FileText, 
  DollarSign, 
  MessageSquare, 
  MessageCircle, 
  Newspaper, 
  Settings,
  X,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "../ui/dropdown-menu";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "../../store/useAuthStore";
import { useTheme } from "../../lib/ThemeContext";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Package, label: "Orders", path: "/orders" },
  { icon: CreditCard, label: "Payments", path: "/payments" },
  { icon: FileText, label: "Invoices", path: "/invoices" },
  { icon: DollarSign, label: "Price List", path: "/price-list" },
  { icon: MessageSquare, label: "Complaints", path: "/complaints" },
  // { icon: MessageCircle, label: "Feedback", path: "/feedback" },
  { icon: Newspaper, label: "News", path: "/news" },
  // { icon: Settings, label: "Settings", path: "/settings" },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuthStore();
  const { theme, toggleTheme } = useTheme();

  const handleAccountSettings = () => {
    navigate('/settings');
    onClose();
  };

  const handleFeedbackSharing = () => {
    navigate('/feedback');
    onClose();
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/');
      onClose();
    }
  };
  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-200"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          "sidebar-light dark:sidebar-dark fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border/50 transition-all duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#B9972C] shadow-md">
                <svg className="size-6 text-[#222222]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <div className="">
                <h1 className="text-lg font-semibold">LordsMintTech</h1>
                <p className="text-xs text-muted-foreground">Customer Portal</p>
              </div>
            </div>

            <Button variant="ghost" size="sm" className="lg:hidden self-end" onClick={onClose}>
              <X className="size-5" />
            </Button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => onClose()}
                  className={cn(
                    "sidebar-link w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-[16px]",
                    isActive
                      ? "sidebar-link-active bg-gradient-to-r from-[#F7E8B0] to-[#F7E8B0]/50 dark:from-[#D4AF37]/20 dark:to-[#D4AF37]/10 text-foreground font-medium border-l-4 border-[#D4AF37]"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <Icon className={cn("size-5", isActive && "text-[#D4AF37]")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          
          {/* User Info with Popover Menu */}
          <div className="p-4 border-t border-border/50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
                  <div className="size-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B9972C] flex items-center justify-center text-[#222222] font-semibold">
                    JD
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-medium truncate">John Doe</p>
                    <p className="text-xs text-muted-foreground truncate">{user}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 p-4" sideOffset={8} align="start">
                <div className="flex items-center pb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">John Doe</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleTheme}
                    className="rounded-lg border-border/50 hover:bg-accent/50 transition-all duration-200"
                  >
                    {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                  </Button>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleAccountSettings} className="text-[15px] my-2 py-2.5 font-medium cursor-pointer focus:bg-color-background focus:text-primary">
                  <Settings className="size-5" /> Account Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleFeedbackSharing} className="text-[15px] my-2 py-2.5 font-medium cursor-pointer focus:bg-color-background focus:text-primary">
                  <MessageCircle className="size-5" /> Share Feedback
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-[15px] py-2.5 font-medium cursor-pointer focus:bg-color-background focus:text-destructive">
                  <LogOut className="size-5" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>
    </>
  );
}
