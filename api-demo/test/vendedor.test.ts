import { test } from "node:test";
import assert from "node:assert/strict";
import { atender, rutas } from "../servidor/vendedor.ts";

test("expone las rutas del plan Q3", () => {
  for (const r of ["GET /tipo-cambio", "GET /caro", "POST /facilitador/verify", "POST /facilitador/settle", "GET /facilitador/supported"]) assert.ok(rutas[r], r);
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
