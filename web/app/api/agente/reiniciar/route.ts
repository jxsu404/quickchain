// POST /api/agente/reiniciar — solo la cuenta demo (DEMO_BUDGET_CONTRACT_ID): su dueño de testnet
// (DEMO_OWNER_SECRET, variable de Vercel) firma `renovar` (tope 0,05, máx. 0,02, fin de mes CR) y
// repone el saldo, para que el jurado pueda correr el agente otra vez.
import { Keypair, Networks, contract } from "@stellar/stellar-sdk";
import { RPC_TESTNET, argsRenovar, finDeMesCR, leerEstado, linkTx } from "@/lib/renovar";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
const TOPE = 500_000n, MAX = 200_000n;

export async function POST() {
  const id = process.env.DEMO_BUDGET_CONTRACT_ID?.trim();
  let duenio: Keypair;
  try { duenio = Keypair.fromSecret(process.env.DEMO_OWNER_SECRET?.trim() ?? ""); } catch { return Response.json({ error: "Reinicio no configurado" }, { status: 500 }); }
  if (!id) return Response.json({ error: "Reinicio no configurado" }, { status: 500 });
  try {
    const e = await leerEstado(id);
    const disponible = BigInt(String(e.saldo)) - BigInt(String(e.comision_pendiente));
    const recarga = disponible >= TOPE ? 0n : TOPE - disponible;
    const tx = await contract.AssembledTransaction.build({
      contractId: id, method: "renovar", args: argsRenovar({ tope: TOPE, maxPorLlamada: MAX, finPeriodo: finDeMesCR(), recarga }),
      networkPassphrase: Networks.TESTNET, rpcUrl: RPC_TESTNET, publicKey: duenio.publicKey(), parseResultXdr: (r: any) => r,
      ...contract.basicNodeSigner(duenio, Networks.TESTNET),
    });
    const r = await tx.signAndSend();
    const hash = r.sendTransactionResponse?.hash ?? "";
    return Response.json({ ok: true, tx: hash, link: linkTx(hash) });
  } catch (err) {
    return Response.json({ error: String((err as Error)?.message ?? err).slice(0, 300) }, { status: 500 });
  }
}
