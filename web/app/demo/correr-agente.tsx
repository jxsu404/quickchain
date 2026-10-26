"use client";
// Botón «Correr agente»: el agente (servidor) paga la API x402 desde la cuenta-presupuesto hasta que el
// contrato lo bloquea al llegar al tope. Lee el NDJSON de /api/agente/correr en streaming.
import { useEffect, useState } from "react";
import Copiar from "../copiar";
import { linkContrato, unidadesAUsdc } from "@/lib/renovar";

type Resumen = { tope: string; gastado: string; restante: string; saldo: string; maxPorLlamada: string };
type Evento =
  | { tipo: "inicio"; contrato: string; agente: string; estado: Resumen }
  | { tipo: "llamando"; n: number }
  | { tipo: "pago"; n: number; monto: string; tx: string; link: string | null; estado: Resumen }
  | { tipo: "bloqueado"; n: number; motivo: string; mensaje: string; estado: Resumen }
  | { tipo: "error"; motivo: string; mensaje: string }
  | { tipo: "fin"; mensaje: string };

const usdc = (u: string) => unidadesAUsdc(BigInt(u || "0")) || "0";

export default function CorrerAgente() {
  const [contrato, setContrato] = useState("");
  const [demo, setDemo] = useState<string | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [corriendo, setCorriendo] = useState(false);
  const [seg, setSeg] = useState(0);
  const [reinicio, setReinicio] = useState<string | null>(null);

  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("contract");
    fetch("/api/agente/correr").then((r) => r.json()).then((d) => { setDemo(d.contratoDemo); if (!c && d.contratoDemo) setContrato(d.contratoDemo); }).catch(() => {});
    if (c) setContrato(c);
  }, []);
  useEffect(() => {
    if (!corriendo) return;
    setSeg(0);
    const t = setInterval(() => setSeg((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [corriendo]);

  async function correr() {
    setEventos([]); setCorriendo(true); setReinicio(null);
    try {
      const r = await fetch(`/api/agente/correr?contract=${encodeURIComponent(contrato.trim())}`, { method: "POST" });
      if (!r.ok || !r.body) { const d = await r.json().catch(() => ({})); setEventos([{ tipo: "error", motivo: "Error", mensaje: d.error ?? `HTTP ${r.status}` }]); return; }
      const lector = r.body.pipeThrough(new TextDecoderStream()).getReader();
      let resto = "";
      for (;;) {
        const { value, done } = await lector.read();
        if (done) break;
        resto += value;
        const lineas = resto.split("\n"); resto = lineas.pop() ?? "";
        for (const l of lineas) if (l.trim()) setEventos((ev) => [...ev, JSON.parse(l)]);
      }
    } catch (e) {
      setEventos((ev) => [...ev, { tipo: "error", motivo: "Error", mensaje: String((e as Error).message) }]);
    } finally { setCorriendo(false); }
  }

  async function reiniciar() {
    setReinicio("Renovando la cuenta demo (firma del dueño de testnet)…");
    const d = await fetch("/api/agente/reiniciar", { method: "POST" }).then((r) => r.json()).catch((e) => ({ error: String(e) }));
    setReinicio(d.ok ? `Renovada: ` + d.link : `No se pudo: ${d.error}`);
    setEventos([]);
  }

  const ultimoEstado = [...eventos].reverse().find((e): e is Extract<Evento, { estado: Resumen }> => "estado" in e)?.estado;
  const pagos = eventos.filter((e): e is Extract<Evento, { tipo: "pago" }> => e.tipo === "pago");
  // El RPC puede devolver el estado previo justo después de un pago (QA ronda 2, bug 2: el pago 3 repetía
  // el «remaining» del 2). Si el valor leído no bajó, se deriva: anterior − lo cobrado (monto + 1 % fee).
  const inicio = eventos.find((e): e is Extract<Evento, { tipo: "inicio" }> => e.tipo === "inicio");
  const restantes: bigint[] = [];
  {
    let prev = inicio ? BigInt(inicio.estado.restante) : null;
    for (const p of pagos) {
      const leido = BigInt(p.estado.restante || "0");
      const cobro = BigInt(p.monto || "0") + (BigInt(p.monto || "0") + 99n) / 100n;
      const r = prev !== null && leido >= prev ? (prev > cobro ? prev - cobro : 0n) : leido;
      restantes.push(r); prev = r;
    }
  }
  const final = eventos.find((e) => e.tipo === "bloqueado" || e.tipo === "error" || e.tipo === "fin");
  const llamando = corriendo ? [...eventos].reverse().find((e) => e.tipo === "llamando" || e.tipo === "pago") : undefined;

  return (
    <section style={{ marginTop: "2rem" }}>
      <h2>Watch the agent pay (testnet)</h2>
      <p className="sub">The AI agent calls a paid x402 API (US$0.01 per call, USDC). Each call is paid from the budget contract, signed only by the agent&apos;s key. When the on-chain cap is reached, the contract rejects the payment.</p>
      <label>Budget account (C…)<br /><input value={contrato} onChange={(e) => setContrato(e.target.value)} className="direccion" spellCheck={false} disabled={corriendo} /></label> <Copiar texto={contrato.trim()} />
      {contrato && <small className="sub"> <a href={linkContrato(contrato.trim())} target="_blank" rel="noreferrer">Stellar Expert ↗</a></small>}
      <p>
        <button className="primary" disabled={corriendo || !contrato.trim()} onClick={correr}>{corriendo ? "Corriendo…" : "Correr agente"}</button>{" "}
        {demo && contrato.trim() === demo && <button className="secondary" disabled={corriendo || reinicio?.endsWith("…")} onClick={reiniciar}>Reset demo budget</button>}
      </p>
      {corriendo && <p>⏳ {llamando?.tipo === "pago" ? `Payment ${llamando.n} settled, calling again…` : llamando ? `Call ${llamando.n}: signing and settling on Stellar…` : "Reading the contract…"} ({seg} s — each payment takes ~5–15 s)</p>}
      {reinicio && <p className="sub">{reinicio.startsWith("Renovada: ") ? <>Renewed: <a href={reinicio.slice(10)} target="_blank" rel="noreferrer">tx ↗</a></> : reinicio}</p>}
      {ultimoEstado && (
        <p><strong>Remaining budget: {usdc(ultimoEstado.restante)} USDC</strong> of {usdc(ultimoEstado.tope)} cap · spent {usdc(ultimoEstado.gastado)} (incl. 1 % fee) · max per call {usdc(ultimoEstado.maxPorLlamada)}</p>
      )}
      {pagos.length > 0 && (
        <ol>
          {pagos.map((p, i) => (
            <li key={p.n}>✅ Paid {usdc(p.monto)} USDC {p.link && <a href={p.link} target="_blank" rel="noreferrer">tx {p.tx.slice(0, 8)}… ↗</a>} — remaining {usdc(restantes[i].toString())} USDC</li>
          ))}
        </ol>
      )}
      {final?.tipo === "bloqueado" && (
        <p style={{ padding: "0.75rem", border: "2px solid #c0392b", borderRadius: 8 }}>
          <strong>⛔ {final.motivo === "TopeAlcanzado" ? "Bloqueado: llegó al límite" : `Bloqueado: ${final.motivo}`}</strong><br />
          <small>Call {final.n} was rejected by the contract during simulation: no transaction was sent and no money moved.</small>
        </p>
      )}
      {final?.tipo === "error" && <p className="error">⚠️ {final.mensaje}</p>}
      {final?.tipo === "fin" && <p>{final.mensaje}</p>}
    </section>
  );
}
