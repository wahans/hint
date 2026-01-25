import type { Metadata } from "next";
import { Inter, Leckerli_One } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const leckerliOne = Leckerli_One({
  variable: "--font-logo",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "hint - Gift-Giving, Simplified",
  description: "Create hintlists, share with friends and family, and let them claim gifts secretly. No more duplicate presents. Free Chrome extension.",
  keywords: ["wishlist", "gift list", "hintlist", "gift registry", "chrome extension", "price tracking"],
  openGraph: {
    title: "hint - Gift-Giving, Simplified",
    description: "Create hintlists, share with friends and family, and let them claim gifts secretly. No more duplicate presents.",
    type: "website",
    url: "https://hint.gift",
  },
  twitter: {
    card: "summary_large_image",
    title: "hint - Gift-Giving, Simplified",
    description: "Create hintlists, share with friends and family, and let them claim gifts secretly.",
  },
  metadataBase: new URL("https://hint.gift"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${leckerliOne.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
