"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import { brand } from "@/lib/brand";
import type { Quote, SiteVisit } from "@/types/ops";
import { specialItemsLabels } from "@/lib/visits/labels";
import { PARKING_OPTIONS } from "@/types/ops";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#111111",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
    paddingBottom: 16,
    borderBottomWidth: 3,
    borderBottomColor: "#F5D400",
  },
  brand: { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#0D5C63" },
  muted: { fontSize: 9, color: "#6B7280", marginTop: 4 },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 16,
  },
  section: { marginBottom: 14 },
  label: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#0D5C63",
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 0.8,
  },
  row: { flexDirection: "row", gap: 12, marginBottom: 12 },
  col: { flex: 1 },
  box: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 6,
    padding: 10,
  },
  priceBox: {
    marginTop: 8,
    backgroundColor: "#0D5C63",
    padding: 16,
    borderRadius: 8,
  },
  priceText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
  },
  priceLabel: { color: "#F5D400", fontSize: 9, marginBottom: 4 },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#6B7280",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 8,
  },
});

function parkingLabel(value: string) {
  return PARKING_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

function QuoteDocument({
  visit,
  quote,
}: {
  visit: SiteVisit;
  quote: Quote;
}) {
  const specials = specialItemsLabels(visit.specialItems);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>{brand.name}</Text>
            <Text style={styles.muted}>{brand.tagline}</Text>
          </View>
          <View>
            <Text style={{ textAlign: "right", fontSize: 10 }}>
              Cenová ponuka
            </Text>
            <Text style={[styles.muted, { textAlign: "right" }]}>
              {new Date(quote.pricedAt).toLocaleDateString("sk-SK")}
            </Text>
          </View>
        </View>

        <Text style={styles.title}>{visit.customerName}</Text>
        <Text style={{ marginBottom: 16 }}>{visit.customerPhone}</Text>

        <View style={styles.row}>
          <View style={[styles.col, styles.box]}>
            <Text style={styles.label}>Nakládka</Text>
            <Text>{visit.addressFrom}</Text>
            <Text style={styles.muted}>
              {visit.floorFrom}. p. · výťah{" "}
              {visit.elevatorFrom ? "áno" : "nie"} ·{" "}
              {parkingLabel(visit.parkingFrom)}
            </Text>
          </View>
          <View style={[styles.col, styles.box]}>
            <Text style={styles.label}>Vykládka</Text>
            <Text>{visit.addressTo}</Text>
            <Text style={styles.muted}>
              {visit.floorTo}. p. · výťah {visit.elevatorTo ? "áno" : "nie"} ·{" "}
              {parkingLabel(visit.parkingTo)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Inventár</Text>
          <Text>{visit.itemsList}</Text>
        </View>

        {specials.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.label}>Špeciálne položky</Text>
            <Text>{specials.join(", ")}</Text>
          </View>
        ) : null}

        {visit.specialRequests ? (
          <View style={styles.section}>
            <Text style={styles.label}>Poznámky z obhliadky</Text>
            <Text>{visit.specialRequests}</Text>
          </View>
        ) : null}

        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>Celková cena sťahovania</Text>
          <Text style={styles.priceText}>
            {new Intl.NumberFormat("sk-SK", {
              style: "currency",
              currency: "EUR",
              maximumFractionDigits: 0,
            }).format(quote.priceEur)}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text>
            {brand.legalName} · {brand.address} · IČO {brand.ico}
          </Text>
          <Text>
            {brand.phone} · {brand.email} · {brand.website}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function downloadQuotePdf(visit: SiteVisit, quote: Quote) {
  const blob = await pdf(
    <QuoteDocument visit={visit} quote={quote} />,
  ).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `NSVS-E-ponuka-${visit.customerName.replace(/\s+/g, "-")}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
  return url;
}
