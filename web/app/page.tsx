"use client";
import Link from "next/link";
import { useCavos } from "@cavos/kit/react";

export default function Inicio() {
  const { address, isAuthenticated, openModal, logout } = useCavos();
  return (
    <main>
      <h1>Stellar QuickPass</h1>
      <p>Tu agente de IA paga APIs solo, con un tope mensual en USDC que vos firmás una vez.</p>
      {!isAuthenticated ? (
        <button onClick={openModal}>Entrar con correo</button>
      ) : (
        <>
          <p>Tu cuenta Stellar: <code>{address}</code></p>
          <Link href="/presupuesto">Definir presupuesto del agente →</Link>
          <p><button onClick={logout}>Salir</button></p>
        </>
      )}
    </main>
  );
}
