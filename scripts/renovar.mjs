#!/usr/bin/env node
// Plan B de Q4 (sin Cavos): el dueño firma `renovar` de su cuenta-presupuesto con su llave, en testnet.
// renovar(tope: i128, max_por_llamada: i128, fin_periodo: u64, recarga: i128) — mismos tipos que web/lib/renovar.ts.
// Uso: pnpm renovar --tope 0.05 --max 0.02 --recarga 0.05 [--fin <unix>] [--contrato C…] [--tesoreria G…] [--simular]
// Lee OWNER_SECRET (o, con --simular, OWNER_ADDRESS) y BUDGET_CONTRACT_ID de .env o del entorno. Nunca imprime la secreta.
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(raiz, "agent-client", "package.json"));
require("dotenv").config({ path: path.join(raiz, ".env"), quiet: true });
const { Keypair, Networks, Operation, TransactionBuilder, contract, nativeToScVal, rpc, scValToNative } = require("@stellar/stellar-sdk");

const USDC_SAC = "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";
const ERRORES = ["", "Pausada", "PeriodoVencido", "FirmaInvalida", "AgenteDesconocido", "OperacionNoPermitida", "MontoInvalido", "MontoPorLlamada", "TopeAlcanzado", "PeriodoInvalido", "ParametrosInvalidos"];
const RPC = process.env.STELLAR_RPC_URL || "https://soroban-testnet.stellar.org";
const PASS = Networks.TESTNET;
const linkTx = (h) => `https://stellar.expert/explorer/testnet/tx/${h}`;

const { values: a } = parseArgs({
  options: {
    tope: { type: "string" }, max: { type: "string" }, recarga: { type: "string", default: "0" }, fin: { type: "string" },
    contrato: { type: "string" }, tesoreria: { type: "string" }, simular: { type: "boolean", default: false },
  },
});

function unidades(texto, campo) {
  const m = /^(\d+)(?:[.,](\d{0,7}))?$/.exec(String(texto ?? "").trim());
  if (!m) throw new Error(`--${campo} inválido: "${texto}" (USDC con hasta 7 decimales, ej. 0.05)`);
  return BigInt(m[1]) * 10_000_000n + BigInt((m[2] ?? "").padEnd(7, "0"));
}
const usdc = (u) => (Number(u) / 1e7).toString();
function finDeMesCR(ahoraMs = Date.now()) {
  const cr = new Date(ahoraMs - 6 * 3600_000);
  return BigInt(Date.UTC(cr.getUTCFullYear(), cr.getUTCMonth() + 1, 1, 6) / 1000);
}
function explicar(texto) {
  if (/trustline|balance is not sufficient|resulting balance is not within/i.test(texto)) return "el dueño no tiene trustline o saldo USDC suficiente para la recarga";
  const n = Number(/Error\(Contract, #(\d+)\)/.exec(texto)?.[1]);
  return ERRORES[n] ? `${ERRORES[n]} (Error(Contract, #${n}))` : texto.slice(0, 600);
}
function salir(msg) { console.error(`renovar: ${msg}`); process.exit(1); }

const contratoId = a.contrato || process.env.BUDGET_CONTRACT_ID;
if (!contratoId) salir("falta --contrato o BUDGET_CONTRACT_ID");
if (!a.tope || !a.max) salir("faltan --tope y --max (USDC)");
const llave = process.env.OWNER_SECRET ? Keypair.fromSecret(process.env.OWNER_SECRET) : null;
const duenio = llave?.publicKey() ?? (a.simular ? process.env.OWNER_ADDRESS : undefined);
if (!duenio) salir(a.simular ? "falta OWNER_SECRET u OWNER_ADDRESS" : "falta OWNER_SECRET (o usá --simular con OWNER_ADDRESS)");

const p = { tope: unidades(a.tope, "tope"), max: unidades(a.max, "max"), recarga: unidades(a.recarga, "recarga"), fin: a.fin ? BigInt(a.fin) : finDeMesCR() };
const ahora = BigInt(Math.floor(Date.now() / 1000));
if (p.tope <= 0n || p.max <= 0n || p.max > p.tope) salir("tiene que cumplirse 0 < max ≤ tope");
if (p.fin <= ahora || p.fin > ahora + 32n * 86_400n) salir("--fin tiene que estar entre ahora y 32 días");

const estado = async () => (await contract.AssembledTransaction.build({
  contractId: contratoId, method: "estado", args: [], networkPassphrase: PASS, rpcUrl: RPC, parseResultXdr: (r) => scValToNative(r),
})).result;

const e = await estado();
const problemas = [];
if (e.owner !== duenio) problemas.push(`el dueño del contrato es ${e.owner}, no ${duenio}`);
if (Number(e.fee_bps) !== 100) problemas.push(`fee_bps = ${e.fee_bps}, no 100 (1 %)`);
if (e.token !== USDC_SAC) problemas.push(`el token ${e.token} no es el USDC de Circle en testnet`);
const tesoreria = a.tesoreria || process.env.QUICKCHAIN_TESORERIA;
if (tesoreria && e.tesoreria !== tesoreria) problemas.push(`la tesorería ${e.tesoreria} no es ${tesoreria}`);
console.log(`Cuenta ${contratoId}: dueño ${e.owner}, tesorería ${e.tesoreria}, comisión ${Number(e.fee_bps) / 100} %, saldo ${usdc(e.saldo)} USDC`);
if (problemas.length) salir(`no se firma: ${problemas.join("; ")}`);

const fechaCR = new Date(Number(p.fin) * 1000).toLocaleString("es-CR", { timeZone: "America/Costa_Rica" });
console.log(`renovar(tope ${usdc(p.tope)}, máx. ${usdc(p.max)}, fin ${p.fin} = ${fechaCR} CR, recarga ${usdc(p.recarga)}) USDC`);
const servidor = new rpc.Server(RPC);
let tx = new TransactionBuilder(await servidor.getAccount(duenio), { fee: "1000000", networkPassphrase: PASS })
  .addOperation(Operation.invokeContractFunction({
    contract: contratoId, function: "renovar",
    args: [nativeToScVal(p.tope, { type: "i128" }), nativeToScVal(p.max, { type: "i128" }), nativeToScVal(p.fin, { type: "u64" }), nativeToScVal(p.recarga, { type: "i128" })],
  }))
  .setTimeout(120).build();
const sim = await servidor.simulateTransaction(tx);
if (rpc.Api.isSimulationError(sim)) salir(`la simulación falló: ${explicar(sim.error)}`);
console.log(`Simulación OK (fee de recursos ${sim.minResourceFee} stroops).`);
if (a.simular) process.exit(0);

tx = rpc.assembleTransaction(tx, sim).build();
tx.sign(llave);
const enviado = await servidor.sendTransaction(tx);
if (enviado.status === "ERROR") salir(`Stellar rechazó la tx ${enviado.hash}`);
const fin = await servidor.pollTransaction(enviado.hash, { attempts: 30 });
if (fin.status !== "SUCCESS") salir(`la tx ${enviado.hash} terminó en ${fin.status}: ${linkTx(enviado.hash)}`);
console.log(`renovar OK: ${linkTx(enviado.hash)}`);
const d = await estado();
console.log(`Estado: periodo ${d.periodo}, tope ${usdc(d.tope)}, gastado ${usdc(d.gastado)}, saldo ${usdc(d.saldo)} USDC`);
