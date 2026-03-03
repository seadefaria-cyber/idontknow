import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "Riddle Management",
  description: "Artist management by Nolan Riddle. Director, producer, and manager working with the next generation of culture.",
  keywords: ["artist management", "music management", "Nolan Riddle", "Riddle Management", "music industry"],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${inter.variable} antialiased`}>
          <Nav />
          <main>{children}</main>
      </body>
    </html>
  );
}
