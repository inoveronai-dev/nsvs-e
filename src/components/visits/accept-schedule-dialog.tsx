"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { addDays, format } from "date-fns";
import { sk } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { combineSchedule } from "@/lib/calendar/schedule";

export function AcceptScheduleDialog({
  open,
  customerName,
  defaultDate,
  defaultStartTime,
  defaultEndTime,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  customerName: string;
  defaultDate?: string;
  defaultStartTime?: string;
  defaultEndTime?: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (schedule: {
    scheduledDate: string;
    scheduledTime: string;
    startsAt: string;
    endsAt: string;
  }) => void;
}) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const tomorrow = useMemo(
    () => format(addDays(new Date(), 1), "yyyy-MM-dd"),
    [],
  );
  const [date, setDate] = useState(defaultDate || tomorrow);
  const [startTime, setStartTime] = useState(defaultStartTime || "08:00");
  const [endTime, setEndTime] = useState(defaultEndTime || "12:00");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setDate(defaultDate || tomorrow);
    setStartTime(defaultStartTime || "08:00");
    setEndTime(defaultEndTime || "12:00");
  }, [open, defaultDate, defaultStartTime, defaultEndTime, tomorrow]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !mounted) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !startTime) return;
    const starts = combineSchedule(date, startTime);
    const ends = combineSchedule(date, endTime || startTime);
    onConfirm({
      scheduledDate: date,
      scheduledTime: startTime,
      startsAt: starts.toISOString(),
      endsAt: ends.toISOString(),
    });
  }

  const preview = (() => {
    try {
      return format(combineSchedule(date, startTime), "EEEE d. MMMM · HH:mm", {
        locale: sk,
      });
    } catch {
      return date;
    }
  })();

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-charcoal/50"
        aria-label="Zavrieť"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[101] w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:m-4 sm:rounded-3xl"
      >
        <p className="text-xs font-bold uppercase tracking-wider text-teal">
          Termín zákazky
        </p>
        <h3 id={titleId} className="mt-1 text-lg font-bold text-charcoal">
          {customerName}
        </h3>
        <p className="mt-1 text-sm text-muted">
          Nastavte dátum a čas sťahovania. Po potvrdení sa zákazka okamžite
          zobrazí v kalendári (Terén aj Majiteľ).
        </p>

        <form onSubmit={submit} className="mt-4 space-y-3">
          <div>
            <Label htmlFor="acc-date">Dátum</Label>
            <Input
              id="acc-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="acc-start">Začiatok</Label>
              <Input
                id="acc-start"
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="acc-end">Koniec</Label>
              <Input
                id="acc-end"
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <p className="rounded-xl bg-teal/10 px-3 py-2 text-sm font-medium text-teal">
            {preview}
          </p>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Zrušiť
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#0D5C63] hover:bg-[#0A4A50]"
            >
              Potvrdiť a pridať do kalendára
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
