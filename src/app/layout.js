import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 🚀 Premium SEO & Brand Metadata
export const metadata = {
  title: "GameBuddy | Competitive Matchmaking Network",
  description: "Stop rolling the dice with randoms. Find verified players, match your playstyle, and build your ultimate squad on GameBuddy.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body 
        className="min-h-full flex flex-col bg-[#050505] text-slate-200" 
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}