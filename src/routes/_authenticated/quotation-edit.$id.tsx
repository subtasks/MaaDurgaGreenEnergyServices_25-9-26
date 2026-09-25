import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { QuotationForm } from "@/components/QuotationForm";
import { fetchQuotation } from "@/lib/quotations";

export const Route = createFileRoute("/_authenticated/quotation-edit/$id")({
  component: EditQuotation,
});

function EditQuotation() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({ queryKey: ["quotation", id], queryFn: () => fetchQuotation(id) });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading quotation…</p>;
  if (!data) return <p className="text-sm text-muted-foreground">Quotation not found.</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold tracking-tight">Edit {data.quote_id}</h1>
      <QuotationForm initial={data} />
    </div>
  );
}
