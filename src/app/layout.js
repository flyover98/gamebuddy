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

// 🚀 Premium SEO & Social Media Metadata
export const metadata = {
  title: "GameBuddy | Competitive Matchmaking Network",
  description: "Stop rolling the dice with randoms. Find verified players, match your playstyle, and build your ultimate squad on GameBuddy.",
  keywords: ["gaming", "matchmaking", "esports", "lfg", "looking for group", "competitive gaming", "squad finder"],
  openGraph: {
    title: "GameBuddy | Competitive Matchmaking Network",
    description: "Connect with verified players, match your playstyle, and dominate the lobby.",
    type: "website",
    siteName: "GameBuddy",
  },
  twitter: {
    card: "summary_large_image",
    title: "GameBuddy | Squad Up.",
    description: "Find verified players and match your playstyle today.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html 
      lang="en" 
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#050505] text-slate-200 selection:bg-cyan-500/30 selection:text-white scroll-smooth">
        {children}
      </body>
    </html>
  );
}