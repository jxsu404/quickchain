"use client";
// Q4: el dueño firma `renovar` de su cuenta-presupuesto con la wallet Cavos (una firma por mes).
import { useState } from "react";
import { useCavos } from "@cavos/kit/react";
import {
  USDC, argsRenovar, explicarError, finDeMesCR, leerEstado, linkContrato, linkTx, problemasAntesDeFirmar,
  simularRenovar, unidadesAUsdc, usdcAUnidades, validarRenovar, type Estado, type ParamsRenovar,
} from "@/lib/renovar";

const RPC = process.env.NEXT_PUBLIC_STELLAR_RPC_URL || undefined;
const TESORERIA = process.env.NEXT_PUBLIC_QUICKCHAIN_TESORERIA || undefined;
const fechaCR = (seg: bigint) => new Date(Number(seg) * 1000).toLocaleString("es-CR", { timeZone: "America/Costa_Rica" });

export default function Presupuesto() {
  const { isAuthenticated, wallet, address, walletStatus, enrollPasskeyDefault, approveDeviceWithPasskey, openModal } = useCavos();
  const [contrato, setContrato] = useState(process.env.NEXT_PUBLIC_BUDGET_CONTRACT_ID ?? "");
  const [tope, setTope] = useState("0.05");
  const [max, setMax] = useState("0.02");
  const [recarga, setRecarga] = useState("0.05");
  const [feePropio, setFeePropio] = useState(false);
  const [estado, setEstado] = useState<Estado | null>(null);
  const [problemas, setProblemas] = useState<string[]>([]);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txs, setTxs] = useState<{ que: string; hash: string }[]>([]);
  const [saldoUsdc, setSaldoUsdc] = useState<string | null>(null);
  const finPeriodo = finDeMesCR();

  if (!isAuthenticated || !address) return <main><h2>Agent monthly budget</h2><p className="tagline">Your agent pays. You set the cap.</p><p>Log in with your email first.</p><button onClick={openModal}>Log in with email</button> <small className="sub">(via Cavos, no seed phrase)</small></main>;
  if (!wallet || wallet.chain !== "stellar") return <p>The connected wallet is not a Stellar wallet.</p>;
  const opts = feePropio ? { fee: "self" as const } : undefined;

  async function correr(que: string, f: () => Promise<void>) {
    setOcupado(que); setError(null);
    try { await f(); } catch (e) { setError(explicarError(String((e as Error)?.message ?? e))); } finally { setOcupado(null); }
  }

  let params: ParamsRenovar | null = null;
  let invalido: string | null = null;
  try {
    params = { tope: usdcAUnidades(tope), maxPorLlamada: usdcAUnidades(max), finPeriodo, recarga: usdcAUnidades(recarga) };
    invalido = validarRenovar(params);
  } catch (e) { invalido = (e as Error).message; }

  const revisar = () => correr("Reading the budget account…", async () => {
    const e = await leerEstado(contrato.trim(), RPC);
    setEstado(e);
    setProblemas(problemasAntesDeFirmar(e, address, TESORERIA));
  });

  // Cavos crea la cuenta en la primera operación (patrocinada). El pago de 1 stroop a sí misma puede fallar
  // por saldo 0, pero la cuenta queda creada y en `ready`.
  const crearCuenta = () => correr("Creating your testnet account…", async () => {
    try { await wallet.execute(1n, address, opts); } catch (e) { if (wallet.status !== "ready") throw e; }
  });

  const trustline = () => correr("Opening USDC trustline…", async () => {
    const hash = await wallet.addTrustline(USDC, opts);
    setTxs((t) => [...t, { que: "trustline USDC", hash }]);
    setSaldoUsdc(await wallet.tokenBalance(USDC));
  });

  const verSaldo = () => correr("Reading your USDC balance…", async () => {
    setSaldoUsdc(await wallet.tokenBalance(USDC));
  });

  const firmar = () => correr("Signing renovar with Cavos…", async () => {
    if (!params) return;
    await simularRenovar(contrato.trim(), address, params, RPC);
    const hash = await wallet.invokeContract({ contractId: contrato.trim(), method: "renovar", args: argsRenovar(params), opts });
    setTxs((t) => [...t, { que: "renovar", hash }]);
    const e = await leerEstado(contrato.trim(), RPC);
    setEstado(e);
  });

  const listo = walletStatus.isReady && !!estado && !problemas.length && !invalido && !ocupado;

  return (
    <main>
      <h2>Agent monthly budget</h2>
      <p className="tagline">Your agent pays. You set the cap.</p>
      <p>Your account: <code>{address}</code> ({walletStatus.isReady ? "ready" : walletStatus.isUndeployed ? "not on the network yet" : "this device needs approval"})</p>

      {walletStatus.isUndeployed && (
        <p>Cavos creates your account on the first operation. <button disabled={!!ocupado} onClick={crearCuenta}>Create my testnet account</button></p>
      )}
      <p>Cavos status: <code>{wallet.status}</code></p>
      {walletStatus.needsDeviceApproval && (
        <p className="err">
          This wallet key lives in another browser or URL (each vercel.app URL keeps its own). Open the page where you first logged in, tap “Add passkey”, then come back and tap:{" "}
          <button disabled={!!ocupado} onClick={() => correr("Approving with passkey…", async () => { await approveDeviceWithPasskey(); })}>Approve this device with passkey</button>
        </p>
      )}
      {walletStatus.isReady && (
        <p><button disabled={!!ocupado} onClick={() => correr("Adding passkey…", async () => { await enrollPasskeyDefault(); })}>Add passkey (to use the wallet on another URL or device)</button></p>
      )}

      <label>Budget account (C…)<br /><input value={contrato} onChange={(e) => { setContrato(e.target.value); setEstado(null); }} size={60} /></label>
      <p><button disabled={!contrato.trim() || !!ocupado} onClick={revisar}>Check account</button></p>

      {estado && (
        <ul>
          <li>Contract: <a href={linkContrato(contrato.trim())} target="_blank" rel="noreferrer">Stellar Expert</a></li>
          <li>Owner: <code>{estado.owner}</code></li>
          <li>Treasury: <code>{estado.tesoreria}</code> · fee {Number(estado.fee_bps) / 100} %</li>
          <li>Period {estado.periodo}: spent {unidadesAUsdc(estado.gastado)} of {unidadesAUsdc(estado.tope)} USDC (left {unidadesAUsdc(estado.restante)}); ends {estado.fin_periodo ? fechaCR(estado.fin_periodo) : "—"}{estado.pausada ? " · PAUSED" : ""}</li>
          <li>Account balance: {unidadesAUsdc(estado.saldo)} USDC · pending fee {unidadesAUsdc(estado.comision_pendiente)}</li>
        </ul>
      )}
      {problemas.map((p) => <p key={p} className="err">{p}</p>)}

      <label>Period cap (USDC, includes the 1% fee)<br /><input value={tope} onChange={(e) => setTope(e.target.value)} /></label><br />
      <label>Max per call (USDC)<br /><input value={max} onChange={(e) => setMax(e.target.value)} /></label><br />
      <label>Top-up from your account (USDC; needs trustline and balance, 0 = move no funds)<br /><input value={recarga} onChange={(e) => setRecarga(e.target.value)} /></label>
      <p>Ends: {fechaCR(finPeriodo)} (1st of next month, Costa Rica time).</p>
      <p><label><input type="checkbox" checked={feePropio} onChange={(e) => setFeePropio(e.target.checked)} /> My account pays the network fee (no Cavos sponsorship; needs XLM)</label></p>
      {invalido && <p className="err">{invalido}</p>}

      <p>
        <button disabled={!walletStatus.isReady || !!ocupado} onClick={trustline}>Enable USDC</button>{" "}
        <button disabled={!walletStatus.isReady || !!ocupado} onClick={verSaldo}>Check USDC balance</button>{" "}
        Your balance: {saldoUsdc ?? "—"} USDC · Test USDC: <a href="https://faucet.circle.com" target="_blank" rel="noreferrer">faucet.circle.com</a> (Stellar Testnet, paste your address)
      </p>
      <p>
        <button disabled={!listo} onClick={firmar}>Sign renovar (one signature)</button>
      </p>
      <p>Stellar QuickPass fee: 1% of what the agent spends, included in the cap. No monthly fee.</p>

      {ocupado && <p>{ocupado}</p>}
      {error && <p className="err">Error: {error}</p>}
      {txs.map((t) => (
        <p key={t.hash}>{t.que}: <a href={linkTx(t.hash)} target="_blank" rel="noreferrer">{t.hash.slice(0, 8)}… on Stellar Expert</a></p>
      ))}
    </main>
  );
}
