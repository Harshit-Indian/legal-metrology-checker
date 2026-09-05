# Legal Metrology Compliance Checker
**SIH Problem Statement 26034** — Software system to check compliance of packaged
commodities under the Legal Metrology (Packaged Commodities) Rules, 2011, by
scanning product labels and images.
## Problem
Manual inspection of packaged goods for mandatory label declarations (manufacturer
details, net quantity, MRP, mfg date, etc.) is slow and inconsistent. This system
lets an inspector photograph a product label and get an automated compliance
report, flagging violations against the specific rule they breach.
## Tech stack
- Frontend + backend + auth + DB: Lovable / Supabase
- Label extraction: Google Gemini API (multimodal)
- Custom logic (rule engine): Cursor
- Hosting: Vercel / Lovable
## Status
🚧 In development for SIH 2026
## Team
- Harshit
-Preetam
-Hareram
-Farhan
-Keshav
-Nistha
