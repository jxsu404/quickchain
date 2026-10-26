// Vendedor demo (PLAN-OPUS Q3): GET /tipo-cambio a US$0,01 con x402 `exact` en Stellar testnet.
import { cobrar } from "@/lib/x402";
import { tipoCambioUsdCrc } from "@/lib/tipoCambio";

export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  return cobrar(req, "Tipo de cambio USD/CRC (QuickChain demo)", tipoCambioUsdCrc, "$0.01");
}
