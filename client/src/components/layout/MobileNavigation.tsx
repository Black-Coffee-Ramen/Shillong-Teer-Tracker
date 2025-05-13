import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, Play, Trophy, User } from "lucide-react";

export default function MobileNavigation() {
  const [location] = useLocation();
  
  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/play", icon: Play, label: "Play" },
    { path: "/results", icon: Trophy, label: "Results" },
    { path: "/profile", icon: User, label: "Profile" }
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-sm md:hidden">
      <div className="flex justify-around items-center">
        {navItems.map(item => {
          const IconComponent = item.icon;
          const isActive = location === item.path;
          
          return (
            <Link key={item.path} href={item.path}>
              <div className={cn(
                "flex flex-col items-center p-2 cursor-pointer transition-colors duration-200",
                isActive
                  ? "text-primary" 
                  : "text-gray-500 hover:text-gray-900"
              )}>
                <IconComponent className="w-5 h-5" />
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
