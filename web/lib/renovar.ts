// `renovar` de la cuenta-presupuesto (contracts/cuenta-presupuesto/src/lib.rs):
//   renovar(tope: i128, max_por_llamada: i128, fin_periodo: u64, recarga: i128)
// Cavos `invokeContract` convierte valores JS con nativeToScVal sin tipo (500000n sale u64, no i128),
// así que los argumentos se pasan ya tipados.
import { Networks, contract, nativeToScVal, scValToNative, type xdr } from "@stellar/stellar-sdk";

export const RPC_TESTNET = "https://soroban-testnet.stellar.org";
export const USDC = { code: "USDC", issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5" };
export const USDC_SAC = "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";
export const FEE_BPS_ESPERADO = 100;
export const MAX_PERIODO_SEG = 32n * 24n * 3600n;
export const linkTx = (hash: string) => `https://stellar.expert/explorer/testnet/tx/${hash}`;
export const linkContrato = (id: string) => `https://stellar.expert/explorer/testnet/contract/${id}`;

export const ERRORES: Record<number, string> = {
  1: "Pausada", 2: "PeriodoVencido", 3: "FirmaInvalida", 4: "AgenteDesconocido", 5: "OperacionNoPermitida",
  6: "MontoInvalido", 7: "MontoPorLlamada", 8: "TopeAlcanzado", 9: "PeriodoInvalido", 10: "ParametrosInvalidos",
};

export interface ParamsRenovar { tope: bigint; maxPorLlamada: bigint; finPeriodo: bigint; recarga: bigint }

/** "0,05" o "0.05" USDC → unidades de 7 decimales (500000n). Lanza si no es un número ≥ 0 con ≤ 7 decimales. */
export function usdcAUnidades(texto: string): bigint {
  const t = texto.trim().replace(",", ".");
  const m = /^(\d+)(?:\.(\d{0,7}))?$/.exec(t);
  if (!m) throw new Error(`Invalid amount: "${texto}" (use up to 7 decimals, e.g. 0.05)`);
  return BigInt(m[1]) * 10_000_000n + BigInt((m[2] ?? "").padEnd(7, "0"));
}

export const unidadesAUsdc = (u: bigint) => {
  const s = (u < 0n ? -u : u).toString().padStart(8, "0");
  return `${u < 0n ? "-" : ""}${s.slice(0, -7)}.${s.slice(-7)}`.replace(/\.?0+$/, "");
};

/** 1.º del mes siguiente a las 00:00 hora de Costa Rica (UTC-6, sin horario de verano), en segundos unix. */
export function finDeMesCR(ahoraMs = Date.now()): bigint {
  const cr = new Date(ahoraMs - 6 * 3600_000);
  return BigInt(Date.UTC(cr.getUTCFullYear(), cr.getUTCMonth() + 1, 1, 6) / 1000);
}

/** Mismas reglas que `renovar` en el contrato. Devuelve el problema o null. */
export function validarRenovar(p: ParamsRenovar, ahoraSeg = BigInt(Math.floor(Date.now() / 1000))): string | null {
  if (p.tope <= 0n) return "The cap must be greater than 0.";
  if (p.maxPorLlamada <= 0n || p.maxPorLlamada > p.tope) return "Max per call must be greater than 0 and not exceed the cap.";
  if (p.recarga < 0n) return "The top-up cannot be negative.";
  if (p.finPeriodo <= ahoraSeg || p.finPeriodo > ahoraSeg + MAX_PERIODO_SEG) return "The period end must be between now and 32 days from now.";
  return null;
}

/** Argumentos de `renovar` en orden y con los tipos del contrato. */
export function argsRenovar(p: ParamsRenovar): xdr.ScVal[] {
  return [
    nativeToScVal(p.tope, { type: "i128" }),
    nativeToScVal(p.maxPorLlamada, { type: "i128" }),
    nativeToScVal(p.finPeriodo, { type: "u64" }),
    nativeToScVal(p.recarga, { type: "i128" }),
  ];
}

export interface Estado {
  owner: string; agente: unknown; token: string; tesoreria: string; fee_bps: number; periodo: number;
  tope: bigint; max_por_llamada: bigint; gastado: bigint; restante: bigint; fin_periodo: bigint;
  pausada: boolean; comision_pendiente: bigint; saldo: bigint;
}

/** `estado()` por simulación (sin firmar). */
export async function leerEstado(contractId: string, rpcUrl = RPC_TESTNET): Promise<Estado> {
  const tx = await contract.AssembledTransaction.build({
    contractId, method: "estado", args: [], networkPassphrase: Networks.TESTNET, rpcUrl, parseResultXdr: (r: any) => scValToNative(r),
  });
  return tx.result as Estado;
}

/** Lo que tiene que cumplir la cuenta antes de que el dueño firme. `tesoreriaOficial` vacía = no se compara. */
export function problemasAntesDeFirmar(e: Estado, duenio: string, tesoreriaOficial?: string): string[] {
  const p: string[] = [];
  if (e.owner !== duenio) p.push(`The owner of this budget account is ${e.owner}, not your account ${duenio}. Only the owner can sign the renewal.`);
  if (Number(e.fee_bps) !== FEE_BPS_ESPERADO) p.push(`This account's fee is ${Number(e.fee_bps) / 100}%, not 1%.`);
  if (e.token !== USDC_SAC) p.push(`This account's token (${e.token}) is not Circle's testnet USDC.`);
  if (tesoreriaOficial && e.tesoreria !== tesoreriaOficial) p.push(`This account's treasury (${e.tesoreria}) is not the official one (${tesoreriaOficial}).`);
  return p;
}

/** Traduce un error de simulación/envío a algo legible (`Error(Contract, #9)` → PeriodoInvalido). */
export function explicarError(texto: string): string {
  // El SAC de USDC usa sus propios códigos (#10 = saldo, #13 = sin trustline), que chocan con los del contrato.
  if (/trustline|balance is not sufficient|resulting balance is not within/i.test(texto)) return "Your account has no USDC trustline or not enough USDC balance for the top-up.";
  const n = /Error\(Contract, #(\d+)\)/.exec(texto)?.[1];
  if (n && ERRORES[Number(n)]) return `${ERRORES[Number(n)]} (Error(Contract, #${n}))`;
  return texto.slice(0, 400);
}

/** Simula `renovar` con el dueño como fuente. Detecta PeriodoInvalido, falta de saldo, etc. antes de pedir la firma. */
export async function simularRenovar(contractId: string, duenio: string, p: ParamsRenovar, rpcUrl = RPC_TESTNET) {
  const tx = await contract.AssembledTransaction.build({
    contractId, method: "renovar", args: argsRenovar(p), publicKey: duenio, networkPassphrase: Networks.TESTNET, rpcUrl,
    parseResultXdr: (r: any) => r,
  });
  const sim: any = tx.simulation;
  if (sim && "error" in sim) throw new Error(explicarError(String(sim.error)));
  return tx;
}
