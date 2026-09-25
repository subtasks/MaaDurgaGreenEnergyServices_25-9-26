import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, ArchiveRestore, Download, Eye, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { fetchQuotations, setArchived } from "@/lib/quotations";
import { formatINR } from "@/lib/solar";

export const Route = createFileRoute("/_authenticated/quotations")({
  component: Registry,
});

function Registry() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ["quotations", showArchived],
    queryFn: () => fetchQuotations({ includeArchived: showArchived }),
  });

  const archive = useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) => setArchived(id, archived),
    onSuccess: (_data, variables) => {
      toast.success(variables.archived ? "Quotation archived" : "Quotation restored");
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const term = search.trim().toLowerCase();
  const list = quotations.filter(
    (q) =>
      !term ||
      q.quote_id.toLowerCase().includes(term) ||
      (q.customer?.name ?? "").toLowerCase().includes(term) ||
      (q.organization_name ?? "").toLowerCase().includes(term),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-bold tracking-tight">Quotation Registry</h1>
        <Badge variant="secondary" className="rounded-lg">
          {quotations.length} TOTAL
        </Badge>
        <Button asChild className="ml-auto rounded-xl">
          <Link to="/quotation-new">
            <Plus className="mr-1 h-4 w-4" /> New Quotation
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          className="max-w-xs rounded-xl"
          placeholder="Search quote ID, customer, organization"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button variant="outline" className="rounded-xl" onClick={() => setShowArchived((v) => !v)}>
          {showArchived ? "Hide archived" : "Show archived"}
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading quotations…</p>}
      {!isLoading && list.length === 0 && (
        <p className="text-sm text-muted-foreground">No quotations found.</p>
      )}

      <div className="space-y-3">
        {list.map((q) => (
          <Card key={q.id} className="rounded-xl shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold">{q.quote_id}</p>
                  <p className="text-sm font-medium">{q.customer?.name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{q.organization_name || "—"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-success">{formatINR(Number(q.total))}</p>
                  <p className="text-xs text-muted-foreground">{q.issue_date}</p>
                </div>
              </div>
              <p className="mt-2 text-sm">{q.subject}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-lg">
                  {Number(q.capacity).toFixed(2)} kW | {q.system_type}
                </Badge>
                {q.archived && (
                  <Badge variant="secondary" className="rounded-lg">
                    Archived
                  </Badge>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
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
                  className="rounded-xl bg-info text-info-foreground hover:bg-info/90"
                  onClick={() => navigate({ to: "/quotation/$id", params: { id: q.id }, search: { print: true } })}
                >
                  <Download className="mr-1 h-4 w-4" /> Download PDF
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20"
                  onClick={() => archive.mutate({ id: q.id, archived: !q.archived })}
                >
                  {q.archived ? (
                    <>
                      <ArchiveRestore className="mr-1 h-4 w-4" /> Restore
                    </>
                  ) : (
                    <>
                      <Archive className="mr-1 h-4 w-4" /> Archive
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
