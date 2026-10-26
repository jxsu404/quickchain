import "./globals.css";
import { Providers } from "./providers";

export const metadata = { title: "Stellar QuickPass", description: "Your AI agent pays for APIs automatically, never past your cap." };

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
