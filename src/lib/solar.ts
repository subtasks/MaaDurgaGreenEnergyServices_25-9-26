export type PricingRow = {
  id: string;
  component: string;
  capacity: number;
  basePrice: number;
  discount: number;
  gstRate: number; // percent, e.g. 5 or 18
};

export type BomItem = {
  id: string;
  name: string;
  spec: string;
  qty: number;
  unit: string;
  amount: number;
};

export type AddonItem = {
  id: string;
  item: string;
  description: string;
  amount: number;
};

export type Customer = {
  type: "Individual" | "Organization";
  cin?: string;
  gst?: string;
  name: string;
  phone: string;
  caNumber?: string;
  email: string;
  billingAddress: string;
  shippingSame: boolean;
  shippingAddress: string;
};

export type SolarConfig = {
  category: "Commercial" | "Residential" | "Industrial";
  systemType: "On Grid" | "Off Grid" | "Hybrid";
  tier: "Standard" | "Premium";
  dcr: "DCR" | "Non-DCR";
  capacity: number;
  moduleMake: string;
  inverterMake: string;
};

export const uid = () => Math.random().toString(36).slice(2, 10);

export function generateQuoteId(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const seq = String(Math.floor(1000 + Math.random() * 9000));
  return `Q-${y}${m}${d}-${seq}`;
}

export function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export const todayISO = () => new Date().toISOString().slice(0, 10);

export function addDaysISO(days: number, from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function maxValidUntilISO(from: string) {
  const d = new Date(from);
  d.setMonth(d.getMonth() + 3);
  return d.toISOString().slice(0, 10);
}

export function rowNet(row: PricingRow) {
  return Math.max(0, (Number(row.basePrice) || 0) - (Number(row.discount) || 0));
}

export type Totals = {
  componentsTotal: number;
  taxable: number;
  cgst2_5: number;
  sgst2_5: number;
  cgst9: number;
  sgst9: number;
  componentGst: number;
  addonsTotal: number;
  addonsGst: number;
  grandTotal: number;
};

export function computeTotals(
  rows: PricingRow[],
  bom: BomItem[],
  addons: AddonItem[],
): Totals {
  let componentsTotal = 0;
  let cgst2_5 = 0;
  let sgst2_5 = 0;
  let cgst9 = 0;
  let sgst9 = 0;

  for (const row of rows) {
    const net = rowNet(row);
    componentsTotal += net;
    const rate = Number(row.gstRate) || 0;
    const half = (net * rate) / 200;
    if (rate === 18) {
      cgst9 += half;
      sgst9 += half;
    } else {
      cgst2_5 += half;
      sgst2_5 += half;
    }
  }

  const bomTotal = bom.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const customTotal = addons.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const addonsTotal = bomTotal + customTotal;
  const addonsGst = addonsTotal * 0.18;
  const componentGst = cgst2_5 + sgst2_5 + cgst9 + sgst9;

  return {
    componentsTotal,
    taxable: componentsTotal,
    cgst2_5,
    sgst2_5,
    cgst9,
    sgst9,
    componentGst,
    addonsTotal,
    addonsGst,
    grandTotal: componentsTotal + componentGst + addonsTotal + addonsGst,
  };
}

export const MATERIAL_TYPES = [
  "Solar module",
  "Inverter",
  "Module mounting structure",
  "AC cable",
  "DC cable",
  "ACDB",
  "DCDB",
  "Solar meter",
  "Net meter",
  "Earthing",
  "Lugs",
  "Cable ties",
  "Lightning arrester",
  "Conduit & accessories",
  "Installation & commissioning",
];

export function defaultBom(config: SolarConfig): BomItem[] {
  const kw = Number(config.capacity) || 0;
  const modules = Math.max(1, Math.ceil((kw * 1000) / 545));
  const base: Array<Omit<BomItem, "id">> = [
    {
      name: `${config.moduleMake || "Waaree"} Mono PERC 545Wp (${config.dcr})`,
      spec: "Solar module",
      qty: modules,
      unit: "Nos",
      amount: 0,
    },
    {
      name: `${config.inverterMake || "Luminous"} ${config.systemType} Inverter ${kw || ""} kW`,
      spec: "Inverter",
      qty: 1,
      unit: "Nos",
      amount: 0,
    },
    {
      name: `Galvanised MMS (${config.tier})`,
      spec: "Module mounting structure",
      qty: Math.max(1, Math.round(kw)),
      unit: "Set",
      amount: 0,
    },
    { name: "AC cable 4 core copper", spec: "AC cable", qty: 30 * Math.max(1, Math.round(kw)), unit: "Mtr", amount: 0 },
    { name: "DC solar cable 4 sq mm", spec: "DC cable", qty: 40 * Math.max(1, Math.round(kw)), unit: "Mtr", amount: 0 },
    { name: "AC distribution box with SPD", spec: "ACDB", qty: 1, unit: "Nos", amount: 0 },
    { name: "DC distribution box with SPD", spec: "DCDB", qty: 1, unit: "Nos", amount: 0 },
    { name: "Solar generation meter", spec: "Solar meter", qty: 1, unit: "Nos", amount: 0 },
    { name: "Earthing kit with chemical compound", spec: "Earthing", qty: 2, unit: "Set", amount: 0 },
    { name: "Copper lugs assorted", spec: "Lugs", qty: 20, unit: "Nos", amount: 0 },
    { name: "UV stabilised cable ties", spec: "Cable ties", qty: 100, unit: "Nos", amount: 0 },
  ];

  if (config.systemType !== "Off Grid") {
    base.push({ name: "Net meter (bi-directional)", spec: "Net meter", qty: 1, unit: "Nos", amount: 0 });
  }
  if (config.systemType !== "On Grid") {
    base.push({ name: "Lithium / Tubular battery bank", spec: "Battery", qty: 1, unit: "Set", amount: 0 });
  }

  return base.map((item) => ({ ...item, id: uid() }));
}

export function defaultPricingRows(capacity: number): PricingRow[] {
  return [
    { id: uid(), component: "System", capacity, basePrice: 0, discount: 0, gstRate: 5 },
    { id: uid(), component: "Balance of System", capacity, basePrice: 0, discount: 0, gstRate: 18 },
  ];
}

export const DEFAULT_TERMS = `1. Scope of work: Supply, installation, testing and commissioning of the solar PV plant as per the Bill of Materials above.
2. Validity: This quotation is valid for 30 days from the date of issue.
3. Payment: 70% advance along with the purchase order, 20% before dispatch of material, 10% after commissioning.
4. Warranty: 25 years performance warranty on solar modules, 10 years product warranty, 5-7 years inverter warranty as per OEM policy.
5. Timeline: 4-6 weeks from receipt of confirmed order and site readiness.
6. Exclusions: Civil / structural work beyond standard mounting, DISCOM liasoning fees, net meter charges paid to DISCOM, storage and diesel generator sets, any statutory approvals unless stated.
7. Taxes: GST is charged as applicable and shown separately in the amount summary.
8. Site conditions: Shadow free area, safe storage space and 3-phase supply to be provided by the customer.`;
