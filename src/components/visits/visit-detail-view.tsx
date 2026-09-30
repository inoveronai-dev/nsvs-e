"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Box,
  Building2,
  Car,
  ClipboardList,
  FileText,
  Loader2,
  MapPin,
  Phone,
  Save,
  Sparkles,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AcceptScheduleDialog } from "@/components/visits/accept-schedule-dialog";
import { useOpsStore } from "@/lib/store/ops-store";
import { formatDateTimeSk, formatEur } from "@/lib/utils";
import { resolveMediaSrc } from "@/lib/visits/media";
import {
  specialItemsLabels,
  visitStatusClass,
  visitStatusLabel,
} from "@/lib/visits/labels";
import { PARKING_OPTIONS, type SiteVisit } from "@/types/ops";

function parkingLabel(value: string) {
  return PARKING_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

function LocationCard({
  title,
  accent,
  address,
  floor,
  elevator,
  parking,
}: {
  title: string;
  accent: "from" | "to";
  address: string;
  floor: number;
  elevator: boolean;
  parking: string;
}) {
  return (
    <Card
      className={`space-y-3 border-l-4 ${
        accent === "from" ? "border-l-brand-yellow" : "border-l-teal"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            accent === "from"
              ? "bg-brand-yellow/40 text-charcoal"
              : "bg-teal/15 text-teal"
          }`}
        >
          <MapPin className="h-4 w-4" />
        </span>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
          {title}
        </h3>
      </div>
      <p className="text-base font-semibold leading-snug text-charcoal">
        {address}
      </p>
      <ul className="space-y-2 text-sm text-muted">
        <li className="flex items-center gap-2">
          <Building2 className="h-4 w-4 shrink-0 text-teal" />
          <span>
            {floor}. poschodie · výťah{" "}
            <strong className="text-charcoal">
              {elevator ? "áno" : "nie"}
            </strong>
          </span>
        </li>
        <li className="flex items-center gap-2">
          <Car className="h-4 w-4 shrink-0 text-teal" />
          <span>Parkovanie {parkingLabel(parking)}</span>
        </li>
      </ul>
    </Card>
  );
}

function MediaGallery({ visit }: { visit: SiteVisit }) {
  const items =
    visit.media.length > 0
      ? visit.media
      : [
          { id: "mock-1", name: "Foto 1", dataUrl: "", type: "photo" as const },
          { id: "mock-2", name: "Foto 2", dataUrl: "", type: "photo" as const },
          { id: "mock-3", name: "Foto 3", dataUrl: "", type: "photo" as const },
        ];

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
          Médiá z obhliadky
        </h3>
        <span className="text-xs font-medium text-muted">
          {items.length}{" "}
          {items.length === 1 ? "súbor" : items.length < 5 ? "súbory" : "súborov"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {items.map((m, i) => {
          const src = resolveMediaSrc(m.dataUrl, i, visit.id);
          return (
            <a
              key={m.id}
              href={src}
              target="_blank"
              rel="noreferrer"
              className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-surface shadow-sm ring-1 ring-black/5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={m.name}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal/70 to-transparent p-2">
                <p className="truncate text-[10px] font-medium text-white">
                  {m.name || `Foto ${i + 1}`}
                </p>
              </div>
            </a>
          );
        })}
      </div>
    </Card>
  );
}

function PricingPanel({ visit }: { visit: SiteVisit }) {
  const router = useRouter();
  const quotes = useOpsStore((s) => s.quotes);
  const upsertQuote = useOpsStore((s) => s.upsertQuote);
  const acceptQuote = useOpsStore((s) => s.acceptQuote);
  const existing = useMemo(
    () => quotes.find((q) => q.siteVisitId === visit.id),
    [quotes, visit.id],
  );
  const [price, setPrice] = useState(
    existing?.priceEur ? String(existing.priceEur) : "",
  );
  const [notes, setNotes] = useState(existing?.internalNotes ?? "");
  const [busy, setBusy] = useState<"save" | "pdf" | "accept" | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  async function persist(status: "draft" | "sent") {
    const amount = Number(price.replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Zadajte platnú cenu v EUR");
      return null;
    }
    const id = upsertQuote({
      id: existing?.id,
      siteVisitId: visit.id,
      priceEur: amount,
      internalNotes: notes.trim(),
      pdfDataUrl: existing?.pdfDataUrl ?? null,
      status,
    });
    return { id, amount };
  }

  async function onSave() {
    setBusy("save");
    try {
      const result = await persist("draft");
      if (result) toast.success(`Cena uložená · ${formatEur(result.amount)}`);
    } finally {
      setBusy(null);
    }
  }

  async function onPdf() {
    setBusy("pdf");
    try {
      const result = await persist("sent");
      if (!result) return;
      const quote = useOpsStore
        .getState()
        .quotes.find((q) => q.id === result.id);
      if (!quote) return;
      const { downloadQuotePdf } = await import("@/lib/pdf/quote-pdf");
      await downloadQuotePdf(visit, quote);
      toast.success("PDF vygenerované · stav: Čaká na schválenie");
    } catch {
      toast.error("PDF sa nepodarilo vygenerovať");
    } finally {
      setBusy(null);
    }
  }

  async function onAcceptClick() {
    // Ensure quote/price exists first
    if (!existing?.id) {
      setBusy("accept");
      try {
        const saved = await persist("sent");
        if (!saved) return;
      } finally {
        setBusy(null);
      }
    }
    setScheduleOpen(true);
  }

  async function onConfirmSchedule(schedule: {
    scheduledDate: string;
    scheduledTime: string;
    startsAt: string;
    endsAt: string;
  }) {
    setBusy("accept");
    try {
      let quoteId = useOpsStore
        .getState()
        .quotes.find((q) => q.siteVisitId === visit.id)?.id;
      if (!quoteId) {
        const saved = await persist("sent");
        if (!saved) return;
        quoteId = saved.id;
      }
      const jobId = acceptQuote(quoteId, schedule);
      if (jobId) {
        setScheduleOpen(false);
        toast.success(
          `Schválené · v kalendári ${schedule.scheduledDate} o ${schedule.scheduledTime}`,
        );
        router.push(`/owner/calendar?day=${schedule.scheduledDate}`);
      }
    } finally {
      setBusy(null);
    }
  }

  const canAccept =
    visit.status === "waiting_for_client" ||
    (visit.status === "pending_pricing" && !!existing);

  return (
    <Card className="space-y-4 border-teal/20 bg-gradient-to-b from-white to-teal/[0.04] shadow-md shadow-teal/5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-teal">
            Ocenenie zákazky
          </p>
          <h3 className="mt-1 text-lg font-bold text-charcoal">
            Stanoviť cenu a PDF
          </h3>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal text-white">
          <FileText className="h-5 w-5" />
        </span>
      </div>

      <div>
        <Label htmlFor="price">Cena (EUR)</Label>
        <div className="relative">
          <Input
            id="price"
            inputMode="decimal"
            placeholder="napr. 450"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="h-14 pr-14 text-2xl font-bold tracking-tight"
            disabled={visit.status === "accepted_job"}
          />
          <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm font-semibold text-muted">
            €
          </span>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Interné poznámky</Label>
        <Textarea
          id="notes"
          placeholder="Poznámky len pre majiteľa / posádku…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[100px]"
          disabled={visit.status === "accepted_job"}
        />
      </div>

      {visit.status !== "accepted_job" ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="sm:flex-1"
            disabled={busy !== null}
            onClick={() => void onSave()}
          >
            {busy === "save" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Uložiť
          </Button>
          <Button
            type="button"
            size="lg"
            className="sm:flex-[1.4] bg-[#0D5C63] hover:bg-[#0A4A50]"
            disabled={busy !== null}
            onClick={() => void onPdf()}
          >
            {busy === "pdf" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Vygenerovať PDF ponuku
          </Button>
        </div>
      ) : null}

      {canAccept && visit.status !== "accepted_job" ? (
        <Button
          type="button"
          size="lg"
          variant="accent"
          className="w-full"
          disabled={busy !== null}
          onClick={() => void onAcceptClick()}
        >
          {busy === "accept" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}
          Označiť ako prijaté
        </Button>
      ) : null}

      <AcceptScheduleDialog
        open={scheduleOpen}
        customerName={visit.customerName}
        onOpenChange={setScheduleOpen}
        onConfirm={(s) => void onConfirmSchedule(s)}
      />

      {visit.status === "waiting_for_client" ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
          Ponuka čaká na schválenie klienta. Po potvrdení ju pridáte do
          kalendára tlačidlom vyššie.
        </p>
      ) : null}

      {visit.status === "accepted_job" ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
          Schválená zákazka — zobrazená v kalendári a v zozname Zákazky.
        </p>
      ) : null}

      {existing ? (
        <p className="text-xs text-muted">
          Posledné uloženie: {formatEur(existing.priceEur)} ·{" "}
          {formatDateTimeSk(existing.pricedAt)}
        </p>
      ) : null}
    </Card>
  );
}

export function VisitDetailView({ visitId }: { visitId: string }) {
  const visit = useOpsStore((s) => s.siteVisits.find((v) => v.id === visitId));
  const specials = useMemo(
    () => (visit ? specialItemsLabels(visit.specialItems) : []),
    [visit],
  );
  const itemLines = useMemo(() => {
    if (!visit) return [];
    return visit.itemsList
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [visit]);

  if (!visit) {
    return (
      <Card>
        <p className="text-sm text-muted">Obhliadka sa nenašla.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Customer header */}
      <Card className="overflow-hidden border-0 bg-charcoal p-0 text-white shadow-lg">
        <div
          aria-hidden
          className="h-1.5 w-full bg-gradient-to-r from-brand-yellow via-brand-yellow to-teal"
        />
        <div className="space-y-3 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                <User className="h-5 w-5 text-brand-yellow" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-yellow">
                  Zákazník
                </p>
                <h2 className="text-2xl font-bold tracking-tight">
                  {visit.customerName}
                </h2>
              </div>
            </div>
            <Badge className={visitStatusClass(visit.status)}>
              {visitStatusLabel(visit.status)}
            </Badge>
          </div>
          <a
            href={`tel:${visit.customerPhone.replace(/\s/g, "")}`}
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/15"
          >
            <Phone className="h-4 w-4 text-brand-yellow" />
            {visit.customerPhone}
          </a>
          <p className="text-xs text-white/55">
            Obhliadka: {visit.createdByName} ·{" "}
            {formatDateTimeSk(visit.createdAt)}
          </p>
        </div>
      </Card>

      {/* Route */}
      <div className="relative grid gap-3 sm:grid-cols-2">
        <LocationCard
          title="Odkiaľ · Nakládka"
          accent="from"
          address={visit.addressFrom}
          floor={visit.floorFrom}
          elevator={visit.elevatorFrom}
          parking={visit.parkingFrom}
        />
        <div className="pointer-events-none absolute top-1/2 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 sm:flex">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white shadow-md">
            <ArrowRight className="h-4 w-4 text-teal" />
          </span>
        </div>
        <LocationCard
          title="Kam · Vykládka"
          accent="to"
          address={visit.addressTo}
          floor={visit.floorTo}
          elevator={visit.elevatorTo}
          parking={visit.parkingTo}
        />
      </div>

      {/* Inventory */}
      <Card className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-yellow/30 text-charcoal">
            <Box className="h-4 w-4" />
          </span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
            Inventár / položky
          </h3>
        </div>
        {itemLines.length > 1 ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {itemLines.map((line) => (
              <li
                key={line}
                className="flex items-start gap-2 rounded-xl bg-surface px-3 py-2.5 text-sm text-charcoal"
              >
                <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                {line}
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl bg-surface px-3 py-3 text-sm leading-relaxed text-charcoal whitespace-pre-wrap">
            {visit.itemsList}
          </p>
        )}
      </Card>

      {/* Specials */}
      {(specials.length > 0 || visit.specialRequests) && (
        <Card className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal/15 text-teal">
              <Sparkles className="h-4 w-4" />
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
              Špeciálne
            </h3>
          </div>
          {specials.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {specials.map((s) => (
                <Badge
                  key={s}
                  className="bg-brand-yellow/35 px-3 py-1 text-charcoal"
                >
                  {s}
                </Badge>
              ))}
            </div>
          ) : null}
          {visit.specialRequests ? (
            <p className="rounded-xl border border-black/5 bg-surface px-3 py-3 text-sm leading-relaxed text-charcoal">
              {visit.specialRequests}
            </p>
          ) : null}
        </Card>
      )}

      <MediaGallery visit={visit} />
      <PricingPanel key={visit.id} visit={visit} />
    </div>
  );
}
