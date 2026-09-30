export type Role = "field" | "owner";

/** Order lifecycle for site visits / zákazky */
export type VisitStatus =
  | "draft"
  | "pending_pricing"
  | "waiting_for_client"
  | "accepted_job"
  | "rejected";

export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected";

export type JobStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

export type MediaType = "photo" | "video";

export type ParkingDistance = "0-10m" | "10-50m" | "50m+";

export type InventoryItemId =
  | "krabice"
  | "skrina"
  | "postel"
  | "stol"
  | "stolicky"
  | "spotrebice";

export type InventoryCounts = Record<InventoryItemId, number>;

export interface Worker {
  id: string;
  name: string;
  role: Role | "crew";
}

export interface VisitMedia {
  id: string;
  type: MediaType;
  dataUrl: string;
  mimeType: string;
  name: string;
}

export interface SpecialItems {
  piano: boolean;
  safe: boolean;
  fragile: boolean;
  assembly: boolean;
}

export interface SiteVisit {
  id: string;
  createdById: string;
  createdByName: string;
  status: VisitStatus;
  customerName: string;
  customerPhone: string;
  addressFrom: string;
  addressTo: string;
  floorFrom: number;
  floorTo: number;
  elevatorFrom: boolean;
  elevatorTo: boolean;
  parkingFrom: ParkingDistance;
  parkingTo: ParkingDistance;
  /** Human-readable inventory summary (derived from counters + custom) */
  itemsList: string;
  inventoryCounts: InventoryCounts;
  customItems: string;
  specialRequests: string;
  specialItems: SpecialItems;
  media: VisitMedia[];
  visitAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  id: string;
  siteVisitId: string;
  priceEur: number;
  internalNotes: string;
  pdfDataUrl: string | null;
  status: QuoteStatus;
  pricedAt: string;
  pricedByName: string;
}

export interface Job {
  id: string;
  quoteId: string;
  siteVisitId: string;
  /** Local calendar date yyyy-MM-dd */
  scheduledDate: string;
  /** Local start time HH:mm */
  scheduledTime: string;
  startsAt: string;
  endsAt: string;
  crewInstructions: string;
  status: JobStatus;
  finalAmountEur: number;
  assignedWorkerIds: string[];
  completedAt: string | null;
}

export type OpsData = {
  version: 4;
  role: Role | null;
  currentUserId: string | null;
  workers: Worker[];
  siteVisits: SiteVisit[];
  quotes: Quote[];
  jobs: Job[];
};

export const PARKING_OPTIONS: { value: ParkingDistance; label: string }[] = [
  { value: "0-10m", label: "0–10 m" },
  { value: "10-50m", label: "10–50 m" },
  { value: "50m+", label: "Viac ako 50 m" },
];

export const EMPTY_SPECIAL_ITEMS: SpecialItems = {
  piano: false,
  safe: false,
  fragile: false,
  assembly: false,
};

export const EMPTY_INVENTORY: InventoryCounts = {
  krabice: 0,
  skrina: 0,
  postel: 0,
  stol: 0,
  stolicky: 0,
  spotrebice: 0,
};

export const INVENTORY_PRESETS: {
  id: InventoryItemId;
  label: string;
}[] = [
  { id: "krabice", label: "Krabice" },
  { id: "skrina", label: "Skriňa" },
  { id: "postel", label: "Posteľ" },
  { id: "stol", label: "Stôl" },
  { id: "stolicky", label: "Stoličky" },
  { id: "spotrebice", label: "Spotrebiče" },
];

export function formatInventorySummary(
  counts: InventoryCounts,
  customItems: string,
): string {
  const parts = INVENTORY_PRESETS.filter((p) => counts[p.id] > 0).map(
    (p) => `${counts[p.id]}× ${p.label}`,
  );
  const custom = customItems.trim();
  if (custom) parts.push(custom);
  return parts.join(", ");
}
