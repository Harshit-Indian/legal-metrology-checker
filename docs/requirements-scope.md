# Requirements scope — SIH 26034

This maps every requirement in the official problem statement to a build phase and
an honest note on depth of implementation. Update this file as the build progresses —
it becomes the core of the "technical documentation describing software architecture"
deliverable the problem statement asks for.

## Core capabilities

| Requirement (from PS) | MVP approach | Build phase | Depth |
|---|---|---|---|
| Scan/analyze images of packaged commodities | Upload photo, send to Gemini multimodal API | Phase 4 | Full |
| Detect mandatory declarations | Structured field extraction via `compliance-rules.json` | Phase 4–5 | Full |
| Check correctness/completeness of declarations | Rule engine validates each field against format rules | Phase 5 | Full |
| Identify missing/non-compliant declarations | Rule engine flags nulls + format mismatches | Phase 5 | Full |
| Check readability and font size | Relative text-height heuristic (see `manner_of_declaration_checks` in compliance-rules.json) | Phase 5 | Heuristic — explicitly labeled as relative risk, not certified mm measurement |
| Detect misleading/non-standard declarations | Format-pattern violations only (e.g. malformed MRP) | Phase 5 | Partial — semantic "misleading claims" detection deferred, stated as future work |
| Generate compliance reports/violation summaries | Structured report screen + export | Phase 6 | Full |
| Repository of scanned products + compliance history | Postgres tables + list/history view | Phase 2, 6 | Full |
| Dashboards for enforcement officials | Aggregate view: violation trends, product/brand history | Phase 6 | Full |

## Expected solution checklist

| Deliverable | Approach | Phase |
|---|---|---|
| Web and/or mobile app | Web app (responsive), built in Lovable | Phase 3 |
| Automated extraction + validation | Gemini extraction → rule engine | Phase 4–5 |
| Rule-based compliance checking | `compliance-rules.json` + validator functions | Phase 1, 5 |
| Compliance reports — PDF **and editable** format | PDF export (e.g. via a PDF library) + a downloadable editable copy (e.g. `.docx` or in-app editable form before export) | Phase 6 |
| Dashboard for inspections/violations/compliance | Inspector dashboard with filters | Phase 6 |
| Search/retrieval of past scans and reports | Search bar on the history view — by product name, manufacturer, date range, compliance status | Phase 6 |
| Technical documentation | This file + an architecture diagram, expanded before submission | Ongoing, finalized Phase 9 |

## Key functional requirements

| Requirement | Notes |
|---|---|
| Image upload and scanning | Phase 3–4 |
| Extraction + detection of declarations | Phase 4 |
| Font size and readability analysis | Heuristic, see above |
| Detection of missing/misleading/non-standard declarations | Missing + non-standard: full. Misleading (semantic): deferred |
| Compliance/non-compliance report generation | Phase 6 |
| **Attachment of photographs and supporting evidence** | Each scan stores the original uploaded image(s) as evidence, linked permanently to its report — schema must support multiple images per scan, not just one (revise Phase 2 schema to add an `evidence_photos` table: scan_id, image_url, uploaded_at) |
| Repository of scanned products and inspection history | Phase 2, 6 |
| Role-based access and secure authentication | Supabase auth, roles: Inspector / Manufacturer / Admin — Phase 3 |
| Dashboard for compliance status and enforcement activity | Phase 6 |
| Export to PDF and editable formats | Phase 6 |

## Known limitations to state upfront in the demo (not hide)

- Font-size/readability check is a **relative heuristic**, not a certified mm measurement — no calibration reference exists in a standard photo.
- "Misleading declaration" detection is scoped to **format violations** (e.g. malformed MRP), not full semantic/marketing-language analysis.
- OCR accuracy depends on photo quality — a human-in-the-loop correction step (Phase 7) exists specifically because of this.

Stating these clearly is a credibility strength for a compliance tool, not a weakness — it shows the team understands where automation is reliable and where it isn't.
