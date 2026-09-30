import type { Job, Quote, SiteVisit, Worker } from "@/types/ops";
import {
  EMPTY_INVENTORY,
  EMPTY_SPECIAL_ITEMS,
  formatInventorySummary,
} from "@/types/ops";
import { splitSchedule } from "@/lib/calendar/schedule";

const PLACEHOLDER_PHOTO =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

export const SEED_WORKERS: Worker[] = [
  { id: "w-owner", name: "Majiteľ NSVS-E", role: "owner" },
  { id: "w-field-1", name: "Martin Kováč", role: "field" },
  { id: "w-field-2", name: "Peter Horváth", role: "field" },
  { id: "w-crew-1", name: "Ján Novák", role: "crew" },
  { id: "w-crew-2", name: "Tomáš Belko", role: "crew" },
];

function atDay(base: Date, dayOffset: number, hour: number): string {
  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export function buildSeedBundle(now = new Date()) {
  const v1Counts = {
    ...EMPTY_INVENTORY,
    krabice: 15,
    skrina: 2,
    spotrebice: 2,
  };
  const v1Custom = "Pohovka, chladnička";
  const v2Counts = {
    ...EMPTY_INVENTORY,
    stol: 12,
    stolicky: 24,
    skrina: 4,
    krabice: 40,
  };
  const v2Custom = "Servery (2 ks)";
  const vWaitCounts = {
    ...EMPTY_INVENTORY,
    krabice: 20,
    postel: 1,
    skrina: 1,
    spotrebice: 1,
  };
  const a1Counts = { ...EMPTY_INVENTORY, krabice: 20, postel: 1, skrina: 1 };
  const a2Counts = { ...EMPTY_INVENTORY, krabice: 25, stol: 1 };
  const a2Custom = "2 pohovky, klavír";
  const a3Counts = {
    ...EMPTY_INVENTORY,
    stol: 8,
    stolicky: 16,
  };
  const a3Custom = "Trezor, archív";

  const visits: SiteVisit[] = [
    {
      id: "sv-pending-1",
      createdById: "w-field-1",
      createdByName: "Martin Kováč",
      status: "pending_pricing",
      customerName: "Eva Horváthová",
      customerPhone: "+421 905 111 222",
      addressFrom: "Račianska 12, Bratislava",
      addressTo: "Námestie slobody 3, Bratislava",
      floorFrom: 4,
      floorTo: 2,
      elevatorFrom: false,
      elevatorTo: true,
      parkingFrom: "10-50m",
      parkingTo: "0-10m",
      inventoryCounts: v1Counts,
      customItems: v1Custom,
      itemsList: formatInventorySummary(v1Counts, v1Custom),
      specialRequests: "Úzke schodisko, potrebný popruh na chladničku",
      specialItems: { ...EMPTY_SPECIAL_ITEMS, fragile: true },
      media: [
        {
          id: "m1",
          type: "photo",
          dataUrl: PLACEHOLDER_PHOTO,
          mimeType: "image/png",
          name: "obvyadka-1.png",
        },
        {
          id: "m2",
          type: "photo",
          dataUrl: PLACEHOLDER_PHOTO,
          mimeType: "image/png",
          name: "obvyadka-2.png",
        },
      ],
      visitAt: atDay(now, -1, 14),
      createdAt: atDay(now, -1, 15),
      updatedAt: atDay(now, -1, 15),
    },
    {
      id: "sv-waiting-1",
      createdById: "w-field-2",
      createdByName: "Peter Horváth",
      status: "waiting_for_client",
      customerName: "Firma SoftLab s.r.o.",
      customerPhone: "+421 2 5555 100",
      addressFrom: "Einsteinova 24, Bratislava",
      addressTo: "Pribinova 8, Bratislava",
      floorFrom: 6,
      floorTo: 5,
      elevatorFrom: true,
      elevatorTo: true,
      parkingFrom: "0-10m",
      parkingTo: "0-10m",
      inventoryCounts: v2Counts,
      customItems: v2Custom,
      itemsList: formatInventorySummary(v2Counts, v2Custom),
      specialRequests: "Sťahovanie mimo pracovného času, od 18:00",
      specialItems: { ...EMPTY_SPECIAL_ITEMS, safe: true, assembly: true },
      media: [
        {
          id: "m3",
          type: "photo",
          dataUrl: PLACEHOLDER_PHOTO,
          mimeType: "image/png",
          name: "kancelaria.png",
        },
      ],
      visitAt: atDay(now, 0, 10),
      createdAt: atDay(now, 0, 11),
      updatedAt: atDay(now, 0, 16),
    },
    {
      id: "sv-pending-2",
      createdById: "w-field-1",
      createdByName: "Martin Kováč",
      status: "pending_pricing",
      customerName: "Jana Belková",
      customerPhone: "+421 904 111 000",
      addressFrom: "Tomášikova 12, Bratislava",
      addressTo: "Vajnorská 100, Bratislava",
      floorFrom: 2,
      floorTo: 0,
      elevatorFrom: true,
      elevatorTo: false,
      parkingFrom: "0-10m",
      parkingTo: "10-50m",
      inventoryCounts: vWaitCounts,
      customItems: "",
      itemsList: formatInventorySummary(vWaitCounts, ""),
      specialRequests: "",
      specialItems: { ...EMPTY_SPECIAL_ITEMS },
      media: [],
      visitAt: atDay(now, -2, 11),
      createdAt: atDay(now, -2, 12),
      updatedAt: atDay(now, -2, 12),
    },
    {
      id: "sv-accepted-1",
      createdById: "w-field-1",
      createdByName: "Martin Kováč",
      status: "accepted_job",
      customerName: "Michal Tóth",
      customerPhone: "+421 918 333 444",
      addressFrom: "Dunajská 5, Bratislava",
      addressTo: "Karloveská 60, Bratislava",
      floorFrom: 3,
      floorTo: 1,
      elevatorFrom: true,
      elevatorTo: false,
      parkingFrom: "0-10m",
      parkingTo: "10-50m",
      inventoryCounts: a1Counts,
      customItems: "Pračka",
      itemsList: formatInventorySummary(a1Counts, "Pračka"),
      specialRequests: "Parkovanie pred vchodom dohodnuté",
      specialItems: { ...EMPTY_SPECIAL_ITEMS },
      media: [
        {
          id: "m4",
          type: "photo",
          dataUrl: PLACEHOLDER_PHOTO,
          mimeType: "image/png",
          name: "byt.png",
        },
      ],
      visitAt: atDay(now, -5, 11),
      createdAt: atDay(now, -5, 12),
      updatedAt: atDay(now, -3, 9),
    },
    {
      id: "sv-accepted-2",
      createdById: "w-field-2",
      createdByName: "Peter Horváth",
      status: "accepted_job",
      customerName: "Zuzana Kráľová",
      customerPhone: "+421 903 777 888",
      addressFrom: "Šancová 88, Bratislava",
      addressTo: "Ružinovská 1, Bratislava",
      floorFrom: 2,
      floorTo: 5,
      elevatorFrom: true,
      elevatorTo: true,
      parkingFrom: "10-50m",
      parkingTo: "10-50m",
      inventoryCounts: a2Counts,
      customItems: a2Custom,
      itemsList: formatInventorySummary(a2Counts, a2Custom),
      specialRequests: "Klavír cez výťah – rezervované",
      specialItems: { ...EMPTY_SPECIAL_ITEMS, piano: true, fragile: true },
      media: [],
      visitAt: atDay(now, -8, 10),
      createdAt: atDay(now, -8, 11),
      updatedAt: atDay(now, -6, 14),
    },
    {
      id: "sv-accepted-3",
      createdById: "w-field-1",
      createdByName: "Martin Kováč",
      status: "accepted_job",
      customerName: "Office Move SK",
      customerPhone: "+421 911 222 333",
      addressFrom: "Mlynské nivy 16, Bratislava",
      addressTo: "Tomášikova 30, Bratislava",
      floorFrom: 4,
      floorTo: 3,
      elevatorFrom: true,
      elevatorTo: true,
      parkingFrom: "0-10m",
      parkingTo: "0-10m",
      inventoryCounts: a3Counts,
      customItems: a3Custom,
      itemsList: formatInventorySummary(a3Counts, a3Custom),
      specialRequests: "Trezor – 2 osoby extra",
      specialItems: { ...EMPTY_SPECIAL_ITEMS, safe: true, assembly: true },
      media: [],
      visitAt: atDay(now, -10, 9),
      createdAt: atDay(now, -10, 10),
      updatedAt: atDay(now, -7, 12),
    },
  ];

  const quotes: Quote[] = [
    {
      id: "q-waiting-1",
      siteVisitId: "sv-waiting-1",
      priceEur: 890,
      internalNotes: "PDF odoslané – čakáme na klienta",
      pdfDataUrl: null,
      status: "sent",
      pricedAt: atDay(now, 0, 16),
      pricedByName: "Majiteľ NSVS-E",
    },
    {
      id: "q-1",
      siteVisitId: "sv-accepted-1",
      priceEur: 380,
      internalNotes: "Štandardný byt, výťah na odchode",
      pdfDataUrl: null,
      status: "accepted",
      pricedAt: atDay(now, -4, 16),
      pricedByName: "Majiteľ NSVS-E",
    },
    {
      id: "q-2",
      siteVisitId: "sv-accepted-2",
      priceEur: 650,
      internalNotes: "Klavír + krehký nábytok",
      pdfDataUrl: null,
      status: "accepted",
      pricedAt: atDay(now, -6, 15),
      pricedByName: "Majiteľ NSVS-E",
    },
    {
      id: "q-3",
      siteVisitId: "sv-accepted-3",
      priceEur: 720,
      internalNotes: "Firemné + trezor",
      pdfDataUrl: null,
      status: "accepted",
      pricedAt: atDay(now, -7, 11),
      pricedByName: "Majiteľ NSVS-E",
    },
  ];

  const jobs: Job[] = [
    {
      id: "job-1",
      quoteId: "q-1",
      siteVisitId: "sv-accepted-1",
      startsAt: atDay(now, 1, 8),
      endsAt: atDay(now, 1, 12),
      ...splitSchedule(atDay(now, 1, 8)),
      crewInstructions: "Priniesť popruhy a vozík. Zákazník na mieste od 7:45.",
      status: "scheduled",
      finalAmountEur: 380,
      assignedWorkerIds: ["w-crew-1", "w-crew-2", "w-field-1"],
      completedAt: null,
    },
    {
      id: "job-2",
      quoteId: "q-2",
      siteVisitId: "sv-accepted-2",
      startsAt: atDay(now, 3, 9),
      endsAt: atDay(now, 3, 14),
      ...splitSchedule(atDay(now, 3, 9)),
      crewInstructions: "Klavír – popruhy a deky. Parkovanie na Šancovej.",
      status: "scheduled",
      finalAmountEur: 650,
      assignedWorkerIds: ["w-crew-1", "w-crew-2", "w-field-2"],
      completedAt: null,
    },
    {
      id: "job-3",
      quoteId: "q-3",
      siteVisitId: "sv-accepted-3",
      startsAt: atDay(now, 5, 7),
      endsAt: atDay(now, 5, 13),
      ...splitSchedule(atDay(now, 5, 7)),
      crewInstructions: "Trezor 2 osoby. Montáž stolov na mieste.",
      status: "scheduled",
      finalAmountEur: 720,
      assignedWorkerIds: ["w-crew-1", "w-crew-2"],
      completedAt: null,
    },
    {
      id: "job-done-1",
      quoteId: "q-1",
      siteVisitId: "sv-accepted-1",
      startsAt: atDay(now, -12, 9),
      endsAt: atDay(now, -12, 13),
      ...splitSchedule(atDay(now, -12, 9)),
      crewInstructions: "Dokončená ukážková zákazka pre demo financie.",
      status: "completed",
      finalAmountEur: 420,
      assignedWorkerIds: ["w-crew-1", "w-crew-2"],
      completedAt: atDay(now, -12, 13),
    },
    {
      id: "job-done-2",
      quoteId: "q-1",
      siteVisitId: "sv-accepted-1",
      startsAt: atDay(now, -28, 8),
      endsAt: atDay(now, -28, 14),
      ...splitSchedule(atDay(now, -28, 8)),
      crewInstructions: "Firemné sťahovanie – dokončené.",
      status: "completed",
      finalAmountEur: 890,
      assignedWorkerIds: ["w-crew-1", "w-crew-2", "w-field-2"],
      completedAt: atDay(now, -28, 14),
    },
  ];

  return { visits, quotes, jobs };
}

export const SEED_VISITS = buildSeedBundle(
  new Date("2026-09-25T10:00:00"),
).visits;
export const SEED_QUOTES = buildSeedBundle(
  new Date("2026-09-25T10:00:00"),
).quotes;
export const SEED_JOBS = buildSeedBundle(new Date("2026-09-25T10:00:00")).jobs;
