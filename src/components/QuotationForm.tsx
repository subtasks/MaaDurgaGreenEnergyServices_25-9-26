import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { fail } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { fetchOrganizations, type QuotationRow } from "@/lib/quotations";
import {
  DEFAULT_TERMS,
  MATERIAL_TYPES,
  addDaysISO,
  computeTotals,
  defaultBom,
  defaultPricingRows,
  formatINR,
  generateQuoteId,
  maxValidUntilISO,
  rowNet,
  todayISO,
  uid,
  type AddonItem,
  type BomItem,
  type Customer,
  type PricingRow,
  type SolarConfig,
} from "@/lib/solar";

const emptyCustomer: Customer = {
  type: "Individual",
  cin: "",
  gst: "",
  name: "",
  phone: "",
  caNumber: "",
  email: "",
  billingAddress: "",
  shippingSame: true,
  shippingAddress: "",
};

const emptyConfig: SolarConfig = {
  category: "Residential",
  systemType: "On Grid",
  tier: "Standard",
  dcr: "DCR",
  capacity: 3,
  moduleMake: "Waaree",
  inverterMake: "Luminous",
};

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function QuotationForm({
  initial,
}: {
  initial?: QuotationRow;
}) {
  const navigate = useNavigate();

  const { data: orgs = [] } = useQuery({
    queryKey: ["organizations"],
    queryFn: fetchOrganizations,
  });

  const [orgId, setOrgId] = useState(
    initial?.organization_id ?? ""
  );

  const [issueDate, setIssueDate] = useState(
    initial?.issue_date ?? todayISO()
  );

  const [validUntil, setValidUntil] = useState(
    initial?.valid_until ?? addDaysISO(30)
  );

  const [subject, setSubject] = useState(
    initial?.subject ?? "Quotation for On Grid Solar System"
  );

  const [customer, setCustomer] = useState<Customer>({
    ...emptyCustomer,
    ...(initial?.customer ?? {}),
  });

  const [config, setConfig] = useState<SolarConfig>({
    ...emptyConfig,
    ...(initial?.config ?? {}),
  });

  const [rows, setRows] = useState<PricingRow[]>(
    initial?.pricing_rows ??
      defaultPricingRows(emptyConfig.capacity)
  );

  const [bom, setBom] = useState<BomItem[]>(
    initial?.bom ?? defaultBom(emptyConfig)
  );

  const [addons, setAddons] = useState<AddonItem[]>(
    initial?.addons ?? []
  );

  const [newMaterial, setNewMaterial] = useState<string>(
    MATERIAL_TYPES[0] ?? "Solar module"
  );

  const [showQr, setShowQr] = useState(
    initial?.show_qr ?? true
  );

  const [terms, setTerms] = useState(
    initial?.terms ?? DEFAULT_TERMS
  );

  const [notes, setNotes] = useState(
    initial?.notes ?? ""
  );

  const [busy, setBusy] = useState(false);

  const totals = useMemo(
    () => computeTotals(rows, bom, addons),
    [rows, bom, addons]
  );

  const updateConfig = <
    K extends keyof SolarConfig
  >(
    key: K,
    value: SolarConfig[K]
  ) => {
    setConfig((c) => ({
      ...c,
      [key]: value,
    }));
  };

  const refreshBom = () => {
    setBom(defaultBom(config));

    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        capacity: config.capacity,
      }))
    );

    setSubject(
      `Quotation for ${config.systemType} Solar System`
    );

    toast.success(
      "BOM and pricing refreshed for this configuration"
    );
  };

  const setIssue = (value: string) => {
    setIssueDate(value);
    setValidUntil(
      addDaysISO(30, new Date(value))
    );
  };

  const save = async () => {
    if (!customer.name.trim()) {
      return fail("Customer name is required");
    }

    if (!orgId) {
      return fail("Please select an organization");
    }

    setBusy(true);

    const { data: userData } =
      await supabase.auth.getUser();

    const userId = userData.user?.id;

    if (!userId) {
      setBusy(false);
      return fail(
        "Session expired, please sign in again"
      );
    }

    const payload = {
      user_id: userId,
      organization_id: orgId,
      organization_name:
        orgs.find((o) => o.id === orgId)?.name ?? null,

      issue_date: issueDate,
      valid_until: validUntil,

      subject,

      customer: {
        ...customer,
        shippingAddress: customer.shippingSame
          ? customer.billingAddress
          : customer.shippingAddress,
      },

      config,
      pricing_rows: rows,
      bom,
      addons,

      show_qr: showQr,

      terms,
      notes,

      capacity: Number(config.capacity) || 0,
      system_type: config.systemType,

      total: Number(
        totals.grandTotal.toFixed(2)
      ),
    };

    if (initial) {
      const { error } = await supabase
        .from("quotations")
        .update(payload)
        .eq("id", initial.id);

      setBusy(false);

      if (error) {
        return fail(error.message);
      }

      toast.success("Quotation updated");

      navigate({
        to: "/quotation/$id",
        params: {
          id: initial.id,
        },
        search: {
          print: false,
        },
      });

      return;
    }

    const { data, error } = await supabase
      .from("quotations")
      .insert({
        ...payload,
        quote_id: generateQuoteId(
          new Date(issueDate)
        ),
      })
      .select("id")
      .single();

    setBusy(false);

    if (error) {
      return fail(error.message);
    }

    toast.success("Quotation created");

    navigate({
      to: "/quotation/$id",
      params: {
        id: data.id,
      },
      search: {
        print: false,
      },
    });
  };

  return (
    <div className="space-y-4">

      {/* =========================================================
          QUOTATION PROFILE
          ========================================================= */}

      <Section title="Quotation Profile">
        <div className="grid gap-3 sm:grid-cols-2">

          <Field label="Organization">
            <Select
              value={orgId}
              onValueChange={setOrgId}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>

              <SelectContent>
                {orgs.map((o) => (
                  <SelectItem
                    key={o.id}
                    value={o.id}
                  >
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Quotation Subject">
            <Input
              className="rounded-xl"
              value={subject}
              onChange={(e) =>
                setSubject(e.target.value)
              }
            />
          </Field>

          <Field label="Issue Date">
            <Input
              type="date"
              className="rounded-xl"
              value={issueDate}
              onChange={(e) =>
                setIssue(e.target.value)
              }
            />
          </Field>

          <Field label="Valid Until (max 3 months)">
            <Input
              type="date"
              className="rounded-xl"
              value={validUntil}
              min={issueDate}
              max={maxValidUntilISO(issueDate)}
              onChange={(e) =>
                setValidUntil(e.target.value)
              }
            />
          </Field>

        </div>
      </Section>

      {/* =========================================================
          CUSTOMER PROFILE
          ========================================================= */}

      <Section title="Customer Profile">

        <div className="grid gap-3 sm:grid-cols-2">

          <Field label="Customer Type">
            <Select
              value={customer.type}
              onValueChange={(v) =>
                setCustomer({
                  ...customer,
                  type:
                    v as Customer["type"],
                })
              }
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="Individual">
                  Individual
                </SelectItem>

                <SelectItem value="Organization">
                  Organization
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Customer Name">
            <Input
              className="rounded-xl"
              value={customer.name}
              onChange={(e) =>
                setCustomer({
                  ...customer,
                  name: e.target.value,
                })
              }
            />
          </Field>

          <Field label="Customer CIN (optional)">
            <Input
              className="rounded-xl"
              value={customer.cin ?? ""}
              onChange={(e) =>
                setCustomer({
                  ...customer,
                  cin: e.target.value,
                })
              }
            />
          </Field>

          <Field label="Customer GST (optional)">
            <Input
              className="rounded-xl"
              value={customer.gst ?? ""}
              onChange={(e) =>
                setCustomer({
                  ...customer,
                  gst: e.target.value,
                })
              }
            />
          </Field>

          <Field label="Contact Number">
            <Input
              className="rounded-xl"
              value={customer.phone}
              onChange={(e) =>
                setCustomer({
                  ...customer,
                  phone: e.target.value,
                })
              }
            />
          </Field>

          <Field label="Customer Email">
            <Input
              type="email"
              className="rounded-xl"
              value={customer.email}
              onChange={(e) =>
                setCustomer({
                  ...customer,
                  email: e.target.value,
                })
              }
            />
          </Field>

          <Field label="CA Number (optional)">
            <Input
              className="rounded-xl"
              value={customer.caNumber ?? ""}
              onChange={(e) =>
                setCustomer({
                  ...customer,
                  caNumber: e.target.value,
                })
              }
            />
          </Field>

        </div>

        <Field label="Billing Address">
          <Textarea
            className="rounded-xl"
            rows={3}
            value={customer.billingAddress}
            onChange={(e) =>
              setCustomer({
                ...customer,
                billingAddress:
                  e.target.value,
              })
            }
          />
        </Field>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={customer.shippingSame}
            onCheckedChange={(v) =>
              setCustomer({
                ...customer,
                shippingSame: Boolean(v),
              })
            }
          />
          Shipping same as billing
        </label>

        {!customer.shippingSame && (
          <Field label="Shipping Address">
            <Textarea
              className="rounded-xl"
              rows={3}
              value={
                customer.shippingAddress
              }
              onChange={(e) =>
                setCustomer({
                  ...customer,
                  shippingAddress:
                    e.target.value,
                })
              }
            />
          </Field>
        )}

      </Section>

      {/* =========================================================
          SOLAR CONFIGURATION
          ========================================================= */}

      <Section
        title="Solar Configuration"
        action={
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={refreshBom}
          >
            <RefreshCw className="mr-1 h-4 w-4" />
            Refresh BOM &amp; Pricing
          </Button>
        }
      >

        <div className="grid gap-3 sm:grid-cols-2">

          <Field label="Category / Purpose">
            <Select
              value={config.category}
              onValueChange={(v) =>
                updateConfig(
                  "category",
                  v as SolarConfig["category"]
                )
              }
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {[
                  "Commercial",
                  "Residential",
                  "Industrial",
                ].map((v) => (
                  <SelectItem
                    key={v}
                    value={v}
                  >
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="System Type">
            <Select
              value={config.systemType}
              onValueChange={(v) =>
                updateConfig(
                  "systemType",
                  v as SolarConfig["systemType"]
                )
              }
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {[
                  "On Grid",
                  "Off Grid",
                  "Hybrid",
                ].map((v) => (
                  <SelectItem
                    key={v}
                    value={v}
                  >
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Tier / Type">
            <Select
              value={config.tier}
              onValueChange={(v) =>
                updateConfig(
                  "tier",
                  v as SolarConfig["tier"]
                )
              }
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {[
                  "Standard",
                  "Premium",
                ].map((v) => (
                  <SelectItem
                    key={v}
                    value={v}
                  >
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="DCR / Non-DCR">
            <Select
              value={config.dcr}
              onValueChange={(v) =>
                updateConfig(
                  "dcr",
                  v as SolarConfig["dcr"]
                )
              }
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {[
                  "DCR",
                  "Non-DCR",
                ].map((v) => (
                  <SelectItem
                    key={v}
                    value={v}
                  >
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Plant Capacity (kW)">
            <Input
              type="number"
              step="0.01"
              className="rounded-xl"
              value={config.capacity}
              onChange={(e) =>
                updateConfig(
                  "capacity",
                  Number(e.target.value)
                )
              }
            />
          </Field>

          <Field label="Solar Module Make">
            <Input
              className="rounded-xl"
              value={config.moduleMake}
              onChange={(e) =>
                updateConfig(
                  "moduleMake",
                  e.target.value
                )
              }
            />
          </Field>

          <Field label="Inverter Make">
            <Input
              className="rounded-xl"
              value={config.inverterMake}
              onChange={(e) =>
                updateConfig(
                  "inverterMake",
                  e.target.value
                )
              }
            />
          </Field>

        </div>
      </Section>

      {/* =========================================================
          PRICING SUMMARY
          ========================================================= */}

      <Section
        title="Pricing Summary"
        action={
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() =>
              setRows([
                ...rows,
                {
                  id: uid(),
                  component: "",
                  capacity: config.capacity,
                  basePrice: 0,
                  discount: 0,
                  gstRate: 18,
                },
              ])
            }
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Pricing Row
          </Button>
        }
      >

        <div className="scroll-x -mx-2 px-2">
          <table className="w-full min-w-[720px] text-sm">

            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3">
                  Component
                </th>
                <th className="py-2 pr-3">
                  Capacity (kW)
                </th>
                <th className="py-2 pr-3">
                  Base Price
                </th>
                <th className="py-2 pr-3">
                  Discount
                </th>
                <th className="py-2 pr-3">
                  GST %
                </th>
                <th className="py-2 pr-3 text-right">
                  Net Amount
                </th>
                <th />
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={row.id}
                  className="border-t border-border"
                >

                  <td className="py-2 pr-3">
                    <Input
                      className="h-9 min-w-40 rounded-lg"
                      value={row.component}
                      onChange={(e) =>
                        setRows(
                          rows.map((r, i) =>
                            i === index
                              ? {
                                  ...r,
                                  component:
                                    e.target.value,
                                }
                              : r
                          )
                        )
                      }
                    />
                  </td>

                  <td className="py-2 pr-3">
                    <Input
                      type="number"
                      step="0.01"
                      className="h-9 w-24 rounded-lg"
                      value={row.capacity}
                      onChange={(e) =>
                        setRows(
                          rows.map((r, i) =>
                            i === index
                              ? {
                                  ...r,
                                  capacity:
                                    Number(
                                      e.target.value
                                    ),
                                }
                              : r
                          )
                        )
                      }
                    />
                  </td>

                  <td className="py-2 pr-3">
                    <Input
                      type="number"
                      className="h-9 w-32 rounded-lg"
                      value={row.basePrice}
                      onChange={(e) =>
                        setRows(
                          rows.map((r, i) =>
                            i === index
                              ? {
                                  ...r,
                                  basePrice:
                                    Number(
                                      e.target.value
                                    ),
                                }
                              : r
                          )
                        )
                      }
                    />
                  </td>

                  <td className="py-2 pr-3">
                    <Input
                      type="number"
                      className="h-9 w-28 rounded-lg"
                      value={row.discount}
                      onChange={(e) =>
                        setRows(
                          rows.map((r, i) =>
                            i === index
                              ? {
                                  ...r,
                                  discount:
                                    Number(
                                      e.target.value
                                    ),
                                }
                              : r
                          )
                        )
                      }
                    />
                  </td>

                  <td className="py-2 pr-3">
                    <Select
                      value={String(
                        row.gstRate
                      )}
                      onValueChange={(v) =>
                        setRows(
                          rows.map((r, i) =>
                            i === index
                              ? {
                                  ...r,
                                  gstRate:
                                    Number(v),
                                }
                              : r
                          )
                        )
                      }
                    >
                      <SelectTrigger className="h-9 w-24 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="5">
                          5%
                        </SelectItem>

                        <SelectItem value="18">
                          18%
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </td>

                  <td className="py-2 pr-3 text-right font-medium">
                    {formatINR(rowNet(row))}
                  </td>

                  <td className="py-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() =>
                        setRows(
                          rows.filter(
                            (_, i) =>
                              i !== index
                          )
                        )
                      }
                      aria-label="Remove row"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </Section>

      {/* =========================================================
          AMOUNT SUMMARY
          ========================================================= */}

      <div className="rounded-xl bg-navy p-5 text-navy-foreground shadow-sm">

        <h3 className="text-sm font-semibold uppercase tracking-wide text-navy-muted">
          Amount Summary
        </h3>

        <dl className="mt-3 space-y-2 text-sm">

          {[
            [
              "1. Total Solar Components Amount",
              totals.componentsTotal,
            ],
            [
              "Taxable Amount",
              totals.taxable,
            ],
            [
              "CGST @ 2.5%",
              totals.cgst2_5,
            ],
            [
              "SGST @ 2.5%",
              totals.sgst2_5,
            ],
            [
              "CGST @ 9%",
              totals.cgst9,
            ],
            [
              "SGST @ 9%",
              totals.sgst9,
            ],
            [
              "2. Add-ons (BOM + Custom)",
              totals.addonsTotal,
            ],
            [
              "GST on Add-ons @ 18%",
              totals.addonsGst,
            ],
          ].map(([label, value]) => (
            <div
              key={label as string}
              className="flex items-center justify-between gap-4"
            >
              <dt className="text-navy-muted">
                {label as string}
              </dt>

              <dd className="font-medium">
                {formatINR(
                  value as number
                )}
              </dd>
            </div>
          ))}

          <div className="mt-3 flex items-center justify-between gap-4 border-t border-navy-muted/30 pt-3">
            <dt className="font-semibold">
              Final Total
            </dt>

            <dd className="text-lg font-bold text-success">
              {formatINR(
                totals.grandTotal
              )}
            </dd>
          </div>

        </dl>
      </div>

      {/* =========================================================
          BILL OF MATERIALS
          ========================================================= */}

      <Section
        title="Bill of Materials"
        action={
          <div className="flex items-center gap-2">

            <Select
              value={newMaterial}
              onValueChange={setNewMaterial}
            >
              <SelectTrigger className="h-9 w-40 rounded-xl">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {MATERIAL_TYPES.map((m) => (
                  <SelectItem
                    key={m}
                    value={m}
                  >
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() =>
                setBom([
                  ...bom,
                  {
                    id: uid(),
                    name: "",
                    spec: newMaterial,
                    qty: 1,
                    unit: "Nos",
                    amount: 0,
                  },
                ])
              }
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Item
            </Button>

          </div>
        }
      >

        <div className="scroll-x -mx-2 px-2">
          <table className="w-full min-w-[760px] text-sm">

            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3">
                  Sl no.
                </th>

                <th className="py-2 pr-3">
                  Material Name
                </th>

                <th className="py-2 pr-3">
                  Specification / Type
                </th>

                <th className="py-2 pr-3">
                  Qty
                </th>

                <th className="py-2 pr-3">
                  Unit
                </th>

                <th className="py-2 pr-3">
                  Amount
                </th>

                <th />
              </tr>
            </thead>

            <tbody>
              {bom.map((item, index) => (
                <tr
                  key={item.id}
                  className="border-t border-border"
                >

                  <td className="py-2 pr-3 text-muted-foreground">
                    {index + 1}
                  </td>

                  <td className="py-2 pr-3">
                    <Input
                      className="h-9 min-w-48 rounded-lg"
                      value={item.name}
                      onChange={(e) =>
                        setBom(
                          bom.map((b, i) =>
                            i === index
                              ? {
                                  ...b,
                                  name:
                                    e.target.value,
                                }
                              : b
                          )
                        )
                      }
                    />
                  </td>

                  <td className="py-2 pr-3">
                    <Select
                      value={item.spec}
                      onValueChange={(v) =>
                        setBom(
                          bom.map((b, i) =>
                            i === index
                              ? {
                                  ...b,
                                  spec: v,
                                }
                              : b
                          )
                        )
                      }
                    >
                      <SelectTrigger className="h-9 w-44 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        {[
                          ...new Set([
                            ...MATERIAL_TYPES,
                            item.spec,
                          ]),
                        ].map((m) => (
                          <SelectItem
                            key={m}
                            value={m}
                          >
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>

                  <td className="py-2 pr-3">
                    <Input
                      type="number"
                      className="h-9 w-20 rounded-lg"
                      value={item.qty}
                      onChange={(e) =>
                        setBom(
                          bom.map((b, i) =>
                            i === index
                              ? {
                                  ...b,
                                  qty: Number(
                                    e.target.value
                                  ),
                                }
                              : b
                          )
                        )
                      }
                    />
                  </td>

                  <td className="py-2 pr-3">
                    <Input
                      className="h-9 w-20 rounded-lg"
                      value={item.unit}
                      onChange={(e) =>
                        setBom(
                          bom.map((b, i) =>
                            i === index
                              ? {
                                  ...b,
                                  unit:
                                    e.target.value,
                                }
                              : b
                          )
                        )
                      }
                    />
                  </td>

                  <td className="py-2 pr-3">
                    <Input
                      type="number"
                      className="h-9 w-28 rounded-lg"
                      value={item.amount}
                      onChange={(e) =>
                        setBom(
                          bom.map((b, i) =>
                            i === index
                              ? {
                                  ...b,
                                  amount:
                                    Number(
                                      e.target.value
                                    ),
                                }
                              : b
                          )
                        )
                      }
                    />
                  </td>

                  <td className="py-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() =>
                        setBom(
                          bom.filter(
                            (_, i) =>
                              i !== index
                          )
                        )
                      }
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </Section>

      {/* =========================================================
          CUSTOM ADD-ONS
          ========================================================= */}

      <Section
        title="Custom Add-ons"
        action={
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() =>
              setAddons([
                ...addons,
                {
                  id: uid(),
                  item: "",
                  description: "",
                  amount: 0,
                },
              ])
            }
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Add-on
          </Button>
        }
      >

        {addons.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No custom add-ons yet.
          </p>
        )}

        {addons.map((addon, index) => (
          <div
            key={addon.id}
            className="grid gap-2 sm:grid-cols-[1fr_1.5fr_auto_auto]"
          >

            <Input
              className="rounded-xl"
              placeholder="Item"
              value={addon.item}
              onChange={(e) =>
                setAddons(
                  addons.map((a, i) =>
                    i === index
                      ? {
                          ...a,
                          item: e.target.value,
                        }
                      : a
                  )
                )
              }
            />

            <Input
              className="rounded-xl"
              placeholder="Description"
              value={addon.description}
              onChange={(e) =>
                setAddons(
                  addons.map((a, i) =>
                    i === index
                      ? {
                          ...a,
                          description:
                            e.target.value,
                        }
                      : a
                  )
                )
              }
            />

            <Input
              type="number"
              className="w-32 rounded-xl"
              value={addon.amount}
              onChange={(e) =>
                setAddons(
                  addons.map((a, i) =>
                    i === index
                      ? {
                          ...a,
                          amount: Number(
                            e.target.value
                          ),
                        }
                      : a
                  )
                )
              }
            />

            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() =>
                setAddons(
                  addons.filter(
                    (_, i) =>
                      i !== index
                  )
                )
              }
              aria-label="Remove add-on"
            >
              <Trash2 className="h-4 w-4" />
            </Button>

          </div>
        ))}

      </Section>

      {/* =========================================================
          QUOTATION PREFERENCES
          ========================================================= */}

      <Section title="Quotation Preferences">

        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={showQr}
            onCheckedChange={(v) =>
              setShowQr(Boolean(v))
            }
          />
          Show QR code on PDF
        </label>

        <Field label="Terms & Conditions">
          <Textarea
            className="rounded-xl"
            rows={10}
            value={terms}
            onChange={(e) =>
              setTerms(e.target.value)
            }
          />
        </Field>

        <Field label="Additional Notes">
          <Textarea
            className="rounded-xl"
            rows={4}
            value={notes}
            onChange={(e) =>
              setNotes(e.target.value)
            }
          />
        </Field>

      </Section>

      {/* =========================================================
          ACTIONS
          ========================================================= */}

      <div className="flex flex-col gap-2 pb-4 sm:flex-row">

        <Button
          className="rounded-xl sm:flex-1"
          onClick={save}
          disabled={busy}
        >
          {initial
            ? "Save Changes"
            : "Create Quotation"}
        </Button>

        <Button
          variant="outline"
          className="rounded-xl sm:flex-1"
          onClick={() =>
            navigate({
              to: "/quotations",
            })
          }
        >
          Cancel
        </Button>

      </div>

    </div>
  );
}