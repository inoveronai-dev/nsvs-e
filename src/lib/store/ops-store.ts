"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type {
  Job,
  OpsData,
  Quote,
  Role,
  SiteVisit,
  VisitMedia,
} from "@/types/ops";
import {
  buildSeedBundle,
  SEED_WORKERS,
} from "@/lib/store/seed";
import { splitSchedule, normalizeJobSchedule } from "@/lib/calendar/schedule";

const STORAGE_KEY = "nsvs-e-ops-v6";

function createSeedState(): Omit<OpsData, "role" | "currentUserId"> & {
  role: Role | null;
  currentUserId: string | null;
} {
  const seed = buildSeedBundle();
  return {
    version: 4,
    role: null,
    currentUserId: null,
    workers: SEED_WORKERS,
    siteVisits: seed.visits,
    quotes: seed.quotes,
    jobs: seed.jobs.map((j) => normalizeJobSchedule(j)),
  };
}

interface OpsStore extends OpsData {
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  setRole: (role: Role) => void;
  clearRole: () => void;
  resetDemo: () => void;
  addSiteVisit: (
    visit: Omit<
      SiteVisit,
      "id" | "createdAt" | "updatedAt" | "createdById" | "createdByName" | "status"
    > & { status?: SiteVisit["status"] },
  ) => string;
  updateSiteVisit: (id: string, patch: Partial<SiteVisit>) => void;
  submitSiteVisit: (id: string) => void;
  upsertQuote: (
    input: Omit<Quote, "id" | "pricedAt" | "pricedByName"> & {
      id?: string;
    },
  ) => string;
  acceptQuote: (
    quoteId: string,
    schedule: {
      startsAt: string;
      endsAt: string;
      scheduledDate: string;
      scheduledTime: string;
    },
  ) => string;
  addScheduledJob: (input: {
    customerName: string;
    customerPhone: string;
    addressFrom: string;
    addressTo: string;
    startsAt: string;
    endsAt: string;
    assignedWorkerIds: string[];
    finalAmountEur: number;
    crewInstructions?: string;
  }) => string;
  updateJob: (id: string, patch: Partial<Job>) => void;
  completeJob: (id: string) => void;
}

export const useOpsStore = create<OpsStore>()(
  persist(
    (set, get) => ({
      ...createSeedState(),
      hydrated: false,
      setHydrated: (value) => set({ hydrated: value }),

      setRole: (role) => {
        const worker =
          role === "owner"
            ? get().workers.find((w) => w.role === "owner")
            : get().workers.find((w) => w.role === "field");
        set({
          role,
          currentUserId: worker?.id ?? null,
        });
      },

      clearRole: () => set({ role: null, currentUserId: null }),

      resetDemo: () =>
        set({
          ...createSeedState(),
          hydrated: true,
        }),

      addSiteVisit: (visit) => {
        const id = nanoid(10);
        const now = new Date().toISOString();
        const user = get().workers.find((w) => w.id === get().currentUserId);
        const row: SiteVisit = {
          ...visit,
          id,
          status: visit.status ?? "draft",
          createdById: get().currentUserId ?? "w-field-1",
          createdByName: user?.name ?? "Terénny pracovník",
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ siteVisits: [row, ...s.siteVisits] }));
        return id;
      },

      updateSiteVisit: (id, patch) =>
        set((s) => ({
          siteVisits: s.siteVisits.map((v) =>
            v.id === id
              ? { ...v, ...patch, updatedAt: new Date().toISOString() }
              : v,
          ),
        })),

      submitSiteVisit: (id) =>
        set((s) => ({
          siteVisits: s.siteVisits.map((v) =>
            v.id === id
              ? {
                  ...v,
                  status: "pending_pricing",
                  updatedAt: new Date().toISOString(),
                }
              : v,
          ),
        })),

      upsertQuote: (input) => {
        const owner = get().workers.find((w) => w.role === "owner");
        const now = new Date().toISOString();
        const existing = input.id
          ? get().quotes.find((q) => q.id === input.id)
          : get().quotes.find((q) => q.siteVisitId === input.siteVisitId);

        if (existing) {
          set((s) => ({
            quotes: s.quotes.map((q) =>
              q.id === existing.id
                ? {
                    ...q,
                    ...input,
                    id: existing.id,
                    pricedAt: now,
                    pricedByName: owner?.name ?? "Majiteľ",
                  }
                : q,
            ),
            siteVisits: s.siteVisits.map((v) => {
              if (v.id !== input.siteVisitId) return v;
              if (v.status === "accepted_job") {
                return { ...v, updatedAt: now };
              }
              // PDF sent → waiting for client; draft save keeps pending_pricing
              const nextStatus =
                input.status === "sent"
                  ? "waiting_for_client"
                  : v.status === "waiting_for_client"
                    ? "waiting_for_client"
                    : "pending_pricing";
              return {
                ...v,
                status: nextStatus,
                updatedAt: now,
              };
            }),
          }));
          return existing.id;
        }

        const id = nanoid(10);
        const quote: Quote = {
          id,
          siteVisitId: input.siteVisitId,
          priceEur: input.priceEur,
          internalNotes: input.internalNotes,
          pdfDataUrl: input.pdfDataUrl,
          status: input.status,
          pricedAt: now,
          pricedByName: owner?.name ?? "Majiteľ",
        };
        set((s) => ({
          quotes: [quote, ...s.quotes],
          siteVisits: s.siteVisits.map((v) => {
            if (v.id !== input.siteVisitId) return v;
            if (v.status === "accepted_job") {
              return { ...v, updatedAt: now };
            }
            return {
              ...v,
              status:
                input.status === "sent"
                  ? "waiting_for_client"
                  : "pending_pricing",
              updatedAt: now,
            };
          }),
        }));
        return id;
      },

      acceptQuote: (quoteId, schedule) => {
        const quote = get().quotes.find((q) => q.id === quoteId);
        if (!quote) return "";
        const now = new Date().toISOString();
        const existingJob = get().jobs.find(
          (j) =>
            j.siteVisitId === quote.siteVisitId &&
            (j.status === "scheduled" || j.status === "in_progress"),
        );
        if (existingJob) {
          set((s) => ({
            quotes: s.quotes.map((q) =>
              q.id === quoteId ? { ...q, status: "accepted" } : q,
            ),
            siteVisits: s.siteVisits.map((v) =>
              v.id === quote.siteVisitId
                ? { ...v, status: "accepted_job", updatedAt: now }
                : v,
            ),
            jobs: s.jobs.map((j) =>
              j.id === existingJob.id
                ? {
                    ...j,
                    startsAt: schedule.startsAt,
                    endsAt: schedule.endsAt,
                    scheduledDate: schedule.scheduledDate,
                    scheduledTime: schedule.scheduledTime,
                    status: "scheduled",
                    finalAmountEur: quote.priceEur,
                  }
                : j,
            ),
          }));
          return existingJob.id;
        }
        const jobId = nanoid(10);
        const job: Job = {
          id: jobId,
          quoteId,
          siteVisitId: quote.siteVisitId,
          scheduledDate: schedule.scheduledDate,
          scheduledTime: schedule.scheduledTime,
          startsAt: schedule.startsAt,
          endsAt: schedule.endsAt,
          crewInstructions: "",
          status: "scheduled",
          finalAmountEur: quote.priceEur,
          assignedWorkerIds: ["w-crew-1", "w-crew-2"],
          completedAt: null,
        };
        set((s) => ({
          quotes: s.quotes.map((q) =>
            q.id === quoteId ? { ...q, status: "accepted" } : q,
          ),
          siteVisits: s.siteVisits.map((v) =>
            v.id === quote.siteVisitId
              ? { ...v, status: "accepted_job", updatedAt: now }
              : v,
          ),
          jobs: [job, ...s.jobs],
        }));
        return jobId;
      },

      addScheduledJob: (input) => {
        const now = new Date().toISOString();
        const visitId = nanoid(10);
        const quoteId = nanoid(10);
        const jobId = nanoid(10);
        const visit: SiteVisit = {
          id: visitId,
          createdById: get().currentUserId ?? "w-owner",
          createdByName:
            get().workers.find((w) => w.id === get().currentUserId)?.name ??
            "Majiteľ NSVS-E",
          status: "accepted_job",
          customerName: input.customerName.trim(),
          customerPhone: input.customerPhone.trim() || "—",
          addressFrom: input.addressFrom.trim(),
          addressTo: input.addressTo.trim(),
          floorFrom: 0,
          floorTo: 0,
          elevatorFrom: true,
          elevatorTo: true,
          parkingFrom: "0-10m",
          parkingTo: "0-10m",
          itemsList: "Manuálne naplánovaná zákazka",
          inventoryCounts: {
            krabice: 0,
            skrina: 0,
            postel: 0,
            stol: 0,
            stolicky: 0,
            spotrebice: 0,
          },
          customItems: "Manuálne naplánovaná zákazka",
          specialRequests: "",
          specialItems: {
            piano: false,
            safe: false,
            fragile: false,
            assembly: false,
          },
          media: [],
          visitAt: now,
          createdAt: now,
          updatedAt: now,
        };
        const quote: Quote = {
          id: quoteId,
          siteVisitId: visitId,
          priceEur: input.finalAmountEur,
          internalNotes: "Vytvorené z kalendára",
          pdfDataUrl: null,
          status: "accepted",
          pricedAt: now,
          pricedByName: "Majiteľ NSVS-E",
        };
        const job: Job = {
          id: jobId,
          quoteId,
          siteVisitId: visitId,
          scheduledDate: splitSchedule(input.startsAt).scheduledDate,
          scheduledTime: splitSchedule(input.startsAt).scheduledTime,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          crewInstructions: input.crewInstructions?.trim() ?? "",
          status: "scheduled",
          finalAmountEur: input.finalAmountEur,
          assignedWorkerIds: input.assignedWorkerIds,
          completedAt: null,
        };
        set((s) => ({
          siteVisits: [visit, ...s.siteVisits],
          quotes: [quote, ...s.quotes],
          jobs: [job, ...s.jobs],
        }));
        return jobId;
      },

      updateJob: (id, patch) =>
        set((s) => ({
          jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)),
        })),

      completeJob: (id) =>
        set((s) => ({
          jobs: s.jobs.map((j) =>
            j.id === id
              ? {
                  ...j,
                  status: "completed",
                  completedAt: new Date().toISOString(),
                }
              : j,
          ),
        })),
    }),
    {
      name: STORAGE_KEY,
      skipHydration: true,
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<OpsData>;
        return {
          ...current,
          ...p,
          jobs: (p.jobs ?? current.jobs).map((j) => normalizeJobSchedule(j)),
          siteVisits: p.siteVisits ?? current.siteVisits,
          quotes: p.quotes ?? current.quotes,
          workers: p.workers ?? current.workers,
        };
      },
      partialize: (state) => ({
        version: state.version,
        role: state.role,
        currentUserId: state.currentUserId,
        workers: state.workers,
        siteVisits: state.siteVisits.map((v) => ({
          ...v,
          media: v.media.map((m) => ({
            ...m,
            dataUrl:
              m.dataUrl && m.dataUrl.length > 120_000 ? "" : m.dataUrl,
          })),
        })),
        quotes: state.quotes,
        jobs: state.jobs.map((j) => normalizeJobSchedule(j)),
      }),
    },
  ),
);

export function compressMediaForStorage(
  file: File,
  maxBytes = 150_000,
): Promise<VisitMedia> {
  return new Promise((resolve, reject) => {
    if (file.size > maxBytes && file.type.startsWith("image/")) {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxW = 1280;
        const scale = Math.min(1, maxW / img.width);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error("Canvas unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        URL.revokeObjectURL(url);
        resolve({
          id: nanoid(8),
          type: "photo",
          dataUrl,
          mimeType: "image/jpeg",
          name: file.name,
        });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Image load failed"));
      };
      img.src = url;
      return;
    }

    if (file.size > maxBytes) {
      resolve({
        id: nanoid(8),
        type: file.type.startsWith("video/") ? "video" : "photo",
        dataUrl: "",
        mimeType: file.type,
        name: `${file.name} (mock – príliš veľké pre localStorage)`,
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        id: nanoid(8),
        type: file.type.startsWith("video/") ? "video" : "photo",
        dataUrl: String(reader.result),
        mimeType: file.type,
        name: file.name,
      });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
