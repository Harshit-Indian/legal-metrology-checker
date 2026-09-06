import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  scanId: z.string().uuid(),
  images: z.array(z.string()).min(1).max(6),
});

type Extracted = Record<string, string | null>;

const FIELD_KEYS = [
  "manufacturer_name",
  "manufacturer_address",
  "country_of_origin",
  "commodity_name",
  "net_quantity",
  "mfg_date",
  "best_before",
  "mrp",
  "consumer_care",
  "unit_sale_price",
] as const;

type Violation = {
  rule_reference: string;
  title: string;
  description: string;
  severity: "critical" | "minor";
  field_key: string | null;
};

const RULES: Record<string, { rule: string; title: string; severity: "critical" | "minor" }> = {
  manufacturer_name: {
    rule: "Rule 6(1)(a), LMPC Rules 2011",
    title: "Name of manufacturer / packer / importer not declared",
    severity: "critical",
  },
  manufacturer_address: {
    rule: "Rule 6(1)(a), LMPC Rules 2011",
    title: "Complete address of manufacturer / packer not declared",
    severity: "critical",
  },
  country_of_origin: {
    rule: "Rule 6(1)(a) proviso, LMPC Rules 2011",
    title: "Country of origin not declared",
    severity: "critical",
  },
  commodity_name: {
    rule: "Rule 6(1)(b), LMPC Rules 2011",
    title: "Common or generic name of commodity not declared",
    severity: "critical",
  },
  net_quantity: {
    rule: "Rule 6(1)(d) r/w Rule 8, LMPC Rules 2011",
    title: "Net quantity not declared in standard units",
    severity: "critical",
  },
  mfg_date: {
    rule: "Rule 6(1)(c), LMPC Rules 2011",
    title: "Month and year of manufacture / packing not declared",
    severity: "critical",
  },
  best_before: {
    rule: "Rule 6(1)(c), LMPC Rules 2011",
    title: "Best before / use by date not declared",
    severity: "minor",
  },
  mrp: {
    rule: "Rule 6(1)(e) r/w Rule 18, LMPC Rules 2011",
    title: "Retail sale price (MRP) not declared",
    severity: "critical",
  },
  consumer_care: {
    rule: "Rule 6(1)(f), LMPC Rules 2011",
    title: "Consumer care name, phone or email not declared",
    severity: "critical",
  },
  unit_sale_price: {
    rule: "Rule 2(m) r/w Rule 6, LMPC Rules 2011",
    title: "Unit sale price not declared",
    severity: "minor",
  },
};

function isBlank(value: string | null | undefined) {
  if (!value) return true;
  const v = value.trim().toLowerCase();
  return v === "" || v === "n/a" || v === "na" || v === "not found" || v === "null" || v === "-";
}

type Status = "compliant" | "non_compliant" | "exempt";

function evaluate(fields: Extracted, exempt: boolean): { violations: Violation[]; status: Status } {
  const violations: Violation[] = [];
  if (exempt) return { violations, status: "exempt" };

  for (const key of FIELD_KEYS) {
    if (isBlank(fields[key])) {
      const rule = RULES[key]!;
      violations.push({
        rule_reference: rule.rule,
        title: rule.title,
        description: `The mandatory declaration "${key.replace(/_/g, " ")}" could not be found on the label evidence supplied.`,
        severity: rule.severity,
        field_key: key,
      });
    }
  }

  const mrp = fields["mrp"] ?? "";
  if (!isBlank(mrp) && !/incl/i.test(mrp)) {
    violations.push({
      rule_reference: "Rule 6(1)(e) r/w Rule 18, LMPC Rules 2011",
      title: "MRP not declared as inclusive of all taxes",
      description: `Declared price "${mrp}" does not carry the prescribed wording "Maximum Retail Price ... inclusive of all taxes".`,
      severity: "minor",
      field_key: "mrp",
    });
  }

  const qty = fields["net_quantity"] ?? "";
  if (!isBlank(qty) && !/\b(g|kg|ml|l|litre|liter|gm|mg|n|u|pcs|pieces)\b/i.test(qty)) {
    violations.push({
      rule_reference: "Rule 8, LMPC Rules 2011",
      title: "Net quantity not expressed in prescribed metric units",
      description: `Declared net quantity "${qty}" does not use a standard unit of weight, measure or number.`,
      severity: "critical",
      field_key: "net_quantity",
    });
  }

  const status: Status = violations.some((v) => v.severity === "critical")
    ? "non_compliant"
    : "compliant";
  return { violations, status };
}

export const analyzeScan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const apiKey = process.env["GEMINI_API_KEY"];
    if (!apiKey) throw new Error("AI extraction is not configured.");

    const prompt = `You are a Legal Metrology inspector's OCR assistant for India's Legal Metrology (Packaged Commodities) Rules, 2011.
Read ALL supplied photographs of one packaged commodity label and return a single JSON object only, no prose, with this exact shape:
{"manufacturer_name":string|null,"manufacturer_address":string|null,"country_of_origin":string|null,"commodity_name":string|null,"net_quantity":string|null,"mfg_date":string|null,"best_before":string|null,"mrp":string|null,"consumer_care":string|null,"unit_sale_price":string|null,"exempt":boolean,"exempt_reason":string|null,"raw_text":string}
Copy values verbatim from the label. Use null when a declaration is genuinely absent. Set exempt=true only for packages that Rule 26 exempts (net weight/measure of 10 g or 10 ml or less, agricultural farm produce above 50 kg, etc.).`;

    // Gemini's REST API takes inline image bytes (base64), not arbitrary URLs,
    // so each evidence photo is fetched here and embedded as inlineData.
    const imageParts = await Promise.all(
      data.images.map(async (url) => {
        const imgRes = await fetch(url);
        if (!imgRes.ok) throw new Error(`Could not fetch evidence photo (${imgRes.status}).`);
        const mimeType = imgRes.headers.get("content-type") ?? "image/jpeg";
        const buffer = await imgRes.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        return { inline_data: { mime_type: mimeType, data: base64 } };
      }),
    );

    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
      {
        method: "POST",
        headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }, ...imageParts],
            },
          ],
        }),
      },
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Label reading failed (${res.status}): ${body.slice(0, 200)}`);
    }

    const payload = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const content = payload.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "{}";
    const jsonText = content.replace(/```json|```/g, "").trim();

    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(jsonText.slice(jsonText.indexOf("{"), jsonText.lastIndexOf("}") + 1));
    } catch {
      throw new Error("Could not interpret the label text from these photos. Try clearer photos.");
    }

    const fields: Extracted = {};
    for (const key of FIELD_KEYS) {
      const value = parsed[key];
      fields[key] = typeof value === "string" && value.trim() ? value.trim() : null;
    }

    const exempt = parsed["exempt"] === true;
    const { violations, status } = evaluate(fields, exempt);

    const supabase = context.supabase;

    await supabase.from("extracted_fields").delete().eq("scan_id", data.scanId);
    await supabase.from("violations").delete().eq("scan_id", data.scanId);

    const { error: fieldsError } = await supabase.from("extracted_fields").insert(
      FIELD_KEYS.map((key) => ({
        scan_id: data.scanId,
        field_key: key,
        field_value: fields[key] ?? null,
      })),
    );
    if (fieldsError) throw new Error(fieldsError.message);

    if (violations.length) {
      const { error: vError } = await supabase
        .from("violations")
        .insert(violations.map((v) => ({ ...v, scan_id: data.scanId })));
      if (vError) throw new Error(vError.message);
    }

    const { error: scanError } = await supabase
      .from("scans")
      .update({
        status: "complete",
        compliance_status: status,
        product_name: fields["commodity_name"] ?? null,
        manufacturer_name: fields["manufacturer_name"] ?? null,
        notes: exempt ? ((parsed["exempt_reason"] as string) ?? "Exempted package") : null,
      })
      .eq("id", data.scanId);
    if (scanError) throw new Error(scanError.message);

    return { status, violations: violations.length };
  });
