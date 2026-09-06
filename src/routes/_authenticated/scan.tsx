import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { analyzeScan } from "@/lib/scan.functions";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/scan")({
  head: () => ({
    meta: [
      { title: "New scan — Legal Metrology Compliance Checker" },
      {
        name: "description",
        content: "Upload one or more label photographs to verify mandatory declarations.",
      },
      { property: "og:title", content: "New scan — Legal Metrology Compliance Checker" },
      {
        property: "og:description",
        content: "Upload label photographs to verify mandatory declarations.",
      },
    ],
  }),
  component: NewScan,
});

async function toCompressedDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const max = 1400;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  ctx?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.75);
}

function NewScan() {
  const navigate = useNavigate();
  const analyze = useServerFn(analyzeScan);
  const [files, setFiles] = useState<File[]>([]);
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState("");

  function addFiles(list: FileList | null) {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)].slice(0, 6));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!files.length) {
      toast.error("Attach at least one label photograph.");
      return;
    }
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Session expired. Sign in again.");

      setStep("Creating scan record…");
      const { data: scan, error: scanError } = await supabase
        .from("scans")
        .insert({ user_id: userId, product_name: reference || null, status: "processing" })
        .select("id")
        .single();
      if (scanError) throw scanError;

      setStep("Uploading evidence…");
      const dataUrls: string[] = [];
      for (const [index, file] of files.entries()) {
        const path = `${userId}/${scan.id}/${index}-${file.name.replace(/[^\w.-]/g, "_")}`;
        const { error: uploadError } = await supabase.storage
          .from("evidence-photos")
          .upload(path, file, { upsert: true });
        if (uploadError) throw uploadError;
        await supabase.from("evidence_photos").insert({
          scan_id: scan.id,
          storage_path: path,
          file_name: file.name,
          position: index,
          uploaded_by: userId,
        });
        dataUrls.push(await toCompressedDataUrl(file));
      }

      setStep("Reading label declarations…");
      await analyze({ data: { scanId: scan.id, images: dataUrls } });

      toast.success("Scan complete.");
      navigate({ to: "/scans/$scanId", params: { scanId: scan.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Scan failed.");
    } finally {
      setBusy(false);
      setStep("");
    }
  }

  return (
    <AppShell
      title="New scan"
      subtitle="Attach every panel of the package that carries declarations"
    >
      <form onSubmit={submit} className="grid max-w-4xl gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="gov-panel p-5">
          <Label
            htmlFor="photos"
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border px-6 py-12 text-center transition-colors hover:border-primary/50 hover:bg-secondary"
          >
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm font-medium">Select label photographs</span>
            <span className="text-xs text-muted-foreground">
              JPG or PNG, up to 6 images in one scan
            </span>
          </Label>
          <input
            id="photos"
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => addFiles(e.target.files)}
          />

          {files.length > 0 && (
            <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {files.map((file, i) => (
                <li key={`${file.name}-${i}`} className="relative overflow-hidden rounded-md border">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Label evidence ${i + 1}`}
                    className="h-28 w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute right-1 top-1 rounded bg-background/90 p-1"
                    aria-label="Remove photo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="gov-panel h-fit space-y-4 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="reference">Product reference (optional)</Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. Batch A-221 biscuits"
            />
            <p className="text-xs text-muted-foreground">
              Overwritten by the commodity name read from the label, when found.
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {step || "Working…"}
              </>
            ) : (
              "Run compliance check"
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Photographs are stored as evidence against this scan record.
          </p>
        </div>
      </form>
    </AppShell>
  );
}
