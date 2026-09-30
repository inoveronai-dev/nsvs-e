"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  INVENTORY_PRESETS,
  type InventoryCounts,
  type InventoryItemId,
} from "@/types/ops";

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function InventoryCounters({
  counts,
  onCountsChange,
  customItems,
  onCustomItemsChange,
}: {
  counts: InventoryCounts;
  onCountsChange: (counts: InventoryCounts) => void;
  customItems: string;
  onCustomItemsChange: (value: string) => void;
}) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  function bump(id: InventoryItemId, delta: number) {
    onCountsChange({
      ...counts,
      [id]: Math.max(0, Math.min(999, (counts[id] ?? 0) + delta)),
    });
  }

  function toggleVoice() {
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      toast.error("Hlasové zadávanie nie je v tomto prehliadači dostupné");
      return;
    }

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    const recognition = new Ctor();
    recognition.lang = "sk-SK";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(" ")
        .trim();
      if (!transcript) return;
      onCustomItemsChange(
        customItems.trim()
          ? `${customItems.trim()}, ${transcript}`
          : transcript,
      );
      toast.success("Text doplnený hlasom");
    };
    recognition.onerror = () => {
      setListening(false);
      toast.error("Hlasové zadávanie zlyhalo");
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      toast.error("Nepodarilo sa spustiť mikrofón");
      setListening(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {INVENTORY_PRESETS.map((item) => {
          const value = counts[item.id] ?? 0;
          return (
            <div
              key={item.id}
              className="rounded-2xl border border-black/8 bg-white p-3 shadow-sm"
            >
              <p className="text-center text-sm font-semibold text-charcoal">
                {item.label}
              </p>
              <div className="mt-2 flex items-center justify-between gap-1">
                <button
                  type="button"
                  aria-label={`Znížiť ${item.label}`}
                  onClick={() => bump(item.id, -1)}
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface text-charcoal transition active:scale-95 hover:bg-black/5"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <span
                  className={cn(
                    "min-w-[2.5rem] text-center text-2xl font-bold tabular-nums",
                    value > 0 ? "text-teal" : "text-muted",
                  )}
                >
                  {value}
                </span>
                <button
                  type="button"
                  aria-label={`Zvýšiť ${item.label}`}
                  onClick={() => bump(item.id, 1)}
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0D5C63] text-white transition active:scale-95 hover:bg-[#0A4A50]"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <Label htmlFor="custom-items">Iné položky</Label>
        <div className="flex gap-2">
          <Input
            id="custom-items"
            value={customItems}
            onChange={(e) => onCustomItemsChange(e.target.value)}
            placeholder="napr. klavír, akvárium…"
            className="flex-1"
          />
          <button
            type="button"
            onClick={toggleVoice}
            aria-pressed={listening}
            aria-label={listening ? "Zastaviť nahrávanie" : "Hlasové zadávanie"}
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition",
              listening
                ? "border-brand-yellow bg-[#F5D400] text-charcoal animate-pulse"
                : "border-black/10 bg-white text-teal hover:bg-teal/5",
            )}
          >
            {listening ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </button>
        </div>
        {listening ? (
          <p className="mt-2 text-xs font-semibold text-teal">
            Počúvam… hovorte po slovensky
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-muted">
            Mikrofón doplní text do poľa „Iné položky“
          </p>
        )}
      </div>
    </div>
  );
}
