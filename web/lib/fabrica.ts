// Fábrica de cuentas-presupuesto (contracts/fabrica-presupuesto):
//   crear(owner: Address, agente: BytesN<32>, salt: BytesN<32>) -> Address
//   listar(owner: Address) -> Vec<Address>
import { Address, Networks, StrKey, contract, nativeToScVal, scValToNative, xdr } from "@stellar/stellar-sdk";
import { RPC_TESTNET } from "./renovar";

export const FABRICA_ID = process.env.NEXT_PUBLIC_FACTORY_CONTRACT_ID || "CAVWWLDYBCYFPDZT5P5XW7GSOQHE6TVLSZXQ47RIJKGEKUSD23AZ34MO";
/** Agente de la demo: la llave que usa el servidor de /demo («Correr agente», AGENT_SECRET_KEY en Vercel).
 * Antes era eb54a995… (deployments/testnet.json), cuya secreta no está disponible. Ver docs/2026-10-26-boton-correr-agente.md. */
export const AGENTE_DEMO_HEX = "253e5b859c4905aebdbefbfd89dd7d56d0e74686d7791e2f5ece6532a5abc7c9";

/** Acepta una clave pública G… o 64 hex y devuelve los 32 bytes ed25519. */
export function agenteABytes(texto: string): Uint8Array {
  const t = texto.trim();
  if (/^[0-9a-fA-F]{64}$/.test(t)) return Uint8Array.from(t.match(/../g)!.map((h) => parseInt(h, 16)));
  if (StrKey.isValidEd25519PublicKey(t)) return Uint8Array.from(StrKey.decodeEd25519PublicKey(t));
  throw new Error("Agent key must be a G… public key or 64 hex characters.");
}

export function argsCrear(owner: string, agente: Uint8Array, salt: Uint8Array): xdr.ScVal[] {
  return [new Address(owner).toScVal(), nativeToScVal(agente, { type: "bytes" }), nativeToScVal(salt, { type: "bytes" })];
}

/** `listar(owner)` por simulación. */
export async function listarCuentas(owner: string, rpcUrl = RPC_TESTNET): Promise<string[]> {
  const tx = await contract.AssembledTransaction.build({
    contractId: FABRICA_ID, method: "listar", args: [new Address(owner).toScVal()], networkPassphrase: Networks.TESTNET, rpcUrl,
    parseResultXdr: (r: any) => scValToNative(r),
  });
  return (tx.result as string[]) ?? [];
}
