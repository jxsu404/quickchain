// Lógica pura del dashboard del dueño (/dashboard): nivel del anillo, tiempo restante y bloqueos de la sesión.
import type { Estado } from "./renovar";

/** ok = Verde Paso, cerca = Ámbar Tope (> 80 % del tope), bloqueo = Rojo Bloqueo, vacio = sin presupuesto. */
export type Nivel = "ok" | "cerca" | "bloqueo" | "vacio";
export const UMBRAL_CERCA_PCT = 80;

/** Porcentaje gastado del tope (0–100, 1 decimal). */
export function pctGastado(e: Pick<Estado, "gastado" | "tope">): number {
  const tope = BigInt(e.tope), gastado = BigInt(e.gastado);
  if (tope <= 0n) return 0;
  const p = Number((gastado * 1000n) / tope) / 10;
  return Math.min(100, Math.max(0, p));
}

export function nivel(e: Pick<Estado, "gastado" | "tope" | "pausada" | "fin_periodo">, huboBloqueo: boolean, ahoraSeg = Math.floor(Date.now() / 1000)): Nivel {
  if (BigInt(e.tope) <= 0n) return "vacio";
  if (e.pausada || huboBloqueo || Number(e.fin_periodo) <= ahoraSeg) return "bloqueo";
  return pctGastado(e) > UMBRAL_CERCA_PCT ? "cerca" : "ok";
}

/** "5 d 10 h", "3 h 20 min", "12 min" o null si ya terminó. */
export function tiempoRestante(finSeg: bigint | number, ahoraSeg = Math.floor(Date.now() / 1000)): string | null {
  const s = Number(finSeg) - ahoraSeg;
  if (s <= 0) return null;
  const d = Math.floor(s / 86_400), h = Math.floor((s % 86_400) / 3600), m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d} d ${h} h`;
  if (h > 0) return `${h} h ${m} min`;
  return `${Math.max(1, m)} min`;
}

export const fechaCR = (seg: bigint | number) =>
  new Date(Number(seg) * 1000).toLocaleString("en-US", { timeZone: "America/Costa_Rica", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) + " CR";
export const horaCR = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { timeZone: "America/Costa_Rica", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit" }) + " CR";

// Bloqueos vistos por «Correr agente» en este navegador (sessionStorage). No están en la red: el contrato
// los rechaza en la simulación y no se envía ninguna tx.
export interface Bloqueo { n: number; motivo: string; mensaje: string; fecha: string; periodo: number }
const clave = (contrato: string) => `sqp-bloqueos:${contrato}`;

export function leerBloqueos(contrato: string): Bloqueo[] {
  try { const v = JSON.parse(sessionStorage.getItem(clave(contrato)) ?? "[]"); return Array.isArray(v) ? v : []; } catch { return []; }
}
export function guardarBloqueo(contrato: string, b: Bloqueo) {
  try { sessionStorage.setItem(clave(contrato), JSON.stringify([b, ...leerBloqueos(contrato)].slice(0, 20))); } catch { /* sin storage: no se guarda */ }
}
