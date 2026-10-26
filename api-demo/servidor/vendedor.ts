// Vendedor demo (PLAN-OPUS Q3): servidor HTTP con node:http que cobra por llamada con x402 `exact`
// en Stellar testnet. Por defecto liquida con el facilitador público. El facilitador propio
// (verify, settle, supported) es un respaldo local: solo existe con FACILITADOR_PROPIO=1 y solo
// atiende conexiones desde la misma máquina, porque paga fees de terceros con su XLM.
import "dotenv/config";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { cobrar, facilitadorPropioActivo, leerConfig } from "./x402.ts";
import { facilitador, manejar } from "./facilitador.ts";
import { tipoCambioUsdCrc } from "./tipoCambio.ts";

type Ruta = (req: Request) => Promise<Response> | Response;

export const rutas: Record<string, Ruta> = {
  "GET /tipo-cambio": (req) => cobrar(req, "Tipo de cambio USD/CRC (QuickChain demo)", tipoCambioUsdCrc, "$0.01"),
  "GET /caro": (req) => cobrar(req, "Mismo dato a US$1 (demo de bloqueo por máximo por llamada)", tipoCambioUsdCrc, "$1"),
  "GET /api/clima": (req) => cobrar(req, "Clima de prueba (QuickChain demo)", async () => ({
    ciudad: "San José", nota: "Dato de demostración, no es un servicio real", hora: new Date().toISOString(),
  })),
};

export const rutasFacilitador: Record<string, Ruta> = {
  "POST /facilitador/verify": (req) => manejar(req, "verify"),
  "POST /facilitador/settle": (req) => manejar(req, "settle"),
  "GET /facilitador/supported": () => Response.json(facilitador().getSupported()),
};

const LOOPBACK_IP = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);
const LOOPBACK_HOST = new Set(["localhost", "127.0.0.1", "[::1]"]);
const CABECERAS_PROXY = ["forwarded", "x-forwarded-for", "x-forwarded-host", "x-real-ip", "cf-connecting-ip"];

/** Un túnel (ngrok, cloudflared) llega desde 127.0.0.1: por eso también se exige Host local y sin cabeceras de proxy. */
export function esLocal(req: Request, ipRemota?: string) {
  if (!ipRemota || !LOOPBACK_IP.has(ipRemota)) return false;
  if (CABECERAS_PROXY.some((h) => req.headers.has(h))) return false;
  try { return LOOPBACK_HOST.has(new URL(`http://${req.headers.get("host")}`).hostname); } catch { return false; }
}

/** Atiende un Request web estándar (sirve también para los tests). `ipRemota` = IP del socket. */
export async function atender(req: Request, ipRemota?: string): Promise<Response> {
  const clave = `${req.method} ${new URL(req.url).pathname}`;
  let ruta = rutas[clave];
  if (!ruta && facilitadorPropioActivo() && rutasFacilitador[clave]) {
    if (!esLocal(req, ipRemota)) return Response.json({ error: "El facilitador propio solo atiende conexiones locales" }, { status: 403 });
    ruta = rutasFacilitador[clave];
  }
  if (!ruta) return Response.json({ error: "No existe" }, { status: 404 });
  try { return await ruta(req); } catch (e) { return Response.json({ error: (e as Error).message }, { status: 500 }); }
}

async function aWeb(req: IncomingMessage, base: string): Promise<Request> {
  const partes: Buffer[] = [];
  for await (const c of req) partes.push(c as Buffer);
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) if (v !== undefined) headers.set(k, Array.isArray(v) ? v.join(", ") : v);
  const cuerpo = partes.length && req.method !== "GET" && req.method !== "HEAD" ? Buffer.concat(partes) : undefined;
  return new Request(new URL(req.url ?? "/", base), { method: req.method, headers, body: cuerpo });
}

async function responder(res: ServerResponse, r: Response) {
  res.writeHead(r.status, Object.fromEntries((r.headers as any).entries()));
  res.end(Buffer.from(await r.arrayBuffer()));
}

export function arrancar(puerto = Number(process.env.PORT || 4020)) {
  const base = `http://localhost:${puerto}`;
  const srv = createServer(async (req, res) => responder(res, await atender(await aWeb(req, base), req.socket.remoteAddress)));
  let facil = "facilitador: (falta X402_PAY_TO)";
  try { facil = `facilitador: ${leerConfig().facilitadorUrl}`; } catch {}
  const extra = facilitadorPropioActivo() ? ", /facilitador/* solo local" : "";
  return new Promise<typeof srv>((ok) => srv.listen(puerto, () => { console.log(`vendedor en ${base} (/tipo-cambio, /caro${extra}); ${facil}`); ok(srv); }));
}

if (import.meta.url === `file://${process.argv[1]}`) void arrancar();
