// Tests con un 402 simulado (sin red): `pnpm --filter agent-client test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { Keypair } from "@stellar/stellar-sdk";
import { decodePaymentSignatureHeader, encodePaymentRequiredHeader, encodePaymentResponseHeader } from "@x402/core/http";
import { crearFetchConPresupuesto, PagoBloqueado, traducirErrorSimulacion } from "../src/index.js";

const CUENTA = "CAUZN55NIOM7XQ36VM65IRWJMOROYEMF27QF7LQWI5ZU3VKYJN66SXFB";
const PAYTO = Keypair.random().publicKey();
const requisito = (amount: string) => ({ scheme: "exact", network: "stellar:testnet", asset: "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA", amount, payTo: PAYTO, maxTimeoutSeconds: 60, extra: { areFeesSponsored: true } });
const pedido = (amount: string) => ({ x402Version: 2, resource: { url: "/tipo-cambio", description: "demo", mimeType: "application/json" }, accepts: [requisito(amount)] });

function vendedorFalso(amount: string) {
  const vistos: any[] = [];
  const f = (async (_url: any, init: RequestInit = {}) => {
    const firma = new Headers(init.headers).get("payment-signature");
    if (!firma) return new Response(JSON.stringify(pedido(amount)), { status: 402, headers: { "PAYMENT-REQUIRED": encodePaymentRequiredHeader(pedido(amount) as any) } });
    vistos.push(decodePaymentSignatureHeader(firma));
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "PAYMENT-RESPONSE": encodePaymentResponseHeader({ success: true, transaction: "ab".repeat(32), network: "stellar:testnet", payer: CUENTA } as any) } });
  }) as typeof fetch;
  return { f, vistos };
}
const base = { cuenta: CUENTA, secretoAgente: Keypair.random().secret() };

test("sin 402 no paga", async () => {
  let llamadas = 0;
  const fx = crearFetchConPresupuesto({ ...base, crearPago: async () => { llamadas++; return { transaction: "x" }; } }, (async () => new Response("hola")) as any);
  assert.equal(await (await fx("http://localhost:4020/libre")).text(), "hola");
  assert.equal(llamadas, 0);
});

test("ante un 402 paga una vez, reintenta con PAYMENT-SIGNATURE e informa el link", async () => {
  const v = vendedorFalso("100000");
  const pagos: any[] = [];
  const fx = crearFetchConPresupuesto({ ...base, crearPago: async (req) => { assert.equal(req.amount, "100000"); return { transaction: "XDR-FALSO" }; }, alPagar: (p) => pagos.push(p) }, v.f);
  const r = await fx("http://localhost:4020/tipo-cambio");
  assert.equal(r.status, 200);
  assert.equal(v.vistos.length, 1);
  assert.equal(v.vistos[0].payload.transaction, "XDR-FALSO");
  assert.equal(v.vistos[0].accepted.payTo, PAYTO);
  assert.match(pagos[0].link, /^https:\/\/stellar\.expert\/explorer\/testnet\/tx\/ab/);
});

test("host fuera de hostsPermitidos: bloquea sin pagar", async () => {
  const v = vendedorFalso("100000");
  const fx = crearFetchConPresupuesto({ ...base, hostsPermitidos: ["api.permitida.cr"], crearPago: async () => assert.fail("no debía pagar") }, v.f);
  await assert.rejects(fx("http://malicioso.example/caro"), (e: any) => e instanceof PagoBloqueado && e.motivo === "HostNoPermitido");
});

test("monto mayor al máximo local: MaxPorLlamadaLocal", async () => {
  const v = vendedorFalso("10000000");
  const fx = crearFetchConPresupuesto({ ...base, maxPorLlamada: 200000n, crearPago: async () => assert.fail("no debía pagar") }, v.f);
  await assert.rejects(fx("http://localhost:4020/caro"), (e: any) => e.motivo === "MaxPorLlamadaLocal");
});

test("el contrato rechaza en la simulación: el error se propaga claro", async () => {
  const v = vendedorFalso("100000");
  const fx = crearFetchConPresupuesto({ ...base, crearPago: async () => { throw new PagoBloqueado("TopeAlcanzado", "tope", true); } }, v.f);
  await assert.rejects(fx("http://localhost:4020/tipo-cambio"), (e: any) => e.motivo === "TopeAlcanzado" && e.enCadena);
  assert.equal(v.vistos.length, 0);
});

test("traduce errores reales de __check_auth", () => {
  const t = (n: number) => `HostError: Error(Auth, InvalidAction) ... "failed account authentication with error", ${CUENTA}, Error(Contract, #${n})`;
  assert.equal(traducirErrorSimulacion(t(8), CUENTA)?.motivo, "TopeAlcanzado");
  assert.equal(traducirErrorSimulacion(t(7), CUENTA)?.motivo, "MontoPorLlamada");
  assert.equal(traducirErrorSimulacion(t(1), CUENTA)?.motivo, "Pausada");
  assert.equal(traducirErrorSimulacion('["balance is not sufficient to spend"]', CUENTA)?.motivo, "SaldoInsuficiente");
  assert.equal(traducirErrorSimulacion("otra cosa", CUENTA), null);
});
