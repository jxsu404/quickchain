// Tests sin red del dashboard (/dashboard): lib/tablero.ts y la clasificación de eventos de lib/historial.ts.
import { test } from "node:test";
import assert from "node:assert/strict";
import { Address, Keypair, StrKey, nativeToScVal, xdr } from "@stellar/stellar-sdk";
import { USDC_SAC } from "../lib/renovar";
import { nivel, pctGastado, tiempoRestante } from "../lib/tablero";
import { aMovimientos, type EventoCrudo } from "../lib/historial";

const AHORA = 1_793_000_000;
const base = { tope: 500_000n, gastado: 0n, pausada: false, fin_periodo: BigInt(AHORA + 86_400) };

test("pctGastado: gastado sobre tope, 1 decimal, sin pasar de 100", () => {
  assert.equal(pctGastado({ tope: 500_000n, gastado: 404_000n }), 80.8);
  assert.equal(pctGastado({ tope: 500_000n, gastado: 0n }), 0);
  assert.equal(pctGastado({ tope: 0n, gastado: 10n }), 0);
  assert.equal(pctGastado({ tope: 100n, gastado: 150n }), 100);
});

test("nivel: verde hasta 80 %, ámbar arriba, rojo si pausada, vencida o bloqueada", () => {
  assert.equal(nivel({ ...base, gastado: 400_000n }, false, AHORA), "ok"); // 80 % justo: todavía verde
  assert.equal(nivel({ ...base, gastado: 404_000n }, false, AHORA), "cerca");
  assert.equal(nivel({ ...base, pausada: true }, false, AHORA), "bloqueo");
  assert.equal(nivel({ ...base, gastado: 404_000n }, true, AHORA), "bloqueo");
  assert.equal(nivel({ ...base, fin_periodo: BigInt(AHORA) }, false, AHORA), "bloqueo");
  assert.equal(nivel({ ...base, tope: 0n, fin_periodo: 0n }, false, AHORA), "vacio");
});

test("tiempoRestante: días/horas/minutos o null", () => {
  assert.equal(tiempoRestante(AHORA + 5 * 86_400 + 10 * 3600 + 59, AHORA), "5 d 10 h");
  assert.equal(tiempoRestante(AHORA + 3 * 3600 + 20 * 60, AHORA), "3 h 20 min");
  assert.equal(tiempoRestante(AHORA + 30, AHORA), "1 min");
  assert.equal(tiempoRestante(AHORA, AHORA), null);
});

const C = StrKey.encodeContract(Buffer.alloc(32, 7));
const TESORERIA = Keypair.random().publicKey();
const VENDEDOR = Keypair.random().publicKey();
const DUENIO = Keypair.random().publicKey();
const dir = (s: string) => nativeToScVal(Address.fromString(s));
const sym = (s: string) => xdr.ScVal.scvSymbol(s);
const i128 = (n: bigint) => nativeToScVal(n, { type: "i128" });
let k = 0;
const ev = (contractId: string, topic: xdr.ScVal[], value: xdr.ScVal): EventoCrudo =>
  ({ contractId, txHash: `h${++k}`, ledger: k, ledgerClosedAt: "2026-10-26T19:25:00Z", topic, value });

test("aMovimientos: pagos, comisión, retiro, recarga, renovar y pausa salen de eventos reales", () => {
  k = 0;
  const transfer = (de: string, a: string, n: bigint) => ev(USDC_SAC, [sym("transfer"), dir(de), dir(a), nativeToScVal("USDC:G…")], i128(n));
  const eventos = [
    ev(C, [sym("renovar"), nativeToScVal(11, { type: "u32" })], nativeToScVal([i128(500_000n), i128(200_000n), nativeToScVal(1_793_512_800n, { type: "u64" }), i128(404_000n)])), // h1
    transfer(DUENIO, C, 404_000n), // h2 recarga
    transfer(C, TESORERIA, 4_000n), // h3 comisión
    transfer(C, VENDEDOR, 100_000n), // h4 pago (tx invoca el SAC)
    transfer(C, DUENIO, 50_000n), // h5 retiro (tx invoca la C…)
    transfer(C, VENDEDOR, 1n), // h6 sin tx leída: no se adivina
    ev(C, [sym("pausa")], xdr.ScVal.scvBool(true)), // h7
    ev(USDC_SAC, [sym("transfer"), dir(VENDEDOR), dir(DUENIO), nativeToScVal("USDC:G…")], i128(9n)), // ajeno
  ];
  const invocado = new Map([["h4", USDC_SAC], ["h5", C]]);
  const m = aMovimientos(eventos, C, TESORERIA, invocado);
  assert.deepEqual(m.map((x) => x.tipo), ["renovar", "recarga", "comision", "pago", "retiro", "pausa"]);
  const r = m[0] as Extract<typeof m[number], { tipo: "renovar" }>;
  assert.deepEqual([r.periodo, r.tope, r.maxPorLlamada, r.finPeriodo, r.recarga], [11, 500_000n, 200_000n, 1_793_512_800n, 404_000n]);
  const p = m[3] as Extract<typeof m[number], { tipo: "pago" }>;
  assert.deepEqual([p.hash, p.a, p.monto], ["h4", VENDEDOR, 100_000n]);
  assert.equal((m[5] as Extract<typeof m[number], { tipo: "pausa" }>).pausada, true);
});
