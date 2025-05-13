import { ReactNode } from "react";
import Header from "./Header";
import MobileNavigation from "./MobileNavigation";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <Header />
      <main className="pt-16 pb-20 px-4 max-w-4xl mx-auto">
        {children}
      </main>
      <MobileNavigation />
    </div>
  );
}
