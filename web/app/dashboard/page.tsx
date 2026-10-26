"use client";
// Dashboard del dueño: cuánto gastó el agente, cuánto le queda y qué bloqueó. Todo sale de la red:
// `estado()` del contrato y eventos de Soroban RPC (lib/historial.ts). Los bloqueos vienen de «Correr agente»
// en este navegador, porque el contrato los rechaza en la simulación y no dejan tx.
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useCavos } from "@cavos/kit/react";
import Copiar from "../copiar";
import Espera from "../espera";
import { explicarError, leerEstado, linkContrato, linkTx, unidadesAUsdc, type Estado } from "@/lib/renovar";
import { leerHistorial, type Historial, type Movimiento } from "@/lib/historial";
import { fechaCR, horaCR, leerBloqueos, nivel, pctGastado, tiempoRestante, type Bloqueo, type Nivel } from "@/lib/tablero";

const RPC = process.env.NEXT_PUBLIC_STELLAR_RPC_URL || undefined;
const usdc = (u: bigint) => `${unidadesAUsdc(BigInt(u)) || "0"} USDC`;
const corto = (s: string) => `${s.slice(0, 8)}…`;
const TEXTO_NIVEL: Record<Nivel, string> = { ok: "Within the cap", cerca: "Near the cap", bloqueo: "Agent blocked", vacio: "No budget yet" };
const ICONO_NIVEL: Record<Nivel, string> = { ok: "●", cerca: "▲", bloqueo: "⛔", vacio: "○" };
const MOTIVO: Record<string, string> = {
  TopeAlcanzado: "Cap reached", MontoPorLlamada: "Over the max per call", Pausada: "Account paused", PeriodoVencido: "Period ended", SaldoInsuficiente: "Not enough balance",
};

function Anillo({ pct, nv }: { pct: number; nv: Nivel }) {
  const r = 42, largo = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" width="210" height="210" aria-hidden="true">
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--line)" strokeWidth="9" />
      {pct > 0 && <circle cx="50" cy="50" r={r} fill="none" className={`qd-arco ${nv}`} strokeWidth="9" strokeLinecap="round"
        strokeDasharray={`${(largo * pct) / 100} ${largo}`} transform="rotate(-90 50 50)" />}
    </svg>
  );
}

function Fila({ m }: { m: Movimiento }) {
  const tx = <a href={linkTx(m.hash)} target="_blank" rel="noreferrer" aria-label={`Transaction ${m.hash} on Stellar Expert`}>{corto(m.hash)} ↗</a>;
  const que =
    m.tipo === "pago" ? <>Agent paid <b className="qd-mono">{usdc(m.monto)}</b> to <code>{corto(m.a)}</code></> :
    m.tipo === "comision" ? <>1 % fee <b className="qd-mono">{usdc(m.monto)}</b> sent to the treasury</> :
    m.tipo === "retiro" ? <>Owner withdrew <b className="qd-mono">{usdc(m.monto)}</b></> :
    m.tipo === "recarga" ? <>Top-up <b className="qd-mono">+{usdc(m.monto)}</b> from <code>{corto(m.de)}</code></> :
    m.tipo === "renovar" ? <>Renewed: period #{m.periodo}, cap <b className="qd-mono">{usdc(m.tope)}</b>, max per call <span className="qd-mono">{usdc(m.maxPorLlamada)}</span></> :
    <>{m.pausada ? "Owner paused the agent" : "Owner resumed the agent"}</>;
  return (
    <li className={`qd-fila ${m.tipo}`}>
      <span className="qd-punto" aria-hidden="true" />
      <span className="qd-que">{que}<br /><small>{horaCR(m.fecha)}</small></span>
      <span className="qd-tx">{tx}</span>
    </li>
  );
}

export default function Dashboard() {
  const { isAuthenticated, wallet, address, walletStatus, openModal } = useCavos();
  const [contrato, setContrato] = useState("");
  const [estado, setEstado] = useState<Estado | null>(null);
  const [hist, setHist] = useState<Historial | null>(null);
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [cargando, setCargando] = useState(false);
  const [errEstado, setErrEstado] = useState<string | null>(null);
  const [errHist, setErrHist] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [errAccion, setErrAccion] = useState<string | null>(null);
  const [txAccion, setTxAccion] = useState<{ que: string; hash: string } | null>(null);
  const [ahora, setAhora] = useState(() => Math.floor(Date.now() / 1000));

  // ?contract=C… (desde /presupuesto o /demo); si no, la cuenta demo del botón «Correr agente» o la de la env.
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("contract");
    if (c) { setContrato(c); return; }
    fetch("/api/agente/correr").then((r) => r.json()).then((d) => setContrato(d.contratoDemo || process.env.NEXT_PUBLIC_BUDGET_CONTRACT_ID || ""))
      .catch(() => setContrato(process.env.NEXT_PUBLIC_BUDGET_CONTRACT_ID ?? ""));
  }, []);
  useEffect(() => { const t = setInterval(() => setAhora(Math.floor(Date.now() / 1000)), 60_000); return () => clearInterval(t); }, []);

  const cargar = useCallback(async (c: string) => {
    if (!c) return;
    setCargando(true); setErrEstado(null); setErrHist(null);
    setBloqueos(leerBloqueos(c));
    try {
      const e = await leerEstado(c, RPC);
      setEstado(e);
      try { setHist(await leerHistorial(c, e.tesoreria, RPC)); } catch (err) { setHist(null); setErrHist(explicarError(String((err as Error)?.message ?? err))); }
    } catch (err) {
      setEstado(null); setHist(null); setErrEstado(explicarError(String((err as Error)?.message ?? err)));
    } finally { setCargando(false); }
  }, []);
  useEffect(() => { void cargar(contrato.trim()); }, [contrato, cargar]);

  const c = contrato.trim();
  const esDuenio = !!estado && !!address && estado.owner === address;
  const bloqueosPeriodo = estado ? bloqueos.filter((b) => b.periodo === Number(estado.periodo)) : [];
  const nv = estado ? nivel(estado, bloqueosPeriodo.length > 0, ahora) : "vacio";
  const pct = estado ? pctGastado(estado) : 0;
  const resta = estado ? tiempoRestante(estado.fin_periodo, ahora) : null;
  // Pagos del periodo actual: los que vienen después del último `renovar` visible en el RPC.
  const ultimoRenovar = hist?.movimientos.find((m) => m.tipo === "renovar");
  const pagosPeriodo = hist?.movimientos.filter((m) => m.tipo === "pago" && (!ultimoRenovar || m.ledger >= ultimoRenovar.ledger)) ?? [];
  const saldoLibre = estado ? BigInt(estado.saldo) - BigInt(estado.comision_pendiente) : 0n;

  const pausarOReanudar = (metodo: "pausar" | "reanudar") => async () => {
    if (!wallet || wallet.chain !== "stellar") return;
    setOcupado(metodo === "pausar" ? "Pausing the agent with Cavos…" : "Resuming the agent with Cavos…"); setErrAccion(null); setTxAccion(null);
    try {
      const hash = await wallet.invokeContract({ contractId: c, method: metodo, args: [] });
      setTxAccion({ que: metodo === "pausar" ? "Paused" : "Resumed", hash });
      await cargar(c);
    } catch (err) { setErrAccion(explicarError(String((err as Error)?.message ?? err))); } finally { setOcupado(null); }
  };

  return (
    <main className="qd">
      <h1>Your agent this period</h1>
      <p className="tagline">Your agent pays. You set the cap.</p>

      <label>Budget account (C…)<br /><input value={contrato} onChange={(e) => setContrato(e.target.value)} className="direccion" spellCheck={false} /></label> <Copiar texto={c} />
      {c && <small className="sub"> <a href={linkContrato(c)} target="_blank" rel="noreferrer">Stellar Expert ↗</a></small>}

      {!c && <p className="qd-vacio">Paste a budget account (C…) or <Link href="/crear">create one</Link>.</p>}
      {cargando && !estado && <div className="qd-esqueleto" role="status" aria-live="polite"><span className="sr">Reading the contract on Stellar testnet…</span></div>}
      {errEstado && (
        <div className="qd-error" role="alert">
          <p><b>Could not read this budget account.</b> {errEstado}</p>
          <button className="secondary" onClick={() => cargar(c)}>Try again</button>
        </div>
      )}

      {estado && (
        <>
          <section className="qd-hero" aria-labelledby="qd-uso">
            <div className="qd-anillo">
              <Anillo pct={pct} nv={nv} />
              <div className="qd-centro">
                <div className="qd-pct" id="qd-uso">{nv === "vacio" ? "—" : `${Math.round(pct)} %`}</div>
                <div className="qd-mono qd-de">{unidadesAUsdc(BigInt(estado.gastado)) || "0"} / {usdc(estado.tope)}</div>
                <div className={`qd-chip ${nv}`}>{ICONO_NIVEL[nv]} {estado.pausada ? "Paused" : nv === "bloqueo" && resta === null ? "Period ended" : TEXTO_NIVEL[nv]}</div>
              </div>
            </div>
            <p className="qd-resumen">
              {nv === "vacio" ? <>No budget yet: the owner has to sign the first renewal.</> :
                <>Remaining <b className="qd-mono">{usdc(estado.restante)}</b> · {resta ? <>resets in <b>{resta}</b></> : <>period ended</>}</>}
            </p>
            <p className="qd-fuente">Spent includes the 1 % fee. Source: contract <code>estado()</code> read live from Stellar testnet.</p>
            {nv !== "vacio" && saldoLibre < BigInt(estado.restante) && (
              <p className="qd-aviso-saldo">▲ The account balance ({usdc(saldoLibre)} after the pending fee) is below the remaining budget: the agent will hit <i>not enough balance</i> first. Top up to use the full cap.</p>
            )}
          </section>

          <section className="qd-acciones" aria-label="Quick actions">
            <Link className="btn primary qd-full" href={`/presupuesto?contract=${encodeURIComponent(c)}`}>Renew / top up →</Link>
            {esDuenio ? (
              estado.pausada
                ? <button className="secondary" disabled={!!ocupado || !walletStatus.isReady} onClick={pausarOReanudar("reanudar")}>▶ Resume agent</button>
                : <button className="secondary" disabled={!!ocupado || !walletStatus.isReady} onClick={pausarOReanudar("pausar")}>⏸ Pause agent</button>
            ) : (
              isAuthenticated
                ? <button className="secondary" disabled>⏸ Pause agent</button>
                : <button className="secondary" onClick={openModal}>Log in to pause</button>
            )}
            <Link className="btn qd-sec" href={`/demo?contract=${encodeURIComponent(c)}`}>▶ Run demo agent</Link>
          </section>
          {!esDuenio && <p className="qd-nota">{isAuthenticated ? <>Only the owner (<code>{corto(estado.owner)}</code>) can pause. You are logged in as <code>{address ? corto(address) : "—"}</code>.</> : <>Log in with email (Cavos) as the owner to pause or resume.</>}</p>}
          {ocupado && <Espera texto={ocupado} />}
          {errAccion && <p className="err" role="alert">Error: {errAccion}</p>}
          {txAccion && <p>{txAccion.que}: <a href={linkTx(txAccion.hash)} target="_blank" rel="noreferrer">{corto(txAccion.hash)} on Stellar Expert ↗</a></p>}

          <section className="qd-tarjetas" aria-label="Budget details">
            <div className="qd-tarjeta"><div className="qd-lbl">Balance</div><div className="qd-val">{usdc(estado.saldo)}</div></div>
            <div className="qd-tarjeta"><div className="qd-lbl">Max per call</div><div className="qd-val">{usdc(estado.max_por_llamada)}</div></div>
            <div className="qd-tarjeta"><div className="qd-lbl">Pending fee (1 %)</div><div className="qd-val">{usdc(estado.comision_pendiente)}</div></div>
            <div className="qd-tarjeta"><div className="qd-lbl">Period #{Number(estado.periodo)}</div><div className="qd-val qd-chico">{Number(estado.fin_periodo) ? `ends ${fechaCR(estado.fin_periodo)}` : "not started"}</div></div>
          </section>

          <section aria-labelledby="qd-bloq">
            <h2 id="qd-bloq">Blocked attempts</h2>
            {bloqueosPeriodo.length ? (
              <ul className="qd-lista">
                {bloqueosPeriodo.map((b) => (
                  <li key={b.fecha} className="qd-fila bloqueado">
                    <span className="qd-punto" aria-hidden="true" />
                    <span className="qd-que"><b>⛔ Blocked: {MOTIVO[b.motivo] ?? b.motivo}</b> (<code>{b.motivo}</code>) · call {b.n}<br /><small>{horaCR(b.fecha)} · rejected in simulation: no transaction, no money moved</small></span>
                    <span className="qd-tx">no tx</span>
                  </li>
                ))}
              </ul>
            ) : <p className="qd-vacio">No blocked attempts recorded in this browser for this period.</p>}
            <p className="qd-fuente">The contract rejects these payments before they reach the network, so they are not on-chain. This list only shows what «Run demo agent» saw in this browser tab.</p>
          </section>

          <section aria-labelledby="qd-pagos">
            <h2 id="qd-pagos">Payments this period</h2>
            {errHist && <div className="qd-error" role="alert"><p>Could not read the history: {errHist}</p><button className="secondary" onClick={() => cargar(c)}>Try again</button></div>}
            {!hist && !errHist && <div className="qd-esqueleto chico" role="status"><span className="sr">Reading events…</span></div>}
            {hist && (pagosPeriodo.length
              ? <ul className="qd-lista">{pagosPeriodo.map((m) => <Fila key={`${m.hash}-${m.tipo}`} m={m} />)}</ul>
              : <p className="qd-vacio">No agent payments in this period yet{ultimoRenovar ? "" : " (in the last ~7 days the RPC keeps)"}.</p>)}
            {hist && hist.movimientos.length > 0 && (
              <details className="qd-todo">
                <summary>All activity ({hist.movimientos.length})</summary>
                <ul className="qd-lista">{hist.movimientos.map((m, i) => <Fila key={`${m.hash}-${m.tipo}-${i}`} m={m} />)}</ul>
              </details>
            )}
            <p className="qd-fuente">Source: Soroban RPC events (USDC <code>transfer</code>, contract <code>renovar</code>/<code>pausa</code>){hist?.desdeFecha ? `, since ${horaCR(hist.desdeFecha)}` : ""}. The RPC keeps about 7 days; older payments are on Stellar Expert.</p>
          </section>
          <p><button className="secondary" disabled={cargando} onClick={() => cargar(c)}>{cargando ? "Refreshing…" : "↻ Refresh"}</button></p>
        </>
      )}
    </main>
  );
}
