import "./globals.css";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Providers } from "./providers";

const ESLOGAN = "Your agent pays. You set the cap.";
export const metadata = {
  metadataBase: new URL("https://stellar-quickpass.vercel.app"),
  title: "Stellar QuickPass",
  description: ESLOGAN,
  openGraph: {
    title: "Stellar QuickPass", description: ESLOGAN, url: "https://stellar-quickpass.vercel.app", type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Stellar QuickPass — Your agent pays. You set the cap." }],
  },
  twitter: { card: "summary_large_image", title: "Stellar QuickPass", description: ESLOGAN, images: ["/og.png"] },
};

const inter = Inter({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-inter" });
const grotesk = Space_Grotesk({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-grotesk" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-mono" });

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${grotesk.variable} ${mono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
