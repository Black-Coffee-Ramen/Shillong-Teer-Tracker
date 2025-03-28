import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export default function MobileNavigation() {
  const [location] = useLocation();
  
  const navItems = [
    { path: "/", icon: "ri-home-4-line", label: "Home" },
    { path: "/play", icon: "ri-gamepad-line", label: "Play" },
    { path: "/results", icon: "ri-trophy-line", label: "Results" },
    { path: "/profile", icon: "ri-user-3-line", label: "Profile" }
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-secondary shadow-[0_-2px_10px_rgba(0,0,0,0.2)]">
      <div className="flex justify-around items-center py-2">
        {navItems.map(item => (
          <Link key={item.path} href={item.path}>
            <a className={cn(
              "flex flex-col items-center p-2 w-1/4",
              location === item.path 
                ? "text-white" 
                : "text-gray-500 hover:text-gray-300"
            )}>
              <i className={`${item.icon} text-xl`}></i>
              <span className="text-xs mt-1">{item.label}</span>
            </a>
          </Link>
        ))}
      </div>
    </nav>
  );
}
