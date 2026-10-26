#!/usr/bin/env node
// MCP server de Stellar QuickPass (stdio). Cualquier cliente MCP (Claude Desktop, Claude Code, Cursor, Grok Bot…)
// puede pagar APIs x402 desde una cuenta-presupuesto C… con tope en cadena. Solo testnet.
// Config solo por variables de entorno. La secreta del agente nunca se loguea ni se devuelve.
// stdout es el canal MCP: todo log va a stderr.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Keypair } from "@stellar/stellar-sdk";
import { PagoBloqueado } from "./errores.js";
import { RPC_TESTNET, crearFetchConPresupuesto, leerEstado, linkExpert, type PagoHecho } from "./sdk.js";

const VERSION = "0.1.0";
const UNIDADES = 10_000_000n; // 1 USDC = 10^7 (7 decimales)

function fallar(msg: string): never {
  process.stderr.write(`quickpass-mcp: ${msg}\n`);
  process.exit(1);
}

const red = (process.env.QUICKPASS_NETWORK || "testnet").trim();
if (red !== "testnet") fallar(`QUICKPASS_NETWORK=${red} no soportada: solo testnet`);
const cuenta = (process.env.QUICKPASS_CONTRACT_ID || "").trim();
if (!/^C[A-Z2-7]{55}$/.test(cuenta)) fallar("falta QUICKPASS_CONTRACT_ID (la C… de la cuenta-presupuesto)");
const secreto = (process.env.QUICKPASS_AGENT_SECRET || "").trim();
let agente: Keypair;
try { agente = Keypair.fromSecret(secreto); } catch { fallar("QUICKPASS_AGENT_SECRET falta o no es una llave secreta Stellar válida"); }
const rpcUrl = (process.env.QUICKPASS_RPC_URL || process.env.STELLAR_RPC_URL || RPC_TESTNET).trim();
const hosts = (process.env.QUICKPASS_HOSTS_PERMITIDOS || "quickchain-api-demo.onrender.com,localhost:4020")
  .split(",").map((h) => h.trim()).filter(Boolean);
const archivoPagos = process.env.QUICKPASS_PAGOS_FILE || path.join(homedir(), ".quickpass-mcp", `pagos-${cuenta}.json`);

const usdc = (u: bigint | string | number) => {
  const v = BigInt(u);
  const neg = v < 0n; const a = neg ? -v : v;
  return `${neg ? "-" : ""}${a / UNIDADES}.${(a % UNIDADES).toString().padStart(7, "0")}`;
};
function aUnidades(x: number): bigint {
  const m = /^(\d+)(?:\.(\d{1,7}))?$/.exec(String(x));
  if (!m) throw new Error(`max_usdc inválido: ${x} (hasta 7 decimales)`);
  return BigInt(m[1]) * UNIDADES + BigInt((m[2] ?? "").padEnd(7, "0"));
}
/** Nunca dejar salir la secreta en un texto devuelto al cliente. */
const limpiar = (s: string) => (secreto ? s.split(secreto).join("[secreto]") : s);

interface Registro extends PagoHecho { fecha: string; monto_usdc: string }
function leerPagos(): Registro[] {
  try { return JSON.parse(readFileSync(archivoPagos, "utf8")); } catch { return []; }
}
function guardarPago(p: PagoHecho) {
  const lista = leerPagos();
  lista.push({ ...p, monto_usdc: usdc(p.monto), fecha: new Date().toISOString() });
  try {
    mkdirSync(path.dirname(archivoPagos), { recursive: true });
    writeFileSync(archivoPagos, JSON.stringify(lista.slice(-200), null, 2));
  } catch (e) { process.stderr.write(`quickpass-mcp: no pude guardar el historial: ${(e as Error).message}\n`); }
}

const texto = (obj: unknown, esError = false) => ({
  content: [{ type: "text" as const, text: limpiar(JSON.stringify(obj, (_k, v) => (typeof v === "bigint" ? v.toString() : v), 2)) }],
  ...(esError ? { isError: true } : {}),
});

async function estado() {
  const e: any = await leerEstado(cuenta, rpcUrl);
  const fin = Number(e.fin_periodo);
  return {
    red: "stellar:testnet",
    cuenta,
    cuenta_link: `https://stellar.expert/explorer/testnet/contract/${cuenta}`,
    agente_registrado_es_esta_llave: Buffer.from(e.agente as Uint8Array).equals(agente.rawPublicKey()),
    tope_usdc: usdc(e.tope),
    gastado_periodo_usdc: usdc(e.gastado),
    restante_usdc: usdc(e.restante),
    max_por_llamada_usdc: usdc(e.max_por_llamada),
    saldo_usdc: usdc(e.saldo),
    fin_periodo: fin ? new Date(fin * 1000).toISOString() : null,
    periodo_vencido: fin ? fin * 1000 <= Date.now() : true,
    pausada: Boolean(e.pausada),
    periodo: e.periodo,
    fee_bps: e.fee_bps,
  };
}

const server = new McpServer({ name: "quickpass", version: VERSION });

server.registerTool("quickpass_estado", {
  title: "Estado del presupuesto QuickPass",
  description: "Lee la cuenta-presupuesto en Stellar testnet: tope del periodo, gastado, restante, máximo por llamada, saldo, fin del periodo y si está pausada. No paga nada.",
  inputSchema: {},
}, async () => {
  try { return texto(await estado()); } catch (e) { return texto({ error: (e as Error).message }, true); }
});

server.registerTool("quickpass_pagar_api", {
  title: "Llamar/pagar una API x402",
  description: "Llama la URL. Si responde 402 (x402 exact, Stellar testnet), paga desde la cuenta-presupuesto con la llave del agente (respetando el tope en cadena y max_usdc), reintenta y devuelve la respuesta de la API con el hash y el link de Stellar Expert. Si el contrato rechaza (tope alcanzado, pausada, periodo vencido, máximo por llamada) devuelve bloqueado=true sin mover plata.",
  inputSchema: {
    url: z.string().url().describe("URL de la API (http/https)"),
    method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).optional().describe("Método HTTP (GET por defecto)"),
    body: z.string().optional().describe("Cuerpo de la petición (texto o JSON serializado)"),
    max_usdc: z.number().positive().optional().describe("Máximo que este pago puede costar, en USDC (ej. 0.02)"),
  },
}, async ({ url, method, body, max_usdc }) => {
  let pago: PagoHecho | undefined;
  try {
    const fetchPagando = crearFetchConPresupuesto({
      cuenta, secretoAgente: secreto, rpcUrl, hostsPermitidos: hosts,
      maxPorLlamada: max_usdc !== undefined ? aUnidades(max_usdc) : undefined,
      alPagar: (p) => { pago = p; guardarPago(p); },
    });
    const headers: Record<string, string> = {};
    if (body !== undefined && /^\s*[[{]/.test(body)) headers["content-type"] = "application/json";
    const r = await fetchPagando(url, { method: method ?? "GET", body, headers });
    const cuerpo = await r.text();
    return texto({
      ok: r.ok,
      status: r.status,
      pagado: Boolean(pago),
      ...(pago ? { pago: { monto_usdc: usdc(pago.monto), pay_to: pago.payTo, tx: pago.tx, link: pago.link } } : {}),
      content_type: r.headers.get("content-type"),
      respuesta: cuerpo.length > 20_000 ? cuerpo.slice(0, 20_000) + "…[recortado]" : cuerpo,
    }, !r.ok);
  } catch (e) {
    if (e instanceof PagoBloqueado) {
      const cap = e.motivo === "TopeAlcanzado";
      return texto({
        bloqueado: true,
        resultado: cap ? "blocked: cap reached" : `blocked: ${e.motivo}`,
        motivo: e.motivo,
        en_cadena: e.enCadena,
        mensaje: e.message,
        nota: "No se envió ninguna tx ni se movió plata.",
      });
    }
    return texto({ error: (e as Error).message }, true);
  }
});

server.registerTool("quickpass_pagos", {
  title: "Pagos recientes",
  description: "Lista los pagos x402 recientes hechos por este MCP con esta cuenta-presupuesto, con link de Stellar Expert de cada tx.",
  inputSchema: { limite: z.number().int().min(1).max(200).optional().describe("Cuántos (10 por defecto)") },
}, async ({ limite }) => {
  const lista = leerPagos().slice(-(limite ?? 10)).reverse()
    .map((p) => ({ fecha: p.fecha, url: p.url, monto_usdc: p.monto_usdc, pay_to: p.payTo, tx: p.tx, link: p.link ?? (p.tx ? linkExpert(p.tx) : undefined) }));
  return texto({ cuenta, pagos: lista, cuenta_link: `https://stellar.expert/explorer/testnet/contract/${cuenta}` });
});

await server.connect(new StdioServerTransport());
process.stderr.write(`quickpass-mcp ${VERSION} listo (testnet, cuenta ${cuenta}, hosts ${hosts.join(", ")})\n`);
