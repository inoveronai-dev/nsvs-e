"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  compressMediaForStorage,
  useOpsStore,
} from "@/lib/store/ops-store";
import { InventoryCounters } from "@/components/visits/inventory-counters";
import {
  EMPTY_INVENTORY,
  EMPTY_SPECIAL_ITEMS,
  PARKING_OPTIONS,
  formatInventorySummary,
  type InventoryCounts,
  type ParkingDistance,
  type SpecialItems,
  type VisitMedia,
} from "@/types/ops";

const initialForm = {
  customerName: "",
  customerPhone: "",
  addressFrom: "",
  addressTo: "",
  floorFrom: 0,
  floorTo: 0,
  elevatorFrom: false,
  elevatorTo: false,
  parkingFrom: "0-10m" as ParkingDistance,
  parkingTo: "0-10m" as ParkingDistance,
  inventoryCounts: { ...EMPTY_INVENTORY } as InventoryCounts,
  customItems: "",
  specialRequests: "",
  specialItems: { ...EMPTY_SPECIAL_ITEMS } as SpecialItems,
};

export function SiteVisitForm() {
  const router = useRouter();
  const addSiteVisit = useOpsStore((s) => s.addSiteVisit);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(initialForm);
  const [media, setMedia] = useState<VisitMedia[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const setField = <K extends keyof typeof initialForm>(
    key: K,
    value: (typeof initialForm)[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;
    try {
      const next: VisitMedia[] = [];
      for (const file of list.slice(0, 8)) {
        next.push(await compressMediaForStorage(file));
      }
      setMedia((m) => [...m, ...next].slice(0, 12));
      toast.success(
        next.length === 1 ? "Súbor pridaný" : `Pridaných ${next.length} súborov`,
      );
    } catch {
      toast.error("Nepodarilo sa načítať súbor");
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customerName.trim() || !form.customerPhone.trim()) {
      toast.error("Vyplňte meno a telefón zákazníka");
      return;
    }
    if (!form.addressFrom.trim() || !form.addressTo.trim()) {
      toast.error("Vyplňte adresu nakládky aj vykládky");
      return;
    }
    const itemsList = formatInventorySummary(
      form.inventoryCounts,
      form.customItems,
    );
    if (!itemsList) {
      toast.error("Pridajte aspoň jednu položku inventára");
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      addSiteVisit({
        ...form,
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        addressFrom: form.addressFrom.trim(),
        addressTo: form.addressTo.trim(),
        itemsList,
        customItems: form.customItems.trim(),
        inventoryCounts: form.inventoryCounts,
        specialRequests: form.specialRequests.trim(),
        media,
        visitAt: now,
        status: "pending_pricing",
      });
      setForm({
        ...initialForm,
        inventoryCounts: { ...EMPTY_INVENTORY },
        specialItems: { ...EMPTY_SPECIAL_ITEMS },
      });
      setMedia([]);
      toast.success("Obhliadka odoslaná na ocenenie");
      router.push("/field/visits");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 pb-4">
      <Card className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-teal">
          Zákazník
        </h2>
        <div>
          <Label htmlFor="customerName">Meno a priezvisko</Label>
          <Input
            id="customerName"
            required
            autoComplete="name"
            placeholder="Napr. Eva Horváthová"
            value={form.customerName}
            onChange={(e) => setField("customerName", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="customerPhone">Telefón</Label>
          <Input
            id="customerPhone"
            type="tel"
            required
            inputMode="tel"
            placeholder="+421 …"
            value={form.customerPhone}
            onChange={(e) => setField("customerPhone", e.target.value)}
          />
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-teal">
          Nakládka
        </h2>
        <div>
          <Label htmlFor="addressFrom">Adresa</Label>
          <Input
            id="addressFrom"
            required
            placeholder="Ulica, mesto"
            value={form.addressFrom}
            onChange={(e) => setField("addressFrom", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="floorFrom">Poschodie</Label>
          <Input
            id="floorFrom"
            type="number"
            inputMode="numeric"
            min={0}
            max={40}
            value={form.floorFrom}
            onChange={(e) =>
              setField("floorFrom", Number(e.target.value) || 0)
            }
          />
        </div>
        <Switch
          id="elevatorFrom"
          label="Výťah"
          checked={form.elevatorFrom}
          onCheckedChange={(v) => setField("elevatorFrom", v)}
        />
        <div>
          <Label htmlFor="parkingFrom">Vzdialenosť parkovania</Label>
          <Select
            id="parkingFrom"
            value={form.parkingFrom}
            onChange={(e) =>
              setField("parkingFrom", e.target.value as ParkingDistance)
            }
          >
            {PARKING_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-teal">
          Vykládka
        </h2>
        <div>
          <Label htmlFor="addressTo">Adresa</Label>
          <Input
            id="addressTo"
            required
            placeholder="Ulica, mesto"
            value={form.addressTo}
            onChange={(e) => setField("addressTo", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="floorTo">Poschodie</Label>
          <Input
            id="floorTo"
            type="number"
            inputMode="numeric"
            min={0}
            max={40}
            value={form.floorTo}
            onChange={(e) => setField("floorTo", Number(e.target.value) || 0)}
          />
        </div>
        <Switch
          id="elevatorTo"
          label="Výťah"
          checked={form.elevatorTo}
          onCheckedChange={(v) => setField("elevatorTo", v)}
        />
        <div>
          <Label htmlFor="parkingTo">Vzdialenosť parkovania</Label>
          <Select
            id="parkingTo"
            value={form.parkingTo}
            onChange={(e) =>
              setField("parkingTo", e.target.value as ParkingDistance)
            }
          >
            {PARKING_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-teal">
          Inventár
        </h2>
        <InventoryCounters
          counts={form.inventoryCounts}
          onCountsChange={(inventoryCounts) =>
            setField("inventoryCounts", inventoryCounts)
          }
          customItems={form.customItems}
          onCustomItemsChange={(customItems) =>
            setField("customItems", customItems)
          }
        />
        <div>
          <Label htmlFor="specialRequests">Ďalšie poznámky</Label>
          <Textarea
            id="specialRequests"
            placeholder="Úzke schodisko, časové obmedzenia…"
            value={form.specialRequests}
            onChange={(e) => setField("specialRequests", e.target.value)}
          />
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-teal">
          Ťažké / špeciálne
        </h2>
        <div className="grid gap-2">
          <Checkbox
            id="piano"
            label="Klavír / piano"
            checked={form.specialItems.piano}
            onCheckedChange={(v) =>
              setField("specialItems", { ...form.specialItems, piano: v })
            }
          />
          <Checkbox
            id="safe"
            label="Trezor / safe"
            checked={form.specialItems.safe}
            onCheckedChange={(v) =>
              setField("specialItems", { ...form.specialItems, safe: v })
            }
          />
          <Checkbox
            id="fragile"
            label="Extrémne krehké položky"
            checked={form.specialItems.fragile}
            onCheckedChange={(v) =>
              setField("specialItems", { ...form.specialItems, fragile: v })
            }
          />
          <Checkbox
            id="assembly"
            label="Montáž / demontáž"
            checked={form.specialItems.assembly}
            onCheckedChange={(v) =>
              setField("specialItems", { ...form.specialItems, assembly: v })
            }
          />
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-teal">
          Fotky / video
        </h2>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
          }}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files.length) void addFiles(e.dataTransfer.files);
          }}
          className={`flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition ${
            dragOver
              ? "border-teal bg-teal/10"
              : "border-black/15 bg-surface hover:border-teal/40"
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-yellow/80 text-charcoal">
            <ImagePlus className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-charcoal">
            Kliknite alebo potiahnite súbory
          </p>
          <p className="text-xs text-muted">
            Foto / video z galérie alebo fotoaparátu
          </p>
          <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-teal shadow-sm">
            <Camera className="h-3.5 w-3.5" />
            Odfotiť
          </span>
        </div>

        {media.length > 0 ? (
          <ul className="grid grid-cols-3 gap-2">
            {media.map((m) => (
              <li
                key={m.id}
                className="relative aspect-square overflow-hidden rounded-xl bg-surface"
              >
                {m.dataUrl && m.type === "photo" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.dataUrl}
                    alt={m.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-2 text-center text-[10px] text-muted">
                    {m.name}
                  </div>
                )}
                <button
                  type="button"
                  aria-label="Odstrániť"
                  className="absolute top-1 right-1 rounded-full bg-charcoal/80 p-1 text-white"
                  onClick={() =>
                    setMedia((list) => list.filter((x) => x.id !== m.id))
                  }
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </Card>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={submitting}
      >
        {submitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Odosielam…
          </>
        ) : (
          "Odoslať na ocenenie"
        )}
      </Button>
    </form>
  );
}
