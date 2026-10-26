// Tests con un 402 simulado (sin red): `pnpm --filter agent-client test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { Keypair } from "@stellar/stellar-sdk";
import { decodePaymentSignatureHeader, encodePaymentRequiredHeader, encodePaymentResponseHeader } from "@x402/core/http";
import { ConfiguracionInvalida, crearFetchConPresupuesto, ledgersDeVigencia, LimitePorMinuto, PagoBloqueado, traducirErrorSimulacion } from "../src/index.js";

const CUENTA = "CAUZN55NIOM7XQ36VM65IRWJMOROYEMF27QF7LQWI5ZU3VKYJN66SXFB";
const PAYTO = Keypair.random().publicKey();
const requisito = (amount: string) => ({ scheme: "exact", network: "stellar:testnet", asset: "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA", amount, payTo: PAYTO, maxTimeoutSeconds: 60, extra: { areFeesSponsored: true } });
const pedido = (amount: string) => ({ x402Version: 2, resource: { url: "/tipo-cambio", description: "demo", mimeType: "application/json" }, accepts: [requisito(amount)] });

/** `urlFinal` simula que fetch siguió un redirect: el 402 llega con `response.url` = urlFinal. */
function vendedorFalso(amount: string, urlFinal?: string) {
  const vistos: any[] = [];
  const pagados: { url: string; redirect?: RequestRedirect }[] = [];
  const f = (async (url: any, init: RequestInit = {}) => {
    const firma = new Headers(init.headers).get("payment-signature");
    if (!firma) {
      const r = new Response(JSON.stringify(pedido(amount)), { status: 402, headers: { "PAYMENT-REQUIRED": encodePaymentRequiredHeader(pedido(amount) as any) } });
      if (urlFinal) Object.defineProperty(r, "url", { value: urlFinal });
      return r;
    }
    vistos.push(decodePaymentSignatureHeader(firma));
    pagados.push({ url: String(url), redirect: init.redirect });
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "PAYMENT-RESPONSE": encodePaymentResponseHeader({ success: true, transaction: "ab".repeat(32), network: "stellar:testnet", payer: CUENTA } as any) } });
  }) as typeof fetch;
  return { f, vistos, pagados };
}
const base = { cuenta: CUENTA, secretoAgente: Keypair.random().secret(), hostsPermitidos: ["localhost:4020"] };
const pagoFalso = async () => ({ transaction: "XDR-FALSO" });

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

test("hostsPermitidos es obligatorio y no vacío", () => {
  const { hostsPermitidos: _, ...sinHosts } = base;
  assert.throws(() => crearFetchConPresupuesto(sinHosts as any), ConfiguracionInvalida);
  assert.throws(() => crearFetchConPresupuesto({ ...base, hostsPermitidos: [] }), ConfiguracionInvalida);
  assert.throws(() => crearFetchConPresupuesto({ ...base, hostsPermitidos: [" "] }), ConfiguracionInvalida);
});

test("maxLlamadasPorMinuto inválido: ConfiguracionInvalida", () => {
  for (const n of [0, -1, 1.5, Number.NaN]) assert.throws(() => crearFetchConPresupuesto({ ...base, maxLlamadasPorMinuto: n }), ConfiguracionInvalida, String(n));
});

test("límite por minuto: bloquea antes de firmar y se libera a los 60 s", async () => {
  const v = vendedorFalso("100000");
  let t = 1_000_000;
  let firmados = 0;
  const fx = crearFetchConPresupuesto({ ...base, maxLlamadasPorMinuto: 2, ahora: () => t, crearPago: async () => { firmados++; return { transaction: "x" }; } }, v.f);
  await fx("http://localhost:4020/tipo-cambio");
  t += 10_000;
  await fx("http://localhost:4020/tipo-cambio");
  t += 20_000;
  await assert.rejects(fx("http://localhost:4020/tipo-cambio"), (e: any) =>
    e instanceof LimitePorMinuto && e instanceof PagoBloqueado && e.motivo === "LimitePorMinuto" && !e.enCadena && e.reintentarEnMs === 30_000);
  assert.equal(firmados, 2);
  t += 30_000; // el primer pago sale de la ventana
  assert.equal((await fx("http://localhost:4020/tipo-cambio")).status, 200);
  assert.equal(firmados, 3);
});

test("límite por minuto por defecto: 10", async () => {
  const v = vendedorFalso("100000");
  const fx = crearFetchConPresupuesto({ ...base, ahora: () => 0, crearPago: pagoFalso }, v.f);
  for (let i = 0; i < 10; i++) await fx("http://localhost:4020/tipo-cambio");
  await assert.rejects(fx("http://localhost:4020/tipo-cambio"), LimitePorMinuto);
  assert.equal(v.vistos.length, 10);
});

test("sin 402 no cuenta para el límite por minuto", async () => {
  const fx = crearFetchConPresupuesto({ ...base, maxLlamadasPorMinuto: 1, crearPago: pagoFalso }, (async () => new Response("libre")) as any);
  for (let i = 0; i < 5; i++) assert.equal((await fx("http://localhost:4020/libre")).status, 200);
});

test("redirect a un host no permitido: bloquea sin pagar", async () => {
  const v = vendedorFalso("100000", "http://malicioso.example/cobro");
  const fx = crearFetchConPresupuesto({ ...base, crearPago: async () => assert.fail("no debía pagar") }, v.f);
  await assert.rejects(fx("http://localhost:4020/tipo-cambio"), (e: any) => e instanceof PagoBloqueado && e.motivo === "HostNoPermitido" && /malicioso\.example/.test(e.message));
  assert.equal(v.vistos.length, 0);
});

test("redirect a un host permitido: paga a la URL final sin seguir más redirects", async () => {
  const v = vendedorFalso("100000", "http://api.permitida.cr/v2/tipo-cambio");
  const fx = crearFetchConPresupuesto({ ...base, hostsPermitidos: ["localhost:4020", "api.permitida.cr"], crearPago: pagoFalso }, v.f);
  assert.equal((await fx("http://localhost:4020/tipo-cambio")).status, 200);
  assert.deepEqual(v.pagados, [{ url: "http://api.permitida.cr/v2/tipo-cambio", redirect: "manual" }]);
});

test("maxTimeoutSeconds del 402 se acota a 300 s", () => {
  assert.equal(ledgersDeVigencia(60), 12);
  assert.equal(ledgersDeVigencia(300), 60);
  assert.equal(ledgersDeVigencia(86_400), 60);
  assert.equal(ledgersDeVigencia(undefined), 12);
  assert.equal(ledgersDeVigencia(-5), 12);
  assert.equal(ledgersDeVigencia("abc"), 12);
});

test("traduce errores reales de __check_auth", () => {
  const t = (n: number) => `HostError: Error(Auth, InvalidAction) ... "failed account authentication with error", ${CUENTA}, Error(Contract, #${n})`;
  assert.equal(traducirErrorSimulacion(t(8), CUENTA)?.motivo, "TopeAlcanzado");
  assert.equal(traducirErrorSimulacion(t(7), CUENTA)?.motivo, "MontoPorLlamada");
  assert.equal(traducirErrorSimulacion(t(1), CUENTA)?.motivo, "Pausada");
  assert.equal(traducirErrorSimulacion('["balance is not sufficient to spend"]', CUENTA)?.motivo, "SaldoInsuficiente");
  assert.equal(traducirErrorSimulacion("otra cosa", CUENTA), null);
});
