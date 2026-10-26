// Llama al contrato cuenta-presupuesto en Stellar testnet con la llave del agente.
import { Address, BASE_FEE, Contract, Keypair, Networks, TransactionBuilder, nativeToScVal, rpc } from "@stellar/stellar-sdk";

export interface ConfigAgente { rpcUrl: string; contratoId: string; agente: Keypair }

export function leerConfigAgente(env = process.env): ConfigAgente {
  const falta = ["BUDGET_CONTRACT_ID", "AGENT_SECRET_KEY"].filter((k) => !env[k]);
  if (falta.length) throw new Error(`Faltan variables: ${falta.join(", ")}`);
  return {
    rpcUrl: env.STELLAR_RPC_URL || "https://soroban-testnet.stellar.org",
    contratoId: env.BUDGET_CONTRACT_ID!,
    agente: Keypair.fromSecret(env.AGENT_SECRET_KEY!),
  };
}

/** Paga `monto` (unidades de 7 decimales) a `destino` desde el presupuesto. Devuelve el hash de la tx. */
export async function gastar(cfg: ConfigAgente, destino: string, monto: bigint): Promise<string> {
  const server = new rpc.Server(cfg.rpcUrl);
  const cuenta = await server.getAccount(cfg.agente.publicKey());
  const op = new Contract(cfg.contratoId).call("gastar",
    new Address(cfg.agente.publicKey()).toScVal(), new Address(destino).toScVal(), nativeToScVal(monto, { type: "i128" }));
  const tx = new TransactionBuilder(cuenta, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET }).addOperation(op).setTimeout(60).build();
  const lista = await server.prepareTransaction(tx); // simula: si el contrato rechaza (tope), falla aquí sin gastar
  lista.sign(cfg.agente);
  const env = await server.sendTransaction(lista);
  if (env.status === "ERROR") throw new Error(`Stellar rechazó la tx: ${JSON.stringify(env.errorResult)}`);
  const fin = await server.pollTransaction(env.hash);
  if (fin.status !== "SUCCESS") throw new Error(`La tx ${env.hash} terminó en ${fin.status}`);
  return env.hash;
}

export const linkExpert = (hash: string) => `https://stellar.expert/explorer/testnet/tx/${hash}`;
