import { supabase } from "@/integrations/supabase/client";
import type { AddonItem, BomItem, Customer, PricingRow, SolarConfig } from "@/lib/solar";

export type QuotationRow = {
  id: string;
  quote_id: string;
  user_id: string;
  organization_id: string | null;
  organization_name: string | null;
  issue_date: string;
  valid_until: string | null;
  subject: string;
  customer: Customer;
  config: SolarConfig;
  pricing_rows: PricingRow[];
  bom: BomItem[];
  addons: AddonItem[];
  show_qr: boolean;
  terms: string | null;
  notes: string | null;
  capacity: number;
  system_type: string | null;
  total: number;
  archived: boolean;
  created_at: string;
};

export type Organization = {
  id: string;
  name: string;
  cin: string | null;
  gst: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
};

export async function fetchOrganizations() {
  const { data, error } = await supabase.from("organizations").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as Organization[];
}

export async function fetchQuotations(opts: { includeArchived?: boolean } = {}) {
  let query = supabase.from("quotations").select("*").order("created_at", { ascending: false });
  if (!opts.includeArchived) query = query.eq("archived", false);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as QuotationRow[];
}

export async function fetchQuotation(id: string) {
  const { data, error } = await supabase.from("quotations").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as unknown as QuotationRow | null;
}

export async function setArchived(id: string, archived: boolean) {
  const { error } = await supabase.from("quotations").update({ archived }).eq("id", id);
  if (error) throw error;
}
