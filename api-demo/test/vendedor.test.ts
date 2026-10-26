import { test } from "node:test";
import assert from "node:assert/strict";
import { atender, rutas, rutasFacilitador } from "../servidor/vendedor.ts";
import { FACILITADOR_PUBLICO, leerConfig } from "../servidor/x402.ts";

const local = (ruta: string, headers: Record<string, string> = {}) =>
  new Request(`http://localhost:4020${ruta}`, { headers: { host: "localhost:4020", ...headers } });

test("expone las rutas del plan Q3", () => {
  for (const r of ["GET /tipo-cambio", "GET /caro"]) assert.ok(rutas[r], r);
  for (const r of ["POST /facilitador/verify", "POST /facilitador/settle", "GET /facilitador/supported"]) assert.ok(rutasFacilitador[r], r);
});

test("ruta desconocida responde 404 sin red", async () => {
  const r = await atender(new Request("http://localhost/nada"));
  assert.equal(r.status, 404);
});

test("sin X402_PAY_TO responde 500 (no cobra a ciegas)", async () => {
  delete process.env.X402_PAY_TO;
  const r = await atender(new Request("http://localhost/tipo-cambio"));
  assert.equal(r.status, 500);
});

test("por defecto usa el facilitador público", () => {
  assert.equal(leerConfig({ X402_PAY_TO: "G" }).facilitadorUrl, FACILITADOR_PUBLICO);
  assert.equal(leerConfig({ X402_PAY_TO: "G", X402_FACILITATOR_URL: " https://otro.example/f " }).facilitadorUrl, "https://otro.example/f");
});

test("FACILITADOR_PROPIO=1 sin URL explícita apunta al propio en 127.0.0.1", () => {
  assert.equal(leerConfig({ X402_PAY_TO: "G", FACILITADOR_PROPIO: "1", PORT: "4021" }).facilitadorUrl, "http://127.0.0.1:4021/facilitador");
});

test("sin FACILITADOR_PROPIO, /facilitador/* no existe ni desde localhost", async () => {
  delete process.env.FACILITADOR_PROPIO;
  const r = await atender(local("/facilitador/supported"), "127.0.0.1");
  assert.equal(r.status, 404);
});

test("con FACILITADOR_PROPIO=1, /facilitador/* solo atiende conexiones locales", async (t) => {
  process.env.FACILITADOR_PROPIO = "1";
  t.after(() => { delete process.env.FACILITADOR_PROPIO; });
  assert.equal((await atender(local("/facilitador/supported"), "203.0.113.7")).status, 403);
  assert.equal((await atender(local("/facilitador/supported"))).status, 403);
  // túnel: llega desde 127.0.0.1 pero con cabeceras de proxy u otro Host
  assert.equal((await atender(local("/facilitador/supported", { "x-forwarded-for": "203.0.113.7" }), "127.0.0.1")).status, 403);
  assert.equal((await atender(local("/facilitador/supported", { host: "demo.ngrok.app" }), "127.0.0.1")).status, 403);
  // local de verdad: pasa el filtro (sin FACILITADOR_SECRET_KEY responde 500, no 403/404)
  delete process.env.FACILITADOR_SECRET_KEY;
  assert.equal((await atender(local("/facilitador/supported"), "127.0.0.1")).status, 500);
});
