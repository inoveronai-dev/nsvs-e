import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { StoreHydration } from "@/components/providers/store-hydration";
import { brand } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: `${brand.name} Ops`,
  description:
    "Interný demo systém pre obhliadky, ocenenie, kalendár a financie NSVS-E.",
  applicationName: `${brand.name} Ops`,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0D5C63",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sk" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <StoreHydration>{children}</StoreHydration>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
