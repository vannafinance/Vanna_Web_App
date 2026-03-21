import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { navbarItems } from "@/lib/constants";
import { ThemeProvider } from "@/contexts/theme-context";
import { Providers } from '../Provider/wagmi-provider'
import { Toaster } from "@/components/ui/toaster";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-plus-jakarta-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: {
    default: "Vanna Protocol",
    template: "%s | Vanna",
  },
  description:
    "Vanna is your DeFi terminal: margin, leverage, earn, farm, and trade with a unified view of health, collateral, and positions.",
  applicationName: "Vanna",
  keywords: [
    "Vanna",
    "DeFi",
    "margin trading",
    "leverage",
    "crypto",
    "collateral",
  ],
  openGraph: {
    title: "Vanna — Margin & DeFi",
    description:
      "Trade on margin and manage collateral across strategies in one place.",
    type: "website",
    siteName: "Vanna",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vanna — Margin & DeFi",
    description:
      "Trade on margin and manage collateral across strategies in one place.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${plusJakartaSans.variable} antialiased`}
        style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}
      >
        <Providers>
          <ThemeProvider>
            <Navbar items={navbarItems} />
            <Toaster/>
            {children}
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
