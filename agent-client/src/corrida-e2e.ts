// Q10 (PLAN-OPUS): corrida limpia de punta a punta en testnet.
// deploy de una cuenta-presupuesto nueva → renovar → agente demo (Q7: 4 pagos, 5.º y /caro bloqueados)
// → cobrar_comision → pausar → pago bloqueado por pausa (sin tx) → retirar el saldo libre.
// Uso: OWNER_SECRET=S… AGENT_SECRET_KEY=S… QUICKCHAIN_TESORERIA=G… API_DEMO_URL=http://localhost:4020 \
//      pnpm --filter agent-client exec tsx src/corrida-e2e.ts   → escribe deployments/corrida-q10.json
// Las llaves se leen del entorno y nunca se imprimen.
import { Address, Keypair, Networks, Operation, TransactionBuilder, nativeToScVal, rpc, scValToNative, xdr } from "@stellar/stellar-sdk";
import { randomBytes } from "node:crypto";
import { writeFileSync, readFileSync } from "node:fs";
import { correrAgenteDemo } from "./agente-demo.js";
import { leerEstado, linkExpert, RPC_TESTNET, crearFetchConPresupuesto } from "./sdk.js";
import { PagoBloqueado } from "./errores.js";

const falta = ["OWNER_SECRET", "AGENT_SECRET_KEY", "QUICKCHAIN_TESORERIA"].filter((k) => !process.env[k]);
if (falta.length) throw new Error(`Faltan variables: ${falta.join(", ")}`);
const raiz = new URL("../../", import.meta.url);
const ref = JSON.parse(readFileSync(new URL("deployments/testnet.json", raiz), "utf8"));
const rpcUrl = process.env.STELLAR_RPC_URL || RPC_TESTNET;
const base = process.env.API_DEMO_URL || "http://localhost:4020";
const srv = new rpc.Server(rpcUrl);
const owner = Keypair.fromSecret(process.env.OWNER_SECRET!);
const agente = Keypair.fromSecret(process.env.AGENT_SECRET_KEY!);
const filas: { paso: string; tx?: string; link?: string; nota?: string }[] = [];
const U = (usdc: number) => BigInt(Math.round(usdc * 1e7));

async function enviar(op: xdr.Operation, paso: string) {
  let tx = new TransactionBuilder(await srv.getAccount(owner.publicKey()), { fee: "1000000", networkPassphrase: Networks.TESTNET })
    .addOperation(op).setTimeout(60).build();
  tx = await srv.prepareTransaction(tx);
  tx.sign(owner);
  const env = await srv.sendTransaction(tx);
  if (env.status === "ERROR") throw new Error(`${paso}: Stellar rechazó la tx`);
  const fin: any = await srv.pollTransaction(env.hash, { attempts: 40 });
  if (fin.status !== "SUCCESS") throw new Error(`${paso}: tx ${env.hash} terminó en ${fin.status}`);
  filas.push({ paso, tx: env.hash, link: linkExpert(env.hash) });
  console.log(`✅ ${paso} → ${linkExpert(env.hash)}`);
  return fin;
}
const invocar = (cuenta: string, fn: string, args: xdr.ScVal[], paso: string) =>
  enviar(Operation.invokeContractFunction({ contract: cuenta, function: fn, args }), paso);

// 1. deploy (mismo wasm de Q1 ya subido)
const dep = await enviar(Operation.createCustomContract({
  address: Address.fromString(owner.publicKey()), wasmHash: Buffer.from(ref.wasm_hash, "hex"), salt: randomBytes(32),
  constructorArgs: [
    nativeToScVal(owner.publicKey(), { type: "address" }), xdr.ScVal.scvBytes(Buffer.from(agente.rawPublicKey())),
    nativeToScVal(ref.token_usdc, { type: "address" }), nativeToScVal(process.env.QUICKCHAIN_TESORERIA!, { type: "address" }),
    nativeToScVal(100, { type: "u32" }),
  ],
}), "deploy de la cuenta-presupuesto");
const cuenta = Address.fromScVal(dep.returnValue).toString();
filas[filas.length - 1].nota = `C… = ${cuenta}`;
console.log(`   cuenta: https://stellar.expert/explorer/testnet/contract/${cuenta}`);

// 2. renovar: tope 0,05, máx 0,02 por llamada, recarga 1,05 (≥ US$1 para que /caro llegue al chequeo del máximo por llamada y no al de saldo), fin = ahora + 7 días (≤ 32 días)
const fin = BigInt(Math.floor(Date.now() / 1000) + 7 * 86400);
await invocar(cuenta, "renovar", [nativeToScVal(U(0.05), { type: "i128" }), nativeToScVal(U(0.02), { type: "i128" }), nativeToScVal(fin, { type: "u64" }), nativeToScVal(U(1.05), { type: "i128" })], "renovar (tope 0,05, máx. 0,02, recarga 1,05)");

// 3. agente demo (Q7)
const demo = await correrAgenteDemo({ cuenta, secretoAgente: process.env.AGENT_SECRET_KEY!, base, rpcUrl });
for (const r of demo.resultados) filas.push({ paso: `agente: ${r.paso}`, tx: r.tx, link: r.link, nota: r.ok ? undefined : `${r.motivo ?? "error"} (${r.enCadena ? "contrato, simulación, sin tx" : "sin tx"})` });

// 4. cobrar comisión
const cobro = await invocar(cuenta, "cobrar_comision", [], "cobrar_comision()");
filas[filas.length - 1].nota = `${String(scValToNative(cobro.returnValue))} unidades a la tesorería`;

// 5. pausar y probar un pago (debe bloquearse sin tx)
await invocar(cuenta, "pausar", [], "pausar()");
try {
  await crearFetchConPresupuesto({ cuenta, secretoAgente: process.env.AGENT_SECRET_KEY!, rpcUrl, hostsPermitidos: [new URL(base).host] })(`${base.replace(/\/$/, "")}/tipo-cambio`);
  filas.push({ paso: "pago con la cuenta pausada", nota: "⚠️ NO se bloqueó" });
} catch (e) {
  const m = e instanceof PagoBloqueado ? e.motivo : (e as Error).message.slice(0, 120);
  filas.push({ paso: "pago con la cuenta pausada", nota: `${m} (contrato, simulación, sin tx)` });
  console.log(`⛔ pago con la cuenta pausada: ${m}`);
}

// 6. retirar el saldo libre al dueño
const est = await leerEstado(cuenta, rpcUrl);
const libre = BigInt(String(est.saldo)) - BigInt(String(est.comision_pendiente ?? 0));
await invocar(cuenta, "retirar", [nativeToScVal(owner.publicKey(), { type: "address" }), nativeToScVal(libre, { type: "i128" })], `retirar ${(Number(libre) / 1e7).toFixed(4)} USDC al dueño`);
const finEst = await leerEstado(cuenta, rpcUrl);

const salida = { fecha_cr: new Date().toLocaleString("es-CR", { timeZone: "America/Costa_Rica" }), red: "testnet", cuenta, owner: owner.publicKey(), tesoreria: process.env.QUICKCHAIN_TESORERIA, wasm_hash: ref.wasm_hash, api: base, filas,
  estado_final: JSON.parse(JSON.stringify(finEst, (_k, v) => (typeof v === "bigint" ? v.toString() : v))) };
writeFileSync(new URL("deployments/corrida-q10.json", raiz), JSON.stringify(salida, null, 2) + "\n");
console.log("\n| paso | link Stellar Expert testnet | nota |\n|---|---|---|");
for (const f of filas) console.log(`| ${f.paso} | ${f.tx ? `[${f.tx.slice(0, 8)}…](${f.link})` : "— (sin tx)"} | ${f.nota ?? ""} |`);
