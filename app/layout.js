import { Geist, Geist_Mono, Cinzel_Decorative, Lora, Amiri } from "next/font/google";
import "./globals.css";
import LayoutContent from "@/components/LayoutContent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cinzel = Cinzel_Decorative({
  weight: ["400", "700", "900"],
  subsets: ["latin"],
  variable: "--font-cinzel",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
});

const amiri = Amiri({
  weight: ["400", "700"],
  subsets: ["arabic", "latin"],
  variable: "--font-amiri",
});

export const metadata = {
  title: "Eid Mubarak",
  description: "Create and share Eid wishes in a unique way",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} ${lora.variable} ${amiri.variable} antialiased font-lora`}
      >
        <LayoutContent>{children}</LayoutContent>
      </body>
    </html>
  );
}