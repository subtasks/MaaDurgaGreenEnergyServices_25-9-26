import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, Calculator, FileText, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/solar-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Maa Durga Green Energy Services — Solar Quotes, BOM & PDF Proposals" },
      {
        name: "description",
        content:
          "B2B solar quotation software with live GST pricing, bill of materials and instant PDF proposals for on grid, off grid and hybrid plants.",
      },
      { property: "og:title", content: "Maa Durga Green Energy Services" },
      {
        property: "og:description",
        content: "Create solar quotations with dynamic pricing, BOM management and PDF proposals.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-6xl items-center px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
              SQ
            </span>
            <span className="text-base font-bold tracking-tight sm:text-lg">Quotation Manager</span>
          </div>
          <Button asChild size="sm" className="ml-auto rounded-xl">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="relative overflow-hidden rounded-xl border border-border shadow-sm">
          <img
            src={heroImage}
            alt="Rows of solar photovoltaic panels at sunrise"
            width={1920}
            height={720}
            className="h-64 w-full object-cover sm:h-80"
          />
          <div className="absolute inset-0 flex flex-col justify-center gap-3 bg-navy/70 px-6 sm:px-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-navy-muted">Maa Durga Green Energy Services</p>
            <h1 className="max-w-xl text-2xl font-bold leading-tight text-navy-foreground sm:text-4xl">
              Quote solar faster. Powering every proposal with precise numbers.
            </h1>
            <p className="max-w-lg text-sm text-navy-muted sm:text-base">
              Dynamic pricing, GST-ready totals, bill of materials and print-perfect PDF proposals — all in one
              mobile-friendly workspace.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button asChild className="rounded-xl bg-success text-success-foreground hover:bg-success/90">
                <Link to="/auth">
                  Get started <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Calculator, title: "Live pricing & GST", body: "CGST/SGST split calculated as you edit every row." },
            { icon: ListChecks, title: "BOM management", body: "Pre-filled materials based on capacity and system type." },
            { icon: FileText, title: "PDF proposals", body: "Clean, shareable proposals with optional QR verification." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <f.icon className="h-5 w-5 text-primary" />
              <h2 className="mt-3 text-base font-semibold">{f.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 text-xs text-muted-foreground">
          <span>Maa Durga Green Energy Services</span>
          <span>v1.2.0</span>
        </div>
      </footer>
    </div>
  );
}
