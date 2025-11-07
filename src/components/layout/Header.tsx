import { useTheme } from "../../lib/ThemeContext";
import { Button } from "../ui/button";
import { Moon, Sun, Menu, Bell } from "lucide-react";
import { Badge } from "../ui/badge";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="header-light dark:header-dark sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border/50 shadow-sm transition-colors duration-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="lg:hidden hover:bg-accent/50 transition-all duration-200"
            >
              <Menu className="size-5" />
            </Button>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#B9972C] shadow-md">
                <svg className="size-6 text-[#222222]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-semibold">LordsMint</h1>
                <p className="text-xs text-muted-foreground">Customer Portal</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="relative hover:bg-accent/50 transition-all duration-200"
            >
              <Bell className="size-5" />
              <Badge className="absolute -top-1 -right-1 size-4 p-0 flex items-center justify-center bg-[#D4AF37] text-[#222222] text-[10px]">
                3
              </Badge>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="rounded-lg border-border/50 hover:bg-accent/50 transition-all duration-200"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
