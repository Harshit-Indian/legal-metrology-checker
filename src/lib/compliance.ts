export const LABEL_FIELDS = [
  { key: "manufacturer_name", label: "Manufacturer / Packer / Importer" },
  { key: "manufacturer_address", label: "Address" },
  { key: "country_of_origin", label: "Country of origin" },
  { key: "commodity_name", label: "Common / generic name" },
  { key: "net_quantity", label: "Net quantity" },
  { key: "mfg_date", label: "Date of manufacture / packing" },
  { key: "best_before", label: "Best before / use by" },
  { key: "mrp", label: "Retail sale price (MRP)" },
  { key: "consumer_care", label: "Consumer care details" },
  { key: "unit_sale_price", label: "Unit sale price" },
] as const;

export type LabelFieldKey = (typeof LABEL_FIELDS)[number]["key"];

export const COMPLIANCE_LABEL: Record<string, string> = {
  compliant: "Compliant",
  non_compliant: "Non-compliant",
  exempt: "Exempt",
  pending: "Pending",
};

export function fieldLabel(key: string) {
  return LABEL_FIELDS.find((f) => f.key === key)?.label ?? key;
}
