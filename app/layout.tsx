import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Text } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const dmSerifText = DM_Serif_Text({
  variable: "--font-dm-serif-text",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "Archivum",
    template: "%s | Archivum",
  },
  description: "Archivum — manage and showcase student research projects.",
  applicationName: "Archivum",
  icons: {
    icon: [{ url: "/archivum.svg", type: "image/svg+xml" }],
    shortcut: "/archivum.svg",
    apple: "/archivum.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.className} ${dmSans.variable} ${dmSerifText.variable} bg-snow antialiased`}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
