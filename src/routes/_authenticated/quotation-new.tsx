import { createFileRoute } from "@tanstack/react-router";
import { QuotationForm } from "@/components/QuotationForm";

export const Route = createFileRoute("/_authenticated/quotation-new")({
  component: NewQuotation,
});

function NewQuotation() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold tracking-tight">Create Solar Quotation</h1>
      <QuotationForm />
    </div>
  );
}
