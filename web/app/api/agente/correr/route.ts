// POST /api/agente/correr?contract=C… — el agente demo paga la API x402 en un loop hasta que el contrato
// lo bloquea. Responde NDJSON en streaming (una línea por evento). GET devuelve la llave pública del
// agente y la cuenta demo. La llave secreta vive solo en AGENT_SECRET_KEY (Vercel), nunca sale.
import { StrKey } from "@stellar/stellar-sdk";
import { Rechazo, llamadaPagada, llaveAgente } from "@/lib/agente-servidor";
import { leerEstado, linkTx } from "@/lib/renovar";
import { GET as apiTipoCambio } from "../../x402/tipo-cambio/route";

export const dynamic = "force-dynamic";
export const maxDuration = 300;
const MAX_LLAMADAS = 10;
const s = (v: unknown) => String(v ?? 0);
const hex = (v: unknown) => (v instanceof Uint8Array ? Buffer.from(v).toString("hex") : String(v));

export function GET() {
  const k = llaveAgente();
  return Response.json({ agente: k?.publicKey() ?? null, agenteHex: k ? k.rawPublicKey().toString("hex") : null, contratoDemo: process.env.DEMO_BUDGET_CONTRACT_ID ?? null });
}

export async function POST(req: Request) {
  const contrato = (new URL(req.url).searchParams.get("contract") || process.env.DEMO_BUDGET_CONTRACT_ID || "").trim();
  if (!StrKey.isValidContract(contrato)) return Response.json({ error: "contract tiene que ser una C… válida" }, { status: 400 });
  const agente = llaveAgente();
  if (!agente) return Response.json({ error: "El servidor no tiene AGENT_SECRET_KEY" }, { status: 500 });
  const url = new URL("/api/x402/tipo-cambio", req.url).href;
  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(ctrl) {
      const enviar = (o: unknown) => ctrl.enqueue(enc.encode(JSON.stringify(o) + "\n"));
      try {
        let e = await leerEstado(contrato);
        const resumen = (x: typeof e) => ({ tope: s(x.tope), gastado: s(x.gastado), restante: s(x.restante), saldo: s(x.saldo), maxPorLlamada: s(x.max_por_llamada) });
        enviar({ tipo: "inicio", contrato, agente: agente.publicKey(), estado: resumen(e) });
        if (hex(e.agente) !== agente.rawPublicKey().toString("hex")) {
          enviar({ tipo: "error", motivo: "AgenteDesconocido", mensaje: `Esta cuenta autoriza a otro agente (${hex(e.agente).slice(0, 12)}…), no a ${agente.publicKey()}. Creá una en /crear con el agente demo o usá la cuenta demo.` });
          return ctrl.close();
        }
        for (let n = 1; n <= MAX_LLAMADAS; n++) {
          enviar({ tipo: "llamando", n });
          try {
            const p = await llamadaPagada(apiTipoCambio, url, contrato, agente, BigInt(s(e.max_por_llamada)));
            e = await leerEstado(contrato);
            enviar({ tipo: "pago", n, monto: s(p.monto), tx: p.tx, link: p.tx ? linkTx(p.tx) : null, dato: p.datos, estado: resumen(e) });
          } catch (err) {
            const r = err instanceof Rechazo ? err : new Rechazo("Error", String((err as Error)?.message ?? err).slice(0, 300));
            e = await leerEstado(contrato).catch(() => e);
            enviar({ tipo: "bloqueado", n, motivo: r.motivo, mensaje: r.message, estado: resumen(e) });
            return ctrl.close();
          }
        }
        enviar({ tipo: "fin", mensaje: `Paró en ${MAX_LLAMADAS} llamadas (límite de la demo).` });
      } catch (err) {
        enviar({ tipo: "error", motivo: "Error", mensaje: String((err as Error)?.message ?? err).slice(0, 300) });
      }
      ctrl.close();
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } });
}
