// Vendedor demo (PLAN-OPUS Q3): servidor HTTP con node:http que cobra por llamada con x402 `exact`
// en Stellar testnet. También expone el facilitador propio (verify, settle, supported).
import "dotenv/config";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { cobrar } from "./x402.ts";
import { facilitador, manejar } from "./facilitador.ts";
import { tipoCambioUsdCrc } from "./tipoCambio.ts";

type Ruta = (req: Request) => Promise<Response> | Response;

export const rutas: Record<string, Ruta> = {
  "GET /tipo-cambio": (req) => cobrar(req, "Tipo de cambio USD/CRC (QuickChain demo)", tipoCambioUsdCrc, "$0.01"),
  "GET /caro": (req) => cobrar(req, "Mismo dato a US$1 (demo de bloqueo por máximo por llamada)", tipoCambioUsdCrc, "$1"),
  "GET /api/clima": (req) => cobrar(req, "Clima de prueba (QuickChain demo)", async () => ({
    ciudad: "San José", nota: "Dato de demostración, no es un servicio real", hora: new Date().toISOString(),
  })),
  "POST /facilitador/verify": (req) => manejar(req, "verify"),
  "POST /facilitador/settle": (req) => manejar(req, "settle"),
  "GET /facilitador/supported": () => Response.json(facilitador().getSupported()),
};

/** Atiende un Request web estándar (sirve también para los tests). */
export async function atender(req: Request): Promise<Response> {
  const ruta = rutas[`${req.method} ${new URL(req.url).pathname}`];
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
  const srv = createServer(async (req, res) => responder(res, await atender(await aWeb(req, base))));
  return new Promise<typeof srv>((ok) => srv.listen(puerto, () => { console.log(`vendedor en ${base} (/tipo-cambio, /caro, /facilitador/*)`); ok(srv); }));
}

if (import.meta.url === `file://${process.argv[1]}`) void arrancar();
