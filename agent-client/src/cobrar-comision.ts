// Q8: llama `cobrar_comision()` (pública) de una cuenta-presupuesto. El contrato manda
// min(comision_pendiente, saldo) a la tesorería fija del constructor; quien llama solo paga el fee de red.
// Uso: BUDGET_CONTRACT_ID=C… COBRADOR_SECRET=S… pnpm --filter agent-client cobrar-comision
// (COBRADOR_SECRET: cualquier G… con XLM; se lee del entorno y no se imprime).
import "dotenv/config";
import { Keypair, Networks, Operation, TransactionBuilder, rpc, scValToNative } from "@stellar/stellar-sdk";
import { leerEstado, linkExpert, RPC_TESTNET } from "./sdk.js";

const cuenta = process.env.BUDGET_CONTRACT_ID;
const secreto = process.env.COBRADOR_SECRET;
if (!cuenta || !secreto) throw new Error("Faltan BUDGET_CONTRACT_ID y/o COBRADOR_SECRET");
const rpcUrl = process.env.STELLAR_RPC_URL || RPC_TESTNET;
const servidor = new rpc.Server(rpcUrl);
const cobrador = Keypair.fromSecret(secreto);

const antes = await leerEstado(cuenta, rpcUrl);
console.log("Comisión pendiente antes:", String(antes.comision_pendiente ?? antes.pendiente), "(unidades de 7 decimales)");
let tx = new TransactionBuilder(await servidor.getAccount(cobrador.publicKey()), { fee: "1000000", networkPassphrase: Networks.TESTNET })
  .addOperation(Operation.invokeContractFunction({ contract: cuenta, function: "cobrar_comision", args: [] })).setTimeout(60).build();
tx = await servidor.prepareTransaction(tx);
tx.sign(cobrador);
const env = await servidor.sendTransaction(tx);
if (env.status === "ERROR") throw new Error("Stellar rechazó la tx");
const fin: any = await servidor.pollTransaction(env.hash, { attempts: 30 });
if (fin.status !== "SUCCESS") throw new Error(`La tx ${env.hash} terminó en ${fin.status}`);
console.log("Cobrado a la tesorería:", String(scValToNative(fin.returnValue)), "unidades →", linkExpert(env.hash));
