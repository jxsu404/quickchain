// Tipo de cambio USD→CRC desde una fuente pública real (ExchangeRate-API, plan gratuito, sin llave).
// No es el tipo de cambio oficial del BCCR; se rotula así en la respuesta.
export const FUENTE_TC = "https://open.er-api.com/v6/latest/USD";

export async function tipoCambioUsdCrc() {
  const r = await fetch(FUENTE_TC, { cache: "no-store" });
  if (!r.ok) throw new Error(`Fuente de tipo de cambio respondió ${r.status}`);
  const d = (await r.json()) as { result: string; rates: Record<string, number>; time_last_update_utc: string; provider: string };
  if (d.result !== "success" || typeof d.rates?.CRC !== "number") throw new Error("Fuente sin dato CRC");
  return {
    par: "USD/CRC", valor: d.rates.CRC, actualizado: d.time_last_update_utc,
    fuente: FUENTE_TC, proveedor: d.provider,
    nota: "Tasa de referencia de ExchangeRate-API; no es el tipo de cambio oficial del BCCR. Demo en testnet.",
  };
}
