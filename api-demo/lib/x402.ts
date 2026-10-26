// Cobro x402 en Stellar testnet.
// Rescatado y simplificado de caja-tica-escudo/escudo/riesgo.ts (autoras: Milasur y Juliana Sanabria).
import { HTTPFacilitatorClient, x402ResourceServer } from "@x402/core/server";
import { decodePaymentSignatureHeader, encodePaymentRequiredHeader, encodePaymentResponseHeader } from "@x402/core/http";
import { ExactStellarScheme } from "@x402/stellar/exact/server";

export const RED_X402 = "stellar:testnet" as const;

export function leerConfig(env = process.env) {
  if (!env.X402_PAY_TO) throw new Error("Falta X402_PAY_TO (cuenta G... que recibe los pagos)");
  return {
    payTo: env.X402_PAY_TO,
    precio: env.X402_PRECIO?.trim() || "$0.01",
    facilitadorUrl: env.X402_FACILITATOR_URL?.trim() || "https://x402.org/facilitator",
  };
}

let servidor: x402ResourceServer | null = null;
let listo: Promise<void> | null = null;

async function x402() {
  const cfg = leerConfig();
  servidor ??= new x402ResourceServer(new HTTPFacilitatorClient({ url: cfg.facilitadorUrl })).register(RED_X402, new ExactStellarScheme());
  await (listo ??= servidor.initialize().catch((e) => { listo = null; throw e; }));
  return { s: servidor, cfg };
}

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers });

/** Envuelve un handler (precio opcional, ej. "$1"; si no, X402_PRECIO): sin pago responde 402; con pago válido cobra y responde 200. */
export async function cobrar(req: Request, descripcion: string, entregar: () => Promise<unknown>, precio?: string): Promise<Response> {
  const { s, cfg } = await x402();
  const requisitos = await s.buildPaymentRequirements({ scheme: "exact", payTo: cfg.payTo, price: precio ?? cfg.precio, network: RED_X402 });
  const recurso = { url: new URL(req.url).pathname, description: descripcion, mimeType: "application/json" };
  const pedirPago = async (error?: string) => {
    const pr = await s.createPaymentRequiredResponse(requisitos, recurso, error);
    return json(402, pr, { "PAYMENT-REQUIRED": encodePaymentRequiredHeader(pr) });
  };

  const firma = req.headers.get("payment-signature");
  if (!firma) return pedirPago("Falta el pago (PAYMENT-SIGNATURE)");
  let pago;
  try { pago = decodePaymentSignatureHeader(firma); } catch { return pedirPago("PAYMENT-SIGNATURE inválido"); }
  const elegido = s.findMatchingRequirements(requisitos, pago);
  if (!elegido) return pedirPago("El pago no coincide con lo que se cobra");
  const verif = await s.verifyPayment(pago, elegido);
  if (!verif.isValid) return pedirPago(verif.invalidReason ?? "Pago inválido");
  const datos = await entregar(); // primero preparamos la respuesta; si falla, no cobramos
  const cobro = await s.settlePayment(pago, elegido);
  if (!cobro.success) return pedirPago(cobro.errorReason ?? "No se pudo cobrar");
  return json(200, datos, { "PAYMENT-RESPONSE": encodePaymentResponseHeader(cobro) });
}
