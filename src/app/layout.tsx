import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Styli — AI Personal Stylist",
  description:
    "Discover clothing that genuinely suits you. AI-powered recommendations based on your body proportions, face shape, and color season.",
  keywords: ["personal stylist", "AI fashion", "wardrobe management", "style recommendations"],
  openGraph: {
    title: "Styli — AI Personal Stylist",
    description: "Dress for the body you have, right now.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="bg-bg-base text-cream antialiased">{children}</body>
    </html>
  );
}
