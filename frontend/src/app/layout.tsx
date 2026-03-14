import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";

const bebasNeue = Bebas_Neue({ 
  weight: '400',
  subsets: ["latin"],
  variable: '--font-bebas'
});

const dmSans = DM_Sans({ 
  subsets: ["latin"],
  weight: ['300', '400', '500', '700'],
  variable: '--font-dm-sans'
});

const dmMono = DM_Mono({ 
  subsets: ["latin"],
  weight: ['300', '400', '500'],
  variable: '--font-dm-mono'
});

export const metadata: Metadata = {
  title: "DSA Tracker // Grind or Bleed",
  description: "Target: L4/L5 SWE",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${dmSans.variable} ${dmMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}