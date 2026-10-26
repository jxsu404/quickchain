import { Providers } from "./providers";

export const metadata = { title: "Stellar QuickPass", description: "Presupuesto mensual en USDC para tu agente de IA" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ fontFamily: "system-ui", maxWidth: 640, margin: "2rem auto", padding: "0 1rem" }}>
        <Providers>{children}</Providers>
        <footer style={{ marginTop: 48, fontSize: 12, color: "#666" }}>
          Demo en Stellar testnet. Stellar QuickPass no es una inversión ni un producto de ahorro; sirve para controlar gastos de un agente.
        </footer>
      </body>
    </html>
  );
}
