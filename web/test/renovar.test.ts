// Tests sin red de web/lib/renovar.ts: `pnpm --filter web test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { scValToNative } from "@stellar/stellar-sdk";
import {
  USDC_SAC, argsRenovar, explicarError, finDeMesCR, problemasAntesDeFirmar, unidadesAUsdc, usdcAUnidades, validarRenovar, type Estado,
} from "../lib/renovar";

test("argsRenovar: orden y tipos de renovar(i128, i128, u64, i128)", () => {
  const a = argsRenovar({ tope: 500_000n, maxPorLlamada: 200_000n, finPeriodo: 1_793_512_800n, recarga: 0n });
  assert.deepEqual(a.map((v) => v.switch().name), ["scvI128", "scvI128", "scvU64", "scvI128"]);
  assert.deepEqual(a.map((v) => scValToNative(v)), [500_000n, 200_000n, 1_793_512_800n, 0n]);
});

test("usdcAUnidades: 7 decimales, coma o punto", () => {
  assert.equal(usdcAUnidades("0,05"), 500_000n);
  assert.equal(usdcAUnidades("0.02"), 200_000n);
  assert.equal(usdcAUnidades("1"), 10_000_000n);
  assert.equal(usdcAUnidades(" 0.0000001 "), 1n);
  for (const malo of ["", "-1", "abc", "0.00000001", "1e3"]) assert.throws(() => usdcAUnidades(malo), malo);
  assert.equal(unidadesAUsdc(500_000n), "0.05");
  assert.equal(unidadesAUsdc(10_000_000n), "1");
  assert.equal(unidadesAUsdc(0n), "0");
});

test("finDeMesCR: 1.º del mes siguiente a las 00:00 de Costa Rica (06:00 UTC)", () => {
  const seg = (iso: string) => BigInt(Date.parse(iso) / 1000);
  assert.equal(finDeMesCR(Date.parse("2026-10-26T10:37:00Z")), seg("2026-11-01T06:00:00Z"));
  // 31 oct 23:30 en CR (= 1 nov 05:30 UTC) sigue siendo octubre en CR
  assert.equal(finDeMesCR(Date.parse("2026-11-01T05:30:00Z")), seg("2026-11-01T06:00:00Z"));
  assert.equal(finDeMesCR(Date.parse("2026-12-15T12:00:00Z")), seg("2027-01-01T06:00:00Z"));
});

test("validarRenovar: mismas reglas que el contrato", () => {
  const ahora = 1_000_000n;
  const ok = { tope: 500_000n, maxPorLlamada: 200_000n, finPeriodo: ahora + 86_400n, recarga: 0n };
  assert.equal(validarRenovar(ok, ahora), null);
  assert.ok(validarRenovar({ ...ok, tope: 0n }, ahora));
  assert.ok(validarRenovar({ ...ok, maxPorLlamada: 600_000n }, ahora));
  assert.ok(validarRenovar({ ...ok, recarga: -1n }, ahora));
  assert.ok(validarRenovar({ ...ok, finPeriodo: ahora }, ahora));
  assert.ok(validarRenovar({ ...ok, finPeriodo: ahora + 32n * 86_400n + 1n }, ahora));
  assert.equal(validarRenovar({ ...ok, finPeriodo: ahora + 32n * 86_400n }, ahora), null);
});

test("problemasAntesDeFirmar: dueño, comisión, token y tesorería", () => {
  const DUENIO = "GDUENIO";
  const e = { owner: DUENIO, fee_bps: 100, token: USDC_SAC, tesoreria: "GTESO" } as Estado;
  assert.deepEqual(problemasAntesDeFirmar(e, DUENIO), []);
  assert.deepEqual(problemasAntesDeFirmar(e, DUENIO, "GTESO"), []);
  assert.equal(problemasAntesDeFirmar({ ...e, owner: "GOTRO" }, DUENIO).length, 1);
  assert.equal(problemasAntesDeFirmar({ ...e, fee_bps: 500 }, DUENIO).length, 1);
  assert.equal(problemasAntesDeFirmar({ ...e, token: "COTRO" }, DUENIO).length, 1);
  assert.equal(problemasAntesDeFirmar(e, DUENIO, "GOFICIAL").length, 1);
});

test("explicarError: traduce Error(Contract, #N)", () => {
  assert.match(explicarError("HostError: Error(Contract, #9) ..."), /^PeriodoInvalido/);
  assert.match(explicarError("... trustline entry is missing for account"), /trustline/);
  // error real de testnet: recarga mayor al saldo; el #10 es del SAC, no ParametrosInvalidos
  const sinSaldo = `HostError: Error(Contract, #10)\n 2: [Failed Diagnostic Event (not emitted)] contract:${USDC_SAC}, topics:[error, Error(Contract, #10)], data:["resulting balance is not within the allowed range", 0, -980500000, 9223372036854775807]`;
  assert.match(explicarError(sinSaldo), /USDC balance/);
});
