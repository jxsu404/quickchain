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

  if (!isAuthenticated || !address) return <main><h2>Presupuesto mensual del agente</h2><p>Primero entrá con tu correo.</p><button onClick={openModal}>Entrar con correo</button></main>;
  if (!wallet || wallet.chain !== "stellar") return <p>La wallet conectada no es de Stellar.</p>;
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

  const revisar = () => correr("Leyendo la cuenta-presupuesto…", async () => {
    const e = await leerEstado(contrato.trim(), RPC);
    setEstado(e);
    setProblemas(problemasAntesDeFirmar(e, address, TESORERIA));
  });

  // Cavos crea la cuenta en la primera operación (patrocinada). El pago de 1 stroop a sí misma puede fallar
  // por saldo 0, pero la cuenta queda creada y en `ready`.
  const crearCuenta = () => correr("Creando tu cuenta en testnet…", async () => {
    try { await wallet.execute(1n, address, opts); } catch (e) { if (wallet.status !== "ready") throw e; }
  });

  const trustline = () => correr("Abriendo trustline USDC…", async () => {
    const hash = await wallet.addTrustline(USDC, opts);
    setTxs((t) => [...t, { que: "trustline USDC", hash }]);
    setSaldoUsdc(await wallet.tokenBalance(USDC));
  });

  const verSaldo = () => correr("Leyendo tu saldo USDC…", async () => {
    setSaldoUsdc(await wallet.tokenBalance(USDC));
  });

  const firmar = () => correr("Firmando renovar con Cavos…", async () => {
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
      <h2>Presupuesto mensual del agente</h2>
      <p>Tu cuenta: <code>{address}</code> ({walletStatus.isReady ? "lista" : walletStatus.isUndeployed ? "todavía no existe en la red" : "este dispositivo necesita aprobación"})</p>

      {walletStatus.isUndeployed && (
        <p>Cavos crea tu cuenta en la primera operación. <button disabled={!!ocupado} onClick={crearCuenta}>Crear mi cuenta en testnet</button></p>
      )}
      <p>Estado Cavos: <code>{wallet.status}</code></p>
      {walletStatus.needsDeviceApproval && (
        <p style={{ color: "crimson" }}>
          La llave de esta wallet quedó en otro navegador o en otra URL (cada URL de vercel.app guarda la suya). Abrí la página donde entraste la primera vez, tocá «Agregar passkey» y volvé acá a tocar:{" "}
          <button disabled={!!ocupado} onClick={() => correr("Aprobando con passkey…", async () => { await approveDeviceWithPasskey(); })}>Aprobar este dispositivo con passkey</button>
        </p>
      )}
      {walletStatus.isReady && (
        <p><button disabled={!!ocupado} onClick={() => correr("Agregando passkey…", async () => { await enrollPasskeyDefault(); })}>Agregar passkey (para usar la wallet en otra URL o dispositivo)</button></p>
      )}

      <label>Cuenta-presupuesto (C…)<br /><input value={contrato} onChange={(e) => { setContrato(e.target.value); setEstado(null); }} size={60} /></label>
      <p><button disabled={!contrato.trim() || !!ocupado} onClick={revisar}>Revisar cuenta</button></p>

      {estado && (
        <ul>
          <li>Contrato: <a href={linkContrato(contrato.trim())} target="_blank" rel="noreferrer">Stellar Expert</a></li>
          <li>Dueño: <code>{estado.owner}</code></li>
          <li>Tesorería: <code>{estado.tesoreria}</code> · comisión {Number(estado.fee_bps) / 100} %</li>
          <li>Periodo {estado.periodo}: gastado {unidadesAUsdc(estado.gastado)} de {unidadesAUsdc(estado.tope)} USDC (restante {unidadesAUsdc(estado.restante)}); vence {estado.fin_periodo ? fechaCR(estado.fin_periodo) : "—"}{estado.pausada ? " · PAUSADA" : ""}</li>
          <li>Saldo de la cuenta: {unidadesAUsdc(estado.saldo)} USDC · comisión pendiente {unidadesAUsdc(estado.comision_pendiente)}</li>
        </ul>
      )}
      {problemas.map((p) => <p key={p} style={{ color: "crimson" }}>{p}</p>)}

      <label>Tope del periodo (USDC, incluye la comisión de 1 %)<br /><input value={tope} onChange={(e) => setTope(e.target.value)} /></label><br />
      <label>Máximo por llamada (USDC)<br /><input value={max} onChange={(e) => setMax(e.target.value)} /></label><br />
      <label>Recarga desde tu cuenta (USDC; necesita trustline y saldo, 0 = no mover plata)<br /><input value={recarga} onChange={(e) => setRecarga(e.target.value)} /></label>
      <p>Vence: {fechaCR(finPeriodo)} (1.º del mes que viene, hora CR).</p>
      <p><label><input type="checkbox" checked={feePropio} onChange={(e) => setFeePropio(e.target.checked)} /> Mi cuenta paga el fee (sin patrocinio de Cavos; necesita XLM)</label></p>
      {invalido && <p style={{ color: "crimson" }}>{invalido}</p>}

      <p>
        <button disabled={!walletStatus.isReady || !!ocupado} onClick={trustline}>Activar USDC</button>{" "}
        <button disabled={!walletStatus.isReady || !!ocupado} onClick={verSaldo}>Ver saldo USDC</button>{" "}
        Tu saldo: {saldoUsdc ?? "—"} USDC · USDC de prueba: <a href="https://faucet.circle.com" target="_blank" rel="noreferrer">faucet.circle.com</a> (Stellar Testnet, pegá tu dirección)
      </p>
      <p>
        <button disabled={!listo} onClick={firmar}>Firmar renovar (una firma)</button>
      </p>
      <p>Comisión Stellar QuickPass: 1 % de lo que gaste el agente, incluida en el tope. Sin mensualidad.</p>

      {ocupado && <p>{ocupado}</p>}
      {error && <p style={{ color: "crimson" }}>Error: {error}</p>}
      {txs.map((t) => (
        <p key={t.hash}>{t.que}: <a href={linkTx(t.hash)} target="_blank" rel="noreferrer">{t.hash.slice(0, 8)}… en Stellar Expert</a></p>
      ))}
    </main>
  );
}
