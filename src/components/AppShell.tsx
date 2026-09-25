import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, LayoutDashboard, FileText, PlusCircle, KeyRound, ShieldCheck, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/quotations", label: "Quotations", icon: FileText },
  { to: "/quotation-new", label: "Create Solar Quote", icon: PlusCircle },
  { to: "/change-password", label: "Change Password", icon: KeyRound },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin, fullName } = useSession();

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="print-hide sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold tracking-tight text-primary-foreground">
              SQ
            </span>
            <span className="text-base font-bold tracking-tight sm:text-lg">Quotation Manager</span>
          </Link>
          <div className="ml-auto">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-xl" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle className="text-left">{fullName || "Menu"}</SheetTitle>
                </SheetHeader>
                <nav className="mt-4 flex flex-col gap-1 px-2">
                  {navItems.map((item) => (
                    <SheetClose asChild key={item.to}>
                      <Link
                        to={item.to}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
                        activeProps={{ className: "bg-accent text-accent-foreground" }}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </SheetClose>
                  ))}
                  {isAdmin && (
                    <SheetClose asChild>
                      <Link
                        to="/admin"
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Admin Panel
                      </Link>
                    </SheetClose>
                  )}
                  <button
                    onClick={signOut}
                    className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-accent"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5">{children}</main>

      <footer className="print-hide border-t border-border bg-card">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 text-xs text-muted-foreground">
          <span>Maa Durga Green Energy Services</span>
          <span>v1.2.0</span>
        </div>
      </footer>
    </div>
  );
}
