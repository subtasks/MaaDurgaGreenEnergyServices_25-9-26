import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Download, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchOrganizations, fetchQuotation } from "@/lib/quotations";
import { computeTotals, formatINR, rowNet } from "@/lib/solar";

export const Route = createFileRoute("/_authenticated/quotation/$id")({
  validateSearch: (search: Record<string, unknown>) => ({
    print: search["print"] === true || search["print"] === "true" || search["print"] === "1",
  }),
  component: ViewQuotation,
});

function ViewQuotation() {
  const { id } = Route.useParams();
  const { print } = Route.useSearch();
  const { data, isLoading } = useQuery({ queryKey: ["quotation", id], queryFn: () => fetchQuotation(id) });
  const { data: orgs = [] } = useQuery({ queryKey: ["organizations"], queryFn: fetchOrganizations });

  useEffect(() => {
    if (!print || !data) return undefined;
    const timer = setTimeout(() => window.print(), 400);
    return () => clearTimeout(timer);
  }, [print, data]);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading quotation…</p>;
  if (!data) return <p className="text-sm text-muted-foreground">Quotation not found.</p>;

  const totals = computeTotals(data.pricing_rows ?? [], data.bom ?? [], data.addons ?? []);
  const org = orgs.find((o) => o.id === data.organization_id);
  const customer = data.customer ?? {};

  return (
    <div className="space-y-4">
      {/* Print-only watermark: fixed behind the bill content, repeats on every printed page */}
      <img
        src="/favicon.ico"
        alt=""
        aria-hidden
        className="print-watermark pointer-events-none fixed inset-0 z-[-1] hidden select-none"
      />
      <div className="print-hide flex flex-wrap gap-2">
        <Button className="rounded-xl bg-info text-info-foreground hover:bg-info/90" onClick={() => window.print()}>
          <Download className="mr-1 h-4 w-4" /> Download PDF
        </Button>
        <Button asChild variant="outline" className="rounded-xl">
          <Link to="/quotation-edit/$id" params={{ id: data.id }}>
            <Pencil className="mr-1 h-4 w-4" /> Edit
          </Link>
        </Button>
        <Button asChild variant="outline" className="rounded-xl">
          <Link to="/quotations">Back to registry</Link>
        </Button>
      </div>

      <Card className="print-area rounded-xl shadow-sm">
        <CardContent className="space-y-5 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
            <div className="flex items-start gap-3">
              <img
                src="/favicon.ico"
                alt="Maa Durga Green Energy Services logo"
                className="logo-img h-16 w-16 rounded-lg object-contain"
              />
              <div>
                <p className="text-lg font-bold">{data.organization_name || org?.name}</p>
                {org && (
                  <p className="text-xs text-muted-foreground">
                    CIN: {org.cin || "—"} | GST: {org.gst || "—"}
                    <br />
                    {org.address}
                    <br />
                    Contact no.:- 9102170050   &nbsp;  &nbsp;  Email :- maadurgagreenenergyservices@gmail.com 
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold">{data.quote_id}</p>
              <p className="text-xs text-muted-foreground">Issue date: {data.issue_date}</p>
              <p className="text-xs text-muted-foreground">Valid until: {data.valid_until || "—"}</p>
            </div>
          </div>

          <div>
            <h1 className="text-base font-semibold">{data.subject}</h1>
            <p className="text-sm text-muted-foreground">
              {Number(data.capacity).toFixed(2)} kW | {data.system_type} | {data.config?.category} |{" "}
              {data.config?.tier} | {data.config?.dcr}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border p-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer</p>
              <p className="mt-1 font-medium">{customer.name}</p>
              <p className="text-muted-foreground">
                {customer.type} {customer.gst ? `| GST: ${customer.gst}` : ""} {customer.cin ? `| CIN: ${customer.cin}` : ""}
              </p>
              <p className="text-muted-foreground">
                {customer.phone} {customer.email ? `| ${customer.email}` : ""}
              </p>
              {customer.caNumber && <p className="text-muted-foreground">CA No: {customer.caNumber}</p>}
            </div>
            <div className="rounded-xl border border-border p-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Addresses</p>
              <p className="mt-1 whitespace-pre-line text-muted-foreground">Billing: {customer.billingAddress}</p>
              <p className="whitespace-pre-line text-muted-foreground">
                Shipping: {customer.shippingSame ? customer.billingAddress : customer.shippingAddress}
              </p>
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold">Pricing</h2>
            <div className="scroll-x">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2">Component</th>
                    <th className="py-2">kW</th>
                    <th className="py-2">Base</th>
                    <th className="py-2">Discount</th>
                    <th className="py-2">GST</th>
                    <th className="py-2 text-right">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.pricing_rows ?? []).map((row) => (
                    <tr key={row.id} className="border-t border-border">
                      <td className="py-2">{row.component}</td>
                      <td className="py-2">{row.capacity}</td>
                      <td className="py-2">{formatINR(row.basePrice)}</td>
                      <td className="py-2">{formatINR(row.discount)}</td>
                      <td className="py-2">{row.gstRate}%</td>
                      <td className="py-2 text-right">{formatINR(rowNet(row))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl bg-navy p-4 text-navy-foreground">
            <dl className="space-y-1.5 text-sm">
              {[
                ["1. Total Solar Components Amount", totals.componentsTotal],
                ["Taxable Amount", totals.taxable],
                ["CGST @ 2.5%", totals.cgst2_5],
                ["SGST @ 2.5%", totals.sgst2_5],
                ["CGST @ 9%", totals.cgst9],
                ["SGST @ 9%", totals.sgst9],
                ["2. Add-ons (BOM + Custom)", totals.addonsTotal],
                ["GST on Add-ons @ 18%", totals.addonsGst],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between gap-4">
                  <dt className="text-navy-muted">{label as string}</dt>
                  <dd>{formatINR(value as number)}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-4 border-t border-navy-muted/30 pt-2">
                <dt className="font-semibold">Final Total</dt>
                <dd className="text-lg font-bold text-success">{formatINR(totals.grandTotal)}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold">Bill of Materials</h2>
            <div className="scroll-x">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2">Sl</th>
                    <th className="py-2">Material</th>
                    <th className="py-2">Specification</th>
                    <th className="py-2">Qty</th>
                    <th className="py-2">Unit</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.bom ?? []).map((item, index) => (
                    <tr key={item.id} className="border-t border-border">
                      <td className="py-2">{index + 1}</td>
                      <td className="py-2">{item.name}</td>
                      <td className="py-2">{item.spec}</td>
                      <td className="py-2">{item.qty}</td>
                      <td className="py-2">{item.unit}</td>
                      <td className="py-2 text-right">{formatINR(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {(data.addons ?? []).length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold">Custom Add-ons</h2>
              <ul className="space-y-1 text-sm">
                {data.addons.map((a) => (
                  <li key={a.id} className="flex justify-between gap-4 border-b border-border py-1">
                    <span>
                      {a.item} <span className="text-muted-foreground">{a.description}</span>
                    </span>
                    <span>{formatINR(a.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.terms && (
            <div>
              <h2 className="mb-1 text-sm font-semibold">Terms &amp; Conditions</h2>
              <p className="whitespace-pre-line text-xs text-muted-foreground">{data.terms}</p>
            </div>
          )}

          {data.notes && (
            <div>
              <h2 className="mb-1 text-sm font-semibold">Additional Notes</h2>
              <p className="whitespace-pre-line text-xs text-muted-foreground">{data.notes}</p>
            </div>
          )}

          {/* {data.show_qr && (
            <div className="flex items-center gap-3 rounded-xl border border-border p-3">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(data.quote_id)}`}
                alt={`Verification QR code for ${data.quote_id}`}
                width={110}
                height={110}
                loading="lazy"
              />
              <div className="text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">Verification</p>
                <p>Scan to verify quotation {data.quote_id}</p>
                <p>Issued on {data.issue_date}</p>
              </div>
            </div>
          )} */}

          {data.show_qr && (
            <div className="w-full rounded-xl border border-border p-3 flex items-center justify-center">
              <img
                src="/company-banner.jpeg"
                alt="Company Banner"
                className="w-full object-contain"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
