/*
# Legal Metrology core schema

Creates the core tables for the Legal Metrology (Packaged Commodities) compliance
checker app: profiles, user_roles, products, scans, evidence_photos,
extracted_fields, violations, and reports.

1. Enums
- app_role: inspector | manufacturer | admin
- compliance_status: compliant | non_compliant | exempt | pending
- violation_severity: critical | minor

2. Tables
- profiles: user profile (id from auth.users), email, full_name, organization
- user_roles: maps a user to one app role
- products: registered products with manufacturer and category
- scans: a single label scan with compliance determination
- evidence_photos: multiple photos per scan (stored in evidence-photos bucket)
- extracted_fields: key/value label declarations extracted from a scan
- violations: rule violations found on a scan, with severity and rule reference
- reports: generated compliance reports per scan

3. Functions
- has_role(_user_id, _role): SECURITY DEFINER check for role membership
- can_access_scan(_scan_id): owner or admin or inspector can access
- owns_scan(_scan_id): owner or admin can mutate
- handle_new_user(): trigger that creates profile + role from signup metadata

4. Security (RLS)
- profiles: owner read/update, admin+inspector read all
- user_roles: owner read, admin read all
- products: owner CRUD, admin+inspector read
- scans: owner CRUD, admin+inspector read
- evidence_photos: access via can_access_scan; write/delete via owns_scan
- extracted_fields: access via can_access_scan; write/update/delete via owns_scan
- violations: read via can_access_scan; write/delete via owns_scan
- reports: read via can_access_scan; write by the report author; delete by author or admin
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('inspector', 'manufacturer', 'admin');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'compliance_status') THEN
    CREATE TYPE public.compliance_status AS ENUM ('compliant', 'non_compliant', 'exempt', 'pending');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'violation_severity') THEN
    CREATE TYPE public.violation_severity AS ENUM ('critical', 'minor');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  organization TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

DROP POLICY IF EXISTS "own profile read" ON public.profiles;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'inspector'));
DROP POLICY IF EXISTS "own profile insert" ON public.profiles;
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
DROP POLICY IF EXISTS "own profile update" ON public.profiles;
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

DROP POLICY IF EXISTS "own roles read" ON public.user_roles;
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Signup trigger: profile + role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  requested TEXT := COALESCE(NEW.raw_user_meta_data ->> 'role', 'inspector');
BEGIN
  INSERT INTO public.profiles (id, email, full_name, organization)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'organization')
  ON CONFLICT (id) DO NOTHING;

  IF requested NOT IN ('inspector', 'manufacturer', 'admin') THEN
    requested := 'inspector';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, requested::public.app_role)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  manufacturer_name TEXT,
  category TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "products read" ON public.products;
CREATE POLICY "products read" ON public.products FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'inspector'));
DROP POLICY IF EXISTS "products insert" ON public.products;
CREATE POLICY "products insert" ON public.products FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
DROP POLICY IF EXISTS "products update" ON public.products;
CREATE POLICY "products update" ON public.products FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "products delete" ON public.products;
CREATE POLICY "products delete" ON public.products FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Scans
CREATE TABLE IF NOT EXISTS public.scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT,
  manufacturer_name TEXT,
  status TEXT NOT NULL DEFAULT 'processing',
  compliance_status public.compliance_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scans TO authenticated;
GRANT ALL ON public.scans TO service_role;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "scans read" ON public.scans;
CREATE POLICY "scans read" ON public.scans FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'inspector'));
DROP POLICY IF EXISTS "scans insert" ON public.scans;
CREATE POLICY "scans insert" ON public.scans FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "scans update" ON public.scans;
CREATE POLICY "scans update" ON public.scans FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "scans delete" ON public.scans;
CREATE POLICY "scans delete" ON public.scans FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.can_access_scan(_scan_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.scans s
    WHERE s.id = _scan_id
      AND (s.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'inspector'))
  )
$$;

CREATE OR REPLACE FUNCTION public.owns_scan(_scan_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.scans s
    WHERE s.id = _scan_id AND (s.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
$$;

-- Evidence photos
CREATE TABLE IF NOT EXISTS public.evidence_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evidence_photos TO authenticated;
GRANT ALL ON public.evidence_photos TO service_role;
ALTER TABLE public.evidence_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "photos read" ON public.evidence_photos;
CREATE POLICY "photos read" ON public.evidence_photos FOR SELECT TO authenticated USING (public.can_access_scan(scan_id));
DROP POLICY IF EXISTS "photos write" ON public.evidence_photos;
CREATE POLICY "photos write" ON public.evidence_photos FOR INSERT TO authenticated WITH CHECK (public.owns_scan(scan_id));
DROP POLICY IF EXISTS "photos delete" ON public.evidence_photos;
CREATE POLICY "photos delete" ON public.evidence_photos FOR DELETE TO authenticated USING (public.owns_scan(scan_id));

-- Extracted fields
CREATE TABLE IF NOT EXISTS public.extracted_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  field_label TEXT,
  field_value TEXT,
  confidence NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.extracted_fields TO authenticated;
GRANT ALL ON public.extracted_fields TO service_role;
ALTER TABLE public.extracted_fields ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fields read" ON public.extracted_fields;
CREATE POLICY "fields read" ON public.extracted_fields FOR SELECT TO authenticated USING (public.can_access_scan(scan_id));
DROP POLICY IF EXISTS "fields write" ON public.extracted_fields;
CREATE POLICY "fields write" ON public.extracted_fields FOR INSERT TO authenticated WITH CHECK (public.owns_scan(scan_id));
DROP POLICY IF EXISTS "fields update" ON public.extracted_fields;
CREATE POLICY "fields update" ON public.extracted_fields FOR UPDATE TO authenticated USING (public.owns_scan(scan_id));
DROP POLICY IF EXISTS "fields delete" ON public.extracted_fields;
CREATE POLICY "fields delete" ON public.extracted_fields FOR DELETE TO authenticated USING (public.owns_scan(scan_id));

-- Violations
CREATE TABLE IF NOT EXISTS public.violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  rule_reference TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  severity public.violation_severity NOT NULL DEFAULT 'minor',
  field_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.violations TO authenticated;
GRANT ALL ON public.violations TO service_role;
ALTER TABLE public.violations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "violations read" ON public.violations;
CREATE POLICY "violations read" ON public.violations FOR SELECT TO authenticated USING (public.can_access_scan(scan_id));
DROP POLICY IF EXISTS "violations write" ON public.violations;
CREATE POLICY "violations write" ON public.violations FOR INSERT TO authenticated WITH CHECK (public.owns_scan(scan_id));
DROP POLICY IF EXISTS "violations delete" ON public.violations;
CREATE POLICY "violations delete" ON public.violations FOR DELETE TO authenticated USING (public.owns_scan(scan_id));

-- Reports
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  generated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  summary TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reports read" ON public.reports;
CREATE POLICY "reports read" ON public.reports FOR SELECT TO authenticated USING (public.can_access_scan(scan_id));
DROP POLICY IF EXISTS "reports write" ON public.reports;
CREATE POLICY "reports write" ON public.reports FOR INSERT TO authenticated WITH CHECK (generated_by = auth.uid());
DROP POLICY IF EXISTS "reports delete" ON public.reports;
CREATE POLICY "reports delete" ON public.reports FOR DELETE TO authenticated USING (generated_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_scans_user ON public.scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_created ON public.scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_scan ON public.evidence_photos(scan_id);
CREATE INDEX IF NOT EXISTS idx_fields_scan ON public.extracted_fields(scan_id);
CREATE INDEX IF NOT EXISTS idx_violations_scan ON public.violations(scan_id);
