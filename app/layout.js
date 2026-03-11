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

// export const metadata = {
//   title: "Eid Mubarak",
//   description: "Create and share Eid wishes in a unique way",
// };
export const metadata = {
  title: 'Wisheid',
  description: 'Create and share Eid wishes in a unique way',
  openGraph: {
    title: 'Wisheid',
    description: 'Create and share Eid wishes in a unique way',
    url: 'https://wisheid.vercel.app/',
    siteName: 'Wisheid',
    images: [
      {
        url: 'https://res.cloudinary.com/dliahmplq/image/upload/v1773223749/Gemini_Generated_Image_s8sq21s8sq21s8sq_1_mwmrnk.png', // Ensure this file is in your /public folder
        width: 1200,
        height: 630,
        alt: 'Wisheid Logo Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
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