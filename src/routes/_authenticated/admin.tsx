import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, ArchiveRestore, Eye, Pencil, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { fetchQuotations, setArchived } from "@/lib/quotations";
import { formatINR } from "@/lib/solar";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPanel,
});

function AdminPanel() {
  const { isAdmin, loading } = useSession();
  const queryClient = useQueryClient();

  const { data: quotations = [] } = useQuery({
    queryKey: ["quotations", "admin"],
    queryFn: () => fetchQuotations({ includeArchived: true }),
    enabled: isAdmin,
  });

  const archive = useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) => setArchived(id, archived),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quotations"] }),
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quotations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Quotation deleted");
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (loading) return <p className="text-sm text-muted-foreground">Checking access…</p>;
  if (!isAdmin)
    return (
      <Card className="rounded-xl shadow-sm">
        <CardContent className="p-6 text-sm text-muted-foreground">
          This area is for administrators only. Ask an admin to grant you access.
        </CardContent>
      </Card>
    );

  const totalValue = quotations.reduce((sum, q) => sum + Number(q.total || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold tracking-tight">Admin Panel</h1>
        <Badge variant="secondary" className="ml-auto rounded-lg">
          {quotations.length} quotations
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="rounded-xl shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">All quotations value</p>
            <p className="mt-1 text-lg font-bold">{formatINR(totalValue)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Archived</p>
            <p className="mt-1 text-lg font-bold">{quotations.filter((q) => q.archived).length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Every quotation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {quotations.map((q) => (
            <div key={q.id} className="rounded-xl border border-border p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold">{q.quote_id}</p>
                  <p className="text-sm">{q.customer?.name || "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    {q.organization_name || "—"} · {q.issue_date} · {Number(q.capacity).toFixed(2)} kW {q.system_type}
                  </p>
                </div>
                <p className="text-sm font-semibold text-success">{formatINR(Number(q.total))}</p>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline" className="rounded-xl">
                  <Link to="/quotation/$id" params={{ id: q.id }} search={{ print: false }}>
                    <Eye className="mr-1 h-4 w-4" /> View
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="rounded-xl">
                  <Link to="/quotation-edit/$id" params={{ id: q.id }}>
                    <Pencil className="mr-1 h-4 w-4" /> Edit
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => archive.mutate({ id: q.id, archived: !q.archived })}
                >
                  {q.archived ? <ArchiveRestore className="mr-1 h-4 w-4" /> : <Archive className="mr-1 h-4 w-4" />}
                  {q.archived ? "Restore" : "Archive"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20"
                  onClick={() => remove.mutate(q.id)}
                >
                  <Trash2 className="mr-1 h-4 w-4" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
