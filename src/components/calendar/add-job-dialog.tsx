"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { sk } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useOpsStore } from "@/lib/store/ops-store";

export function AddJobDialog({
  date,
  open,
  onOpenChange,
}: {
  date: Date;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const titleId = useId();
  const workers = useOpsStore((s) => s.workers);
  const addScheduledJob = useOpsStore((s) => s.addScheduledJob);
  const crewOptions = workers.filter(
    (w) => w.role === "crew" || w.role === "field",
  );

  const [mounted, setMounted] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [addressFrom, setAddressFrom] = useState("");
  const [addressTo, setAddressTo] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("12:00");
  const [price, setPrice] = useState("400");
  const [workerId, setWorkerId] = useState(crewOptions[0]?.id ?? "w-crew-1");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !mounted) return null;

  function buildIso(time: string) {
    const [h, m] = time.split(":").map(Number);
    const d = new Date(date);
    d.setHours(h || 0, m || 0, 0, 0);
    return d.toISOString();
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName.trim() || !addressFrom.trim() || !addressTo.trim()) {
      toast.error("Vyplňte zákazníka a adresy");
      return;
    }
    const amount = Number(price);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error("Neplatná cena");
      return;
    }
    addScheduledJob({
      customerName,
      customerPhone,
      addressFrom,
      addressTo,
      startsAt: buildIso(startTime),
      endsAt: buildIso(endTime),
      assignedWorkerIds: [workerId, "w-crew-2"].filter(
        (id, i, arr) => arr.indexOf(id) === i,
      ),
      finalAmountEur: amount,
      crewInstructions: notes,
    });
    toast.success("Zákazka pridaná do kalendára");
    setCustomerName("");
    setCustomerPhone("");
    setAddressFrom("");
    setAddressTo("");
    setNotes("");
    onOpenChange(false);
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-charcoal/50 backdrop-blur-[2px]"
        aria-label="Zavrieť"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[101] m-0 flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-2xl sm:m-4 sm:rounded-3xl"
      >
        <div className="shrink-0 border-b border-black/5 px-5 pt-5 pb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-teal">
            Nová zákazka
          </p>
          <h3 id={titleId} className="mt-1 text-lg font-bold text-charcoal">
            {format(date, "EEEE d. MMMM yyyy", { locale: sk })}
          </h3>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="space-y-3 overflow-y-auto px-5 py-4">
            <div>
              <Label htmlFor="aj-name">Zákazník</Label>
              <Input
                id="aj-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Meno"
                required
              />
            </div>
            <div>
              <Label htmlFor="aj-phone">Telefón</Label>
              <Input
                id="aj-phone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+421 …"
              />
            </div>
            <div>
              <Label htmlFor="aj-from">Odkiaľ</Label>
              <Input
                id="aj-from"
                value={addressFrom}
                onChange={(e) => setAddressFrom(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="aj-to">Kam</Label>
              <Input
                id="aj-to"
                value={addressTo}
                onChange={(e) => setAddressTo(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="aj-start">Od</Label>
                <Input
                  id="aj-start"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="aj-end">Do</Label>
                <Input
                  id="aj-end"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="aj-price">Cena EUR</Label>
              <Input
                id="aj-price"
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="aj-worker">Hlavný pracovník</Label>
              <Select
                id="aj-worker"
                value={workerId}
                onChange={(e) => setWorkerId(e.target.value)}
              >
                {crewOptions.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="aj-notes">Pokyny pre posádku</Label>
              <Textarea
                id="aj-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[72px]"
              />
            </div>
          </div>

          <div className="flex shrink-0 gap-2 border-t border-black/5 bg-white px-5 py-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Zrušiť
            </Button>
            <Button type="submit" className="flex-1 bg-[#0D5C63] hover:bg-[#0A4A50]">
              Uložiť do kalendára
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
