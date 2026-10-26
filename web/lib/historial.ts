// Historial real de una cuenta-presupuesto, leído de eventos de Soroban RPC (nada inventado):
// - del contrato: `renovar` (topic ["renovar", periodo], valor [tope, max, fin, recarga]) y `pausa` (valor bool);
// - del SAC de USDC: `transfer` desde la C… (pagos del agente, comisión a la tesorería, retiros) y hacia la C… (recargas).
// `__check_auth` no emite eventos y los pagos bloqueados se cortan en la simulación (sin tx), así que no aparecen acá.
// El RPC guarda ~7 días (ledgerRetentionWindow) y cada llamada a getEvents recorre ~10 000 ledgers: se pagina con cursor.
import { Address, nativeToScVal, rpc, scValToNative, xdr } from "@stellar/stellar-sdk";
import { RPC_TESTNET, USDC_SAC } from "./renovar";

export type Movimiento =
  | { tipo: "pago"; hash: string; ledger: number; fecha: string; a: string; monto: bigint }
  | { tipo: "comision"; hash: string; ledger: number; fecha: string; a: string; monto: bigint }
  | { tipo: "retiro"; hash: string; ledger: number; fecha: string; a: string; monto: bigint }
  | { tipo: "recarga"; hash: string; ledger: number; fecha: string; de: string; monto: bigint }
  | { tipo: "renovar"; hash: string; ledger: number; fecha: string; periodo: number; tope: bigint; maxPorLlamada: bigint; finPeriodo: bigint; recarga: bigint }
  | { tipo: "pausa"; hash: string; ledger: number; fecha: string; pausada: boolean };

export interface Historial { movimientos: Movimiento[]; desdeLedger: number; desdeFecha: string }

/** Evento crudo (subconjunto de rpc.Api.EventResponse) para poder testear sin red. */
export interface EventoCrudo { contractId: string; txHash: string; ledger: number; ledgerClosedAt: string; topic: xdr.ScVal[]; value: xdr.ScVal }

const str = (v: xdr.ScVal) => { try { return String(scValToNative(v)); } catch { return ""; } };

/**
 * Traduce eventos a movimientos (orden de llegada). `invocado` dice a qué contrato llamó la tx de cada
 * transfer saliente que no va a la tesorería: el SAC de USDC = pago x402 del agente; la propia C… = retiro del dueño.
 */
export function aMovimientos(eventos: EventoCrudo[], contrato: string, tesoreria: string, invocado: Map<string, string>): Movimiento[] {
  const out: Movimiento[] = [];
  for (const e of eventos) {
    const base = { hash: e.txHash, ledger: e.ledger, fecha: e.ledgerClosedAt };
    const t0 = e.topic[0] ? str(e.topic[0]) : "";
    if (e.contractId === contrato) {
      if (t0 === "renovar") {
        const [tope, max, fin, recarga] = scValToNative(e.value) as bigint[];
        out.push({ tipo: "renovar", ...base, periodo: Number(scValToNative(e.topic[1])), tope: BigInt(tope), maxPorLlamada: BigInt(max), finPeriodo: BigInt(fin), recarga: BigInt(recarga) });
      } else if (t0 === "pausa") out.push({ tipo: "pausa", ...base, pausada: scValToNative(e.value) === true });
      continue;
    }
    if (e.contractId !== USDC_SAC || t0 !== "transfer" || e.topic.length < 3) continue;
    const de = str(e.topic[1]), a = str(e.topic[2]);
    const monto = BigInt(scValToNative(e.value) as bigint);
    if (a === contrato && de !== contrato) out.push({ tipo: "recarga", ...base, de, monto });
    else if (de === contrato) {
      if (a === tesoreria) out.push({ tipo: "comision", ...base, a, monto });
      else if (invocado.get(e.txHash) === contrato) out.push({ tipo: "retiro", ...base, a, monto });
      else if (invocado.get(e.txHash) === USDC_SAC) out.push({ tipo: "pago", ...base, a, monto });
      // Sin poder leer la tx no se adivina el tipo: no se muestra.
    }
  }
  return out;
}

/** Contrato que invoca la primera operación de la tx (invokeHostFunction → invokeContract). */
export function contratoInvocado(envelope: xdr.TransactionEnvelope): string | null {
  try {
    const tx = envelope.switch().name === "envelopeTypeTxFeeBump" ? envelope.feeBump().tx().innerTx().v1().tx() : envelope.v1().tx();
    const op = tx.operations()[0];
    if (op.body().switch().name !== "invokeHostFunction") return null;
    const hf = op.body().invokeHostFunctionOp().hostFunction();
    if (hf.switch().name !== "hostFunctionTypeInvokeContract") return null;
    return Address.fromScAddress(hf.invokeContract().contractAddress()).toString();
  } catch { return null; }
}

/** Lee el historial disponible en el RPC (~7 días). Más reciente primero. */
export async function leerHistorial(contrato: string, tesoreria: string, rpcUrl = RPC_TESTNET, maxPaginas = 20): Promise<Historial> {
  const s = new rpc.Server(rpcUrl);
  const yo = nativeToScVal(Address.fromString(contrato)).toXDR("base64");
  const filters: rpc.Api.EventFilter[] = [
    { type: "contract", contractIds: [contrato] },
    { type: "contract", contractIds: [USDC_SAC], topics: [["*", yo, "*", "**"]] },
    { type: "contract", contractIds: [USDC_SAC], topics: [["*", "*", yo, "**"]] },
  ];
  const ultimo = (await s.getLatestLedger()).sequence;
  // Primera llamada desde el ledger más viejo que guarda el RPC; después se sigue con el cursor.
  const salud = await s.getHealth();
  const desdeLedger = (salud as { oldestLedger?: number }).oldestLedger ?? Math.max(1, ultimo - 120_960);
  const eventos: EventoCrudo[] = [];
  let r = await s.getEvents({ startLedger: desdeLedger, filters, limit: 200 });
  let desdeFecha = "";
  for (let i = 0; ; i++) {
    for (const e of r.events) eventos.push({ contractId: String(e.contractId), txHash: e.txHash, ledger: e.ledger, ledgerClosedAt: e.ledgerClosedAt, topic: e.topic, value: e.value });
    const ledgerCursor = Number(BigInt(r.cursor.split("-")[0]) >> 32n);
    if (i >= maxPaginas || (r.events.length < 200 && ledgerCursor >= ultimo)) break;
    r = await s.getEvents({ cursor: r.cursor, filters, limit: 200 });
  }
  if (r.oldestLedgerCloseTime) desdeFecha = new Date(Number(r.oldestLedgerCloseTime) * 1000).toISOString();

  // Transfers salientes que no van a la tesorería: leer la tx para saber si fue el agente (x402) o el dueño (retirar).
  const dudosos = [...new Set(eventos.filter((e) => e.contractId === USDC_SAC && e.topic.length >= 3 && str(e.topic[1]) === contrato && str(e.topic[2]) !== tesoreria).map((e) => e.txHash))];
  const invocado = new Map<string, string>();
  for (let i = 0; i < dudosos.length; i += 5) {
    await Promise.all(dudosos.slice(i, i + 5).map(async (h) => {
      const t = await s.getTransaction(h).catch(() => null);
      const c = t && "envelopeXdr" in t && t.envelopeXdr ? contratoInvocado(t.envelopeXdr) : null;
      if (c) invocado.set(h, c);
    }));
  }
  return { movimientos: aMovimientos(eventos, contrato, tesoreria, invocado).reverse(), desdeLedger, desdeFecha };
}
