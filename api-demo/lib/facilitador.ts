// Facilitador x402 propio (esquema `exact`, Stellar testnet). PLAN-OPUS §1.1 y Q3.
// Diferencia con el público: techo de fee configurable (FACILITADOR_MAX_FEE_STROOPS) para tolerar
// pagadores cuenta-contrato (C…), cuyo __check_auth encarece la simulación.
import { x402Facilitator } from "@x402/core/facilitator";
import { createEd25519Signer } from "@x402/stellar";
import { ExactStellarScheme } from "@x402/stellar/exact/facilitator";

export const RED = "stellar:testnet" as const;
let fac: x402Facilitator | null = null;

export function facilitador() {
  if (fac) return fac;
  const secreto = process.env.FACILITADOR_SECRET_KEY;
  if (!secreto) throw new Error("Falta FACILITADOR_SECRET_KEY (cuenta G… con XLM que paga los fees)");
  const techo = Number(process.env.FACILITADOR_MAX_FEE_STROOPS || 5_000_000);
  const rpcUrl = process.env.STELLAR_RPC_URL?.trim();
  fac = new x402Facilitator().register(
    RED,
    new ExactStellarScheme([createEd25519Signer(secreto, RED) as any], { maxTransactionFeeStroops: techo, ...(rpcUrl ? { rpcConfig: { url: rpcUrl } } : {}) }),
  );
  return fac;
}

export async function manejar(req: Request, accion: "verify" | "settle") {
  try {
    const { paymentPayload, paymentRequirements } = await req.json();
    const r = accion === "verify"
      ? await facilitador().verify(paymentPayload, paymentRequirements)
      : await facilitador().settle(paymentPayload, paymentRequirements);
    return Response.json(r);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
