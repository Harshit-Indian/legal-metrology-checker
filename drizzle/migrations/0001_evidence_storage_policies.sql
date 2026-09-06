
CREATE POLICY "evidence upload own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'evidence-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "evidence read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'evidence-photos' AND ((storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'inspector')));

CREATE POLICY "evidence delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'evidence-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
