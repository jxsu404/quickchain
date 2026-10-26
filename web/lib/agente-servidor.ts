// El agente de /demo, del lado del servidor. Paga x402 `exact` desde la cuenta-presupuesto (C…):
// firma solo la auth entry de la C… con su llave ed25519 (AGENT_SECRET_KEY, variable de Vercel) y el
// contrato decide en __check_auth (tope, máximo por llamada, periodo, pausa). Misma lógica que
// agent-client/src/sdk.ts (armarPagoDesdeCuenta) de Raúl. Nunca loguear la llave.
import { x402Client } from "@x402/core/client";
import { decodePaymentRequiredHeader, decodePaymentResponseHeader, encodePaymentSignatureHeader } from "@x402/core/http";
import { Keypair, Networks, authorizeEntry, contract, nativeToScVal, rpc } from "@stellar/stellar-sdk";
import { RPC_TESTNET } from "./renovar";

export const NOMBRES_ERROR: Record<number, string> = {
  1: "Pausada", 2: "PeriodoVencido", 3: "FirmaInvalida", 4: "AgenteDesconocido", 5: "OperacionNoPermitida",
  6: "MontoInvalido", 7: "MontoPorLlamada", 8: "TopeAlcanzado", 9: "PeriodoInvalido", 10: "ParametrosInvalidos",
};

export class Rechazo extends Error { constructor(public motivo: string, msg: string) { super(msg); } }

export function llaveAgente(): Keypair | null {
  const s = process.env.AGENT_SECRET_KEY?.trim();
  if (!s) return null;
  try { return Keypair.fromSecret(s); } catch { return null; }
}

function traducir(texto: string): Rechazo {
  const n = /Error\(Contract, #(\d+)\)/.exec(texto)?.[1];
  if (/failed account authentication/.test(texto) && n && NOMBRES_ERROR[Number(n)]) return new Rechazo(NOMBRES_ERROR[Number(n)], texto.slice(0, 200));
  if (/balance is not sufficient/.test(texto)) return new Rechazo("SaldoInsuficiente", "La cuenta-presupuesto no tiene saldo USDC suficiente.");
  return new Rechazo("PagoRechazado", texto.slice(0, 300));
}

async function armarPago(req: any, cuenta: string, agente: Keypair, rpcUrl = RPC_TESTNET) {
  const servidor = new rpc.Server(rpcUrl);
  const seg = Math.min(Math.max(Number(req.maxTimeoutSeconds) || 60, 1), 300);
  const maxLedger = (await servidor.getLatestLedger()).sequence + Math.ceil(seg / 5);
  let tx;
  try {
    tx = await contract.AssembledTransaction.build({
      contractId: req.asset, method: "transfer", networkPassphrase: Networks.TESTNET, rpcUrl, parseResultXdr: (r: any) => r,
      args: [nativeToScVal(cuenta, { type: "address" }), nativeToScVal(req.payTo, { type: "address" }), nativeToScVal(BigInt(req.amount), { type: "i128" })],
    });
  } catch (e) { throw traducir(String((e as Error).message)); }
  const s1: any = tx.simulation;
  if (s1 && "error" in s1) throw traducir(String(s1.error));
  await tx.signAuthEntries({ address: cuenta, authorizeEntry: (e: any) => authorizeEntry(e, agente, maxLedger, Networks.TESTNET) });
  await tx.simulate(); // aquí corre __check_auth: si el tope no alcanza, falla sin tx
  const s2: any = tx.simulation;
  if (s2 && "error" in s2) throw traducir(String(s2.error));
  return { transaction: tx.built!.toXDR() };
}

/** Una llamada pagada: 402 → firmar pago desde la C… → reintentar. `llamar` atiende la request (en proceso). */
export async function llamadaPagada(llamar: (r: Request) => Promise<Response>, url: string, cuenta: string, agente: Keypair, maxUnidades: bigint) {
  const r1 = await llamar(new Request(url));
  if (r1.status !== 402) throw new Rechazo("SinCobro", `La API respondió ${r1.status}`);
  const cab = r1.headers.get("payment-required");
  const pedido: any = cab ? decodePaymentRequiredHeader(cab) : await r1.json();
  const req = (pedido.accepts ?? []).find((a: any) => a.scheme === "exact" && a.network === "stellar:testnet");
  if (!req) throw new Rechazo("SinOpcionStellar", "La API no acepta x402 exact en Stellar testnet");
  if (BigInt(req.amount) > maxUnidades) throw new Rechazo("MaxPorLlamadaLocal", "La API cobra más que el máximo local");
  const esquema = { scheme: "exact", async createPaymentPayload(x402Version: number, r: any) { return { x402Version, payload: await armarPago(r, cuenta, agente) }; } };
  const cliente = x402Client.fromConfig({ schemes: [{ network: "stellar:*", client: esquema as any }], spendControls: false } as any);
  const payload = await cliente.createPaymentPayload({ ...pedido, accepts: [req] });
  const r2 = await llamar(new Request(url, { headers: { "PAYMENT-SIGNATURE": encodePaymentSignatureHeader(payload as any) } }));
  if (r2.status !== 200) {
    const b: any = await r2.json().catch(() => ({}));
    throw new Rechazo("PagoRechazado", `El vendedor respondió ${r2.status}: ${String(b?.error ?? "").slice(0, 200)}`);
  }
  const resp = r2.headers.get("payment-response");
  const liquidado: any = resp ? decodePaymentResponseHeader(resp) : {};
  return { monto: BigInt(req.amount), tx: String(liquidado.transaction ?? ""), datos: await r2.json() };
}
