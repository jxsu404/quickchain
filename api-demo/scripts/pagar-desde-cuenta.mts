// Cliente x402 `exact` donde el PAGADOR es la cuenta-presupuesto (C…) y firma la llave del agente.
// Igual que ExactStellarScheme (cliente) de @x402/stellar, pero la auth entry de la C… se firma con
// authorizeEntry + Keypair del agente → Vec<{public_key, signature}> (formato de FirmaAgente en Q1).
// Doble simulación: después de firmar se re-simula para que el footprint incluya __check_auth.
// Uso: AGENTE_SECRET=… CUENTA_C=C… URL=… npx tsx scripts/pagar-desde-cuenta.mts
import { x402Client } from "@x402/core/client";
import { decodePaymentResponseHeader } from "@x402/core/http";
import { wrapFetchWithPayment } from "@x402/fetch";
import { Keypair, Networks, authorizeEntry, contract, nativeToScVal, rpc } from "@stellar/stellar-sdk";

const RPC = process.env.STELLAR_RPC_URL || "https://soroban-testnet.stellar.org";
const agente = Keypair.fromSecret(process.env.AGENTE_SECRET ?? (() => { throw new Error("Falta AGENTE_SECRET"); })());
const cuenta = process.env.CUENTA_C ?? (() => { throw new Error("Falta CUENTA_C"); })();
const url = process.env.URL ?? "http://localhost:4020/tipo-cambio";

const esquemaCuenta = {
  scheme: "exact",
  async createPaymentPayload(x402Version: number, req: any) {
    if (!req.extra?.areFeesSponsored) throw new Error("exact requiere areFeesSponsored");
    const servidor = new rpc.Server(RPC);
    const maxLedger = (await servidor.getLatestLedger()).sequence + Math.ceil(req.maxTimeoutSeconds / 5);
    const tx = await contract.AssembledTransaction.build({
      contractId: req.asset, method: "transfer", networkPassphrase: Networks.TESTNET, rpcUrl: RPC, parseResultXdr: (r: any) => r,
      args: [nativeToScVal(cuenta, { type: "address" }), nativeToScVal(req.payTo, { type: "address" }), nativeToScVal(req.amount, { type: "i128" })],
    });
    await tx.signAuthEntries({ address: cuenta, authorizeEntry: (e: any) => authorizeEntry(e, agente, maxLedger, Networks.TESTNET) });
    await tx.simulate(); // footprint con __check_auth; si el contrato rechaza (tope, máx.), falla aquí sin tx
    const sim: any = tx.simulation;
    if (sim && "error" in sim) throw new Error("El contrato rechazó el pago: " + sim.error);
    return { x402Version, payload: { transaction: tx.built!.toXDR() } };
  },
};

const pagarFetch = wrapFetchWithPayment(fetch, x402Client.fromConfig({ schemes: [{ network: "stellar:*", client: esquemaCuenta as any }], spendControls: false }) /* el tope lo aplica el contrato en cadena */);
try {
  const r = await pagarFetch(url);
  console.log("HTTP", r.status, JSON.stringify(await r.json()).slice(0, 300));
  const pr = r.headers.get("payment-response");
  if (pr) { const c = decodePaymentResponseHeader(pr) as any; console.log("pagador:", c.payer, "tx:", `https://stellar.expert/explorer/testnet/tx/${c.transaction}`); }
} catch (e) { console.log("BLOQUEADO / error:", (e as Error).message.slice(0, 500)); }
