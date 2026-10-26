"use client";
import Link from "next/link";
import { useCavos } from "@cavos/kit/react";

export default function Demo() {
  const { address, isAuthenticated, openModal, logout } = useCavos();
  return (
    <main>
      <h1>Stellar QuickPass — demo</h1>
      <p>Your AI agent pays APIs on its own, within a monthly USDC cap you sign once.</p>
      {!isAuthenticated ? (
        <p><button onClick={openModal}>Log in with email</button> <small className="sub">(via Cavos, no seed phrase)</small></p>
      ) : (
        <>
          <p>Your Stellar account: <code>{address}</code></p>
          <p><Link className="btn primary" href="/presupuesto">Set the agent budget →</Link></p>
          <p><button className="secondary" onClick={logout}>Log out</button></p>
        </>
      )}
    </main>
  );
}
