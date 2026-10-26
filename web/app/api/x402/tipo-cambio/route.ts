// API de pago por llamada (x402, US$0,01 en USDC de testnet). La usa el agente de /demo.
import { cobrar, tipoCambioUsdCrc } from "@/lib/x402-servidor";

export const dynamic = "force-dynamic";
export const GET = (req: Request) => cobrar(req, "Tipo de cambio USD/CRC (Stellar QuickPass demo)", tipoCambioUsdCrc);
