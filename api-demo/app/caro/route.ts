// Endpoint "caro" (US$1) para la demo de bloqueo: el contrato debe rechazarlo con MontoPorLlamada.
import { cobrar } from "@/lib/x402";
import { tipoCambioUsdCrc } from "@/lib/tipoCambio";

export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  return cobrar(req, "Mismo dato a US$1 (demo de bloqueo por máximo por llamada)", tipoCambioUsdCrc, "$1");
}
