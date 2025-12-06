import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MobileLayoutProps {
  children: ReactNode;
  className?: string;
  showBottomNav?: boolean;
}

export function MobileLayout({ children, className, showBottomNav = false }: MobileLayoutProps) {
  return (
    <div className={cn(
      "min-h-screen bg-background flex flex-col",
      showBottomNav && "pb-[70px]"
    )}>
      <main className={cn(
        "flex-1 w-full max-w-[428px] mx-auto px-4",
        className
      )}>
        {children}
      </main>
    </div>
  );
}
