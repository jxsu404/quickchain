// Cobro x402 `exact` en Stellar testnet dentro de la web (copia chica de api-demo/servidor/x402.ts, de Raúl).
// Liquida con el facilitador público (x402.org), que patrocina los fees.
import { HTTPFacilitatorClient, x402ResourceServer } from "@x402/core/server";
import { decodePaymentSignatureHeader, encodePaymentRequiredHeader, encodePaymentResponseHeader } from "@x402/core/http";
import { ExactStellarScheme } from "@x402/stellar/exact/server";

export const RED_X402 = "stellar:testnet" as const;
export const PRECIO_DEMO = "$0.01";
const FACILITADOR = process.env.X402_FACILITATOR_URL?.trim() || "https://x402.org/facilitator";

let servidor: x402ResourceServer | null = null;
let listo: Promise<void> | null = null;
async function x402() {
  servidor ??= new x402ResourceServer(new HTTPFacilitatorClient({ url: FACILITADOR })).register(RED_X402, new ExactStellarScheme());
  await (listo ??= servidor.initialize().catch((e) => { listo = null; throw e; }));
  return servidor;
}

/** Sin pago responde 402; con pago válido cobra y responde 200 con `PAYMENT-RESPONSE`. */
export async function cobrar(req: Request, descripcion: string, entregar: () => Promise<unknown>, precio = PRECIO_DEMO): Promise<Response> {
  const payTo = process.env.X402_PAY_TO?.trim();
  if (!payTo) return Response.json({ error: "Falta X402_PAY_TO" }, { status: 500 });
  const s = await x402();
  const requisitos = await s.buildPaymentRequirements({ scheme: "exact", payTo, price: precio, network: RED_X402 });
  const recurso = { url: new URL(req.url).pathname, description: descripcion, mimeType: "application/json" };
  const pedirPago = async (error?: string) => {
    const pr = await s.createPaymentRequiredResponse(requisitos, recurso, error);
    return Response.json(pr, { status: 402, headers: { "PAYMENT-REQUIRED": encodePaymentRequiredHeader(pr) } });
  };
  const firma = req.headers.get("payment-signature");
  if (!firma) return pedirPago("Falta el pago (PAYMENT-SIGNATURE)");
  let pago;
  try { pago = decodePaymentSignatureHeader(firma); } catch { return pedirPago("PAYMENT-SIGNATURE inválido"); }
  const elegido = s.findMatchingRequirements(requisitos, pago);
  if (!elegido) return pedirPago("El pago no coincide con lo que se cobra");
  const verif = await s.verifyPayment(pago, elegido);
  if (!verif.isValid) return pedirPago(verif.invalidReason ?? "Pago inválido");
  const datos = await entregar();
  const cobro = await s.settlePayment(pago, elegido);
  if (!cobro.success) return pedirPago(cobro.errorReason ?? "No se pudo cobrar");
  return Response.json(datos, { headers: { "PAYMENT-RESPONSE": encodePaymentResponseHeader(cobro) } });
}

/** Tipo de cambio USD→CRC (ExchangeRate-API, no oficial del BCCR). Copia de api-demo/servidor/tipoCambio.ts. */
export async function tipoCambioUsdCrc() {
  const fuente = "https://open.er-api.com/v6/latest/USD";
  const r = await fetch(fuente, { cache: "no-store" });
  if (!r.ok) throw new Error(`Fuente de tipo de cambio respondió ${r.status}`);
  const d = (await r.json()) as { result: string; rates: Record<string, number>; time_last_update_utc: string };
  if (d.result !== "success" || typeof d.rates?.CRC !== "number") throw new Error("Fuente sin dato CRC");
  return { par: "USD/CRC", valor: d.rates.CRC, actualizado: d.time_last_update_utc, fuente, nota: "No es el tipo de cambio oficial del BCCR. Demo en testnet." };
}
