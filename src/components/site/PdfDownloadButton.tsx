import { useState } from "react";
import { toast } from "sonner";
import { FileDown } from "lucide-react";
import { generateEnrollmentPdf } from "@/lib/enrollments/pdf-fns";

// Scarica un modulo PDF precompilato (generato on-demand server-side).
export function PdfDownloadButton({
  enrollmentId,
  template,
  label,
}: {
  enrollmentId: string;
  template: "tesseramento-acsi" | "iscrizione";
  label: string;
}) {
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      const res = await generateEnrollmentPdf({ data: { enrollmentId, template } });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const binary = atob(res.base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = res.fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Download del PDF non riuscito. Riprova.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={download}
      disabled={busy}
      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold border border-border bg-white hover:bg-secondary transition-colors disabled:opacity-50"
    >
      <FileDown className="w-3.5 h-3.5 text-magic" />
      {busy ? "Generazione…" : label}
    </button>
  );
}
