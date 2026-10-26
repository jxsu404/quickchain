// Despliega una instancia DESECHABLE de la cuenta-presupuesto (wasm de Q1 ya instalado en testnet)
// para probar que una C… paga x402. Dueño = PAGADOR; tesorería = TESORERIA si existe (si no, el dueño); agente = llave nueva.
// Llaves solo en QC_SECRETS_FILE (fuera del repo). Imprime links de Stellar Expert.
import { Address, Keypair, Networks, Operation, TransactionBuilder, nativeToScVal, rpc, xdr } from "@stellar/stellar-sdk";
import { readFileSync, appendFileSync } from "node:fs";
import { randomBytes as rb } from "node:crypto";

const ARCHIVO = process.env.QC_SECRETS_FILE!;
const WASM = process.env.CUENTA_WASM_HASH ?? "7190eb76ae99f35f71854e4c06bc89db3b17025ff836693c7b87b874b9163288"; // deployments/testnet.json (PR #11)
const USDC_SAC = "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA"; // USDC:GBBD47… (Circle) en testnet
const env: Record<string, string> = Object.fromEntries(readFileSync(ARCHIVO, "utf8").split("\n").filter(Boolean).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
const servidor = new rpc.Server("https://soroban-testnet.stellar.org");
const dueno = Keypair.fromSecret(env.PAGADOR_SECRET);
if (!env.AGENTE_SECRET) { env.AGENTE_SECRET = Keypair.random().secret(); appendFileSync(ARCHIVO, `AGENTE_SECRET=${env.AGENTE_SECRET}\n`); }
const agente = Keypair.fromSecret(env.AGENTE_SECRET);

async function enviar(op: xdr.Operation) {
  const cuenta = await servidor.getAccount(dueno.publicKey());
  let t = new TransactionBuilder(cuenta, { fee: "1000000", networkPassphrase: Networks.TESTNET }).addOperation(op).setTimeout(60).build();
  t = await servidor.prepareTransaction(t); t.sign(dueno);
  const r = await servidor.sendTransaction(t);
  if (r.status === "ERROR") throw new Error("send " + JSON.stringify(r.errorResult));
  const fin = await servidor.pollTransaction(r.hash, { attempts: 30 });
  if (fin.status !== "SUCCESS") throw new Error("tx " + fin.status + " " + r.hash);
  return { hash: r.hash, fin };
}

const CLAVE = process.env.CLAVE_CUENTA ?? "CUENTA_C"; // otra clave = otra instancia
const tesoreria = env.TESORERIA_SECRET ? Keypair.fromSecret(env.TESORERIA_SECRET).publicKey() : dueno.publicKey();
let cuentaC = env[CLAVE];
if (!cuentaC) {
  const { hash, fin } = await enviar(Operation.createCustomContract({
    address: Address.fromString(dueno.publicKey()), wasmHash: Buffer.from(WASM, "hex"), salt: rb(32),
    constructorArgs: [nativeToScVal(dueno.publicKey(), { type: "address" }), xdr.ScVal.scvBytes(agente.rawPublicKey()),
      nativeToScVal(USDC_SAC, { type: "address" }), nativeToScVal(tesoreria, { type: "address" }), nativeToScVal(100, { type: "u32" })],
  }));
  cuentaC = Address.fromScVal((fin as any).returnValue).toString();
  appendFileSync(ARCHIVO, `${CLAVE}=${cuentaC}\n`);
  console.log(`deploy ${cuentaC}: https://stellar.expert/explorer/testnet/tx/${hash}`);
}
if (process.env.RENOVAR !== "0") {
  const fin = BigInt(Date.parse(process.env.FIN_PERIODO ?? "2026-11-01T00:00:00-06:00") / 1000);
  const { hash } = await enviar(Operation.invokeContractFunction({ contract: cuentaC, function: "renovar", args: [
    nativeToScVal(BigInt(process.env.TOPE ?? 500000), { type: "i128" }), nativeToScVal(BigInt(process.env.MAX ?? 200000), { type: "i128" }),
    nativeToScVal(fin, { type: "u64" }), nativeToScVal(BigInt(process.env.RECARGA ?? 500000), { type: "i128" })] }));
  console.log(`renovar: https://stellar.expert/explorer/testnet/tx/${hash}`);
}
console.log("cuenta C:", cuentaC, `https://stellar.expert/explorer/testnet/contract/${cuentaC}`);
