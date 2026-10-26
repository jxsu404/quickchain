"use client";
// Login con Cavos (correo, sin frase semilla) en Stellar testnet. Docs: https://docs.cavos.xyz/docs/quickstart
import { CavosProvider } from "@cavos/kit/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CavosProvider
      config={{ chains: ["stellar"], defaultChain: "stellar", network: "testnet", appSalt: "quickchain", appId: process.env.NEXT_PUBLIC_CAVOS_APP_ID! }}
      modal={{ appName: "Stellar QuickPass" }}
    >
      {children}
    </CavosProvider>
  );
}
