/*
# Evidence photos storage bucket and policies

1. Storage
- Creates the evidence-photos storage bucket (public read off; uploads scoped to owners).
- Policies:
  - INSERT: authenticated users can upload only into their own user-id folder.
  - SELECT: owners, admins, and inspectors can read evidence photos.
  - DELETE: owners can delete their own evidence photos.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence-photos', 'evidence-photos', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "evidence upload own" ON storage.objects;
CREATE POLICY "evidence upload own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'evidence-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "evidence read" ON storage.objects;
CREATE POLICY "evidence read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'evidence-photos' AND ((storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'inspector')));

DROP POLICY IF EXISTS "evidence delete own" ON storage.objects;
CREATE POLICY "evidence delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'evidence-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
