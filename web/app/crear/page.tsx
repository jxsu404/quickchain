"use client";
// Cualquier usuario Cavos crea SU cuenta-presupuesto con la fábrica (una firma) y sigue en /presupuesto.
import Espera from "../espera";
import { useEffect, useState } from "react";
import { useCavos } from "@cavos/kit/react";
import { StrKey } from "@stellar/stellar-sdk";
import { explicarError, linkContrato, linkTx } from "@/lib/renovar";
import { FABRICA_ID, agenteABytes, argsCrear, listarCuentas } from "@/lib/fabrica";

// La clave del agente demo es compartida: nunca se precarga, solo con casilla explícita (auditoría Flaria, High).
const AGENTE_DEMO_G = "GAST4W4FTREQLLV5X3573CO5PVLNBZ2GQ3LXSHRPL3HGKMVFVPD4SABS"; // AGENTE_DEMO_HEX (lib/fabrica) en formato G…; lo firma el servidor de /demo
const RPC = process.env.NEXT_PUBLIC_STELLAR_RPC_URL || undefined;

export default function Crear() {
  const { isAuthenticated, wallet, address, walletStatus, openModal } = useCavos();
  const [agente, setAgente] = useState("");
  const [usarDemo, setUsarDemo] = useState(false);
  const [cuentas, setCuentas] = useState<string[]>([]);
  const [hash, setHash] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (address) listarCuentas(address, RPC).then(setCuentas).catch(() => {}); }, [address]);

  if (!isAuthenticated || !address) return <main><h2>Create my budget</h2><p>Log in with your email first.</p><button onClick={openModal}>Log in with email</button></main>;
  if (!wallet || wallet.chain !== "stellar") return <p>The connected wallet is not a Stellar wallet.</p>;

  const agenteValido = StrKey.isValidEd25519PublicKey(agente.trim());
  const w = wallet;
  async function crear() {
    if (!agenteValido) { setError("Enter a valid Stellar public key (G…)."); return; }
    setOcupado(true); setError(null);
    try {
      const salt = crypto.getRandomValues(new Uint8Array(32));
      const h = await w.invokeContract({ contractId: FABRICA_ID, method: "crear", args: argsCrear(address!, agenteABytes(agente), salt) });
      setHash(h);
      setCuentas(await listarCuentas(address!, RPC));
    } catch (e) { setError(explicarError(String((e as Error)?.message ?? e))); } finally { setOcupado(false); }
  }

  const ultima = cuentas[cuentas.length - 1];
  return (
    <main>
      <h2>Create my budget</h2>
      <p className="tagline">Your own budget account, owned by your wallet.</p>
      <p>Owner (you): <code>{address}</code></p>
      <label>Agent public key (G…)<br /><input value={agente} placeholder="G…" onChange={(e) => { setAgente(e.target.value); setUsarDemo(false); }} className="direccion" spellCheck={false} /></label>
      <p><label><input type="checkbox" checked={usarDemo} onChange={(e) => { setUsarDemo(e.target.checked); setAgente(e.target.checked ? AGENTE_DEMO_G : ""); }} /> Use the demo agent (testing only)</label></p>
      {usarDemo && <p className="err">Warning: the demo agent&apos;s key is shared. Anyone using /demo can make it spend your top-up up to the cap. Use it only for testing with small amounts.</p>}
      {agente.trim() !== "" && !agenteValido && <p className="err">Not a valid Stellar public key (must start with G…).</p>}
      <p><button disabled={!walletStatus.isReady || ocupado || !agenteValido} onClick={crear}>{ocupado ? "Creating…" : "Create my budget"}</button>{!walletStatus.isReady && <small className="sub"> Your wallet must be ready (see /presupuesto).</small>}</p>
      {ocupado && <Espera texto="Creating your budget account…" />}
      <p><small className="sub">Factory: <a href={linkContrato(FABRICA_ID)} target="_blank" rel="noreferrer"><code>{FABRICA_ID}</code></a></small></p>
      {error && <p className="err">{error}</p>}
      {hash && <p>Transaction: <a href={linkTx(hash)} target="_blank" rel="noreferrer">Stellar Expert</a></p>}
      {ultima && (
        <p>Your budget account: <code>{ultima}</code> · <a href={linkContrato(ultima)} target="_blank" rel="noreferrer">Stellar Expert</a> · <a href={`/presupuesto?contract=${ultima}`}>Use it in /presupuesto →</a></p>
      )}
      {cuentas.length > 1 && <details><summary>All your accounts ({cuentas.length})</summary><ul>{cuentas.map((c) => <li key={c}><a href={`/presupuesto?contract=${c}`}><code>{c}</code></a></li>)}</ul></details>}
    </main>
  );
}
