import { ReactNode } from "react";
import Header from "./Header";
import MobileNavigation from "./MobileNavigation";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-primary text-white font-inter">
      <Header />
      <main className="pt-16 pb-20">
        {children}
      </main>
      <MobileNavigation />
    </div>
  );
}
