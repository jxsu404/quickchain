// SDK del agente (PLAN-OPUS Q2): fetch que paga x402 `exact` desde la cuenta-presupuesto (C…).
// La auth entry de la C… se firma con la llave del agente (authorizeEntry + Keypair → Vec<{public_key, signature}>,
// el formato FirmaAgente del contrato). Doble simulación: antes de firmar (footprint del transfer) y después
// (footprint con __check_auth). Si el contrato rechaza, falla en la simulación: no hay tx ni se mueve plata.
import { x402Client } from "@x402/core/client";
import { decodePaymentRequiredHeader, decodePaymentResponseHeader, encodePaymentSignatureHeader } from "@x402/core/http";
import { Keypair, Networks, authorizeEntry, contract, nativeToScVal, rpc, scValToNative } from "@stellar/stellar-sdk";
import { PagoBloqueado, traducirErrorSimulacion } from "./errores.js";

export const RED = "stellar:testnet";
export const RPC_TESTNET = "https://soroban-testnet.stellar.org";
export const linkExpert = (hash: string) => `https://stellar.expert/explorer/testnet/tx/${hash}`;

export interface OpcionesPresupuesto {
  /** Cuenta-presupuesto C… que paga. */
  cuenta: string;
  /** Llave secreta ed25519 del agente (sin fondos). Leela del entorno; nunca la loguees. */
  secretoAgente: string;
  rpcUrl?: string;
  /** Tope local por llamada en unidades de 7 decimales (1 USDC = 10_000_000). Se suma al máximo en cadena. */
  maxPorLlamada?: bigint;
  /** Hosts a los que el agente puede pagar (ej. ["localhost:4020"]). Vacío o sin definir = cualquiera. */
  hostsPermitidos?: string[];
  /** Se llama tras cada pago liquidado. */
  alPagar?: (p: PagoHecho) => void;
  /** Solo para tests: reemplaza la construcción del pago firmado. */
  crearPago?: (requisito: any) => Promise<{ transaction: string }>;
}

export interface PagoHecho { url: string; monto: string; payTo: string; tx?: string; link?: string; pagador?: string }

/** Pago `exact` con `from = cuenta`, firmado por el agente y doblemente simulado. Devuelve el XDR de la tx. */
export async function armarPagoDesdeCuenta(req: any, cuenta: string, agente: Keypair, rpcUrl = RPC_TESTNET) {
  const servidor = new rpc.Server(rpcUrl);
  const maxLedger = (await servidor.getLatestLedger()).sequence + Math.ceil((req.maxTimeoutSeconds ?? 60) / 5);
  let tx;
  try {
    tx = await contract.AssembledTransaction.build({
      contractId: req.asset, method: "transfer", networkPassphrase: Networks.TESTNET, rpcUrl, parseResultXdr: (r: any) => r,
      args: [nativeToScVal(cuenta, { type: "address" }), nativeToScVal(req.payTo, { type: "address" }), nativeToScVal(req.amount, { type: "i128" })],
    });
  } catch (e) {
    throw traducirErrorSimulacion(String((e as Error).message), cuenta) ?? e;
  }
  const sim1: any = tx.simulation;
  if (sim1 && "error" in sim1) throw traducirErrorSimulacion(String(sim1.error), cuenta) ?? new PagoBloqueado("PagoRechazado", String(sim1.error).slice(0, 300), true);
  await tx.signAuthEntries({ address: cuenta, authorizeEntry: (e: any) => authorizeEntry(e, agente, maxLedger, Networks.TESTNET) });
  await tx.simulate(); // segunda simulación: aquí corre __check_auth (tope, máximo por llamada, periodo, pausa)
  const sim2: any = tx.simulation;
  if (sim2 && "error" in sim2) throw traducirErrorSimulacion(String(sim2.error), cuenta) ?? new PagoBloqueado("PagoRechazado", String(sim2.error).slice(0, 300), true);
  return { transaction: tx.built!.toXDR() };
}

/** Envuelve fetch: ante un 402 x402 paga desde la cuenta-presupuesto y reintenta una vez. */
export function crearFetchConPresupuesto(op: OpcionesPresupuesto, fetchBase: typeof fetch = fetch) {
  const agente = Keypair.fromSecret(op.secretoAgente);
  const crearPago = op.crearPago ?? ((req: any) => armarPagoDesdeCuenta(req, op.cuenta, agente, op.rpcUrl));
  const esquema = {
    scheme: "exact",
    async createPaymentPayload(x402Version: number, req: any) {
      if (!req.extra?.areFeesSponsored) throw new Error("x402 exact en Stellar requiere areFeesSponsored");
      return { x402Version, payload: await crearPago(req) };
    },
  };
  // El tope real lo aplica el contrato; los límites locales van abajo (host y maxPorLlamada).
  const cliente = x402Client.fromConfig({ schemes: [{ network: "stellar:*", client: esquema as any }], spendControls: false });

  return async function fetchConPresupuesto(entrada: string | URL, init: RequestInit = {}): Promise<Response> {
    const url = new URL(String(entrada));
    const r1 = await fetchBase(url, init);
    if (r1.status !== 402) return r1;
    if (op.hostsPermitidos?.length && !op.hostsPermitidos.includes(url.host))
      throw new PagoBloqueado("HostNoPermitido", `${url.host} no está en hostsPermitidos`);
    const cabecera = r1.headers.get("payment-required");
    const pedido: any = cabecera ? decodePaymentRequiredHeader(cabecera) : await r1.json();
    const opciones = (pedido.accepts ?? []).filter((a: any) => a.scheme === "exact" && a.network === RED);
    if (!opciones.length) throw new PagoBloqueado("SinOpcionStellar", "La API no acepta x402 exact en Stellar testnet");
    const elegido = opciones.reduce((a: any, b: any) => (BigInt(b.amount) < BigInt(a.amount) ? b : a));
    if (op.maxPorLlamada !== undefined && BigInt(elegido.amount) > op.maxPorLlamada)
      throw new PagoBloqueado("MaxPorLlamadaLocal", `cobra ${elegido.amount} y el máximo local es ${op.maxPorLlamada}`);
    const pago = await cliente.createPaymentPayload({ ...pedido, accepts: [elegido] });
    const headers = new Headers(init.headers);
    headers.set("PAYMENT-SIGNATURE", encodePaymentSignatureHeader(pago));
    const r2 = await fetchBase(url, { ...init, headers });
    if (r2.status === 402) {
      const motivo = r2.headers.get("payment-required");
      const err = motivo ? (decodePaymentRequiredHeader(motivo) as any).error : undefined;
      throw new PagoBloqueado("PagoRechazado", `el vendedor/facilitador no aceptó el pago${err ? `: ${err}` : ""}`);
    }
    const resp = r2.headers.get("payment-response");
    if (resp) {
      const c: any = decodePaymentResponseHeader(resp);
      op.alPagar?.({ url: url.href, monto: elegido.amount, payTo: elegido.payTo, tx: c.transaction, link: c.transaction ? linkExpert(c.transaction) : undefined, pagador: c.payer });
    }
    return r2;
  };
}

export interface EstadoPresupuesto { tope: bigint; gastado: bigint; restante: bigint; fin_periodo: bigint; pausada: boolean; [k: string]: unknown }

/** Lee `estado()` de la cuenta-presupuesto (simulación, sin firmar ni pagar). */
export async function leerEstado(cuenta: string, rpcUrl = RPC_TESTNET): Promise<EstadoPresupuesto> {
  const tx = await contract.AssembledTransaction.build({
    contractId: cuenta, method: "estado", args: [], networkPassphrase: Networks.TESTNET, rpcUrl, parseResultXdr: (r: any) => scValToNative(r),
  });
  return tx.result as EstadoPresupuesto;
}
