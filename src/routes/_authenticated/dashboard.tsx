import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, FileText, IndianRupee, CalendarDays, PlusCircle, KeyRound, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchOrganizations, fetchQuotations } from "@/lib/quotations";
import { formatINR } from "@/lib/solar";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { fullName, isAdmin } = useSession();
  const { data: quotations = [] } = useQuery({ queryKey: ["quotations"], queryFn: () => fetchQuotations() });
  const { data: orgs = [] } = useQuery({ queryKey: ["organizations"], queryFn: fetchOrganizations });

  const now = new Date();
  const thisMonth = quotations.filter((q) => {
    const d = new Date(q.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const totalValue = quotations.reduce((sum, q) => sum + Number(q.total || 0), 0);

  const metrics = [
    { label: "Total Quotations", value: String(quotations.length), icon: FileText },
    { label: "This Month", value: String(thisMonth), icon: CalendarDays },
    { label: "Total Quote Value", value: formatINR(totalValue), icon: IndianRupee },
    { label: "Organizations", value: String(orgs.length), icon: Building2 },
  ];

  return (
    <div className="space-y-4">
      <Card className="rounded-xl border-border shadow-sm">
        <CardContent className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Dashboard</p>
          <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
            Welcome back, {fullName || "there"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAdmin ? "Admin access — all organizations and every quotation" : "Access scope: your own quotations"}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label} className="rounded-xl shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{m.label}</span>
                <m.icon className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-2 text-xl font-bold tracking-tight break-words">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="rounded-xl sm:flex-1">
            <Link to="/quotation-new">
              <PlusCircle className="mr-1 h-4 w-4" /> Create Solar Quote
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl sm:flex-1">
            <Link to="/quotations">
              <ListChecks className="mr-1 h-4 w-4" /> View Quotations
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl sm:flex-1">
            <Link to="/change-password">
              <KeyRound className="mr-1 h-4 w-4" /> Change Password
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Organizations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {orgs.map((o) => (
            <div key={o.id} className="rounded-xl border border-border p-3">
              <p className="text-sm font-semibold">{o.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                CIN: {o.cin || "—"} | GST: {o.gst || "—"}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Recent Quotations</CardTitle>
          <Link to="/quotations" className="text-sm font-medium text-primary">
            View All
          </Link>
        </CardHeader>
        <CardContent className="max-h-96 space-y-2 overflow-y-auto">
          {quotations.length === 0 && (
            <p className="text-sm text-muted-foreground">No quotations yet. Create your first solar quote.</p>
          )}
          {quotations.slice(0, 8).map((q) => (
            <Link
              key={q.id}
              to="/quotation/$id"
              params={{ id: q.id }}
              search={{ print: false }}
              className="block rounded-xl border border-border p-3 transition-colors hover:bg-accent"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{q.quote_id}</p>
                  <p className="text-sm">{q.customer?.name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{q.issue_date}</p>
                </div>
                <p className="text-sm font-semibold text-success">{formatINR(Number(q.total))}</p>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
