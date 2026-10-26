#!/usr/bin/env node
// Q1: pruebas reales en testnet de `cuenta-presupuesto` (ver docs/pruebas-q1.md).
// Lee las llaves de .env (ignorado por git) y NUNCA las imprime. Si faltan las
// cuentas auxiliares de prueba (tesorería, vendedor, segunda llave del agente y
// una llave ajena), las genera y las agrega a .env.
// Uso: node scripts/pruebas-q1.mjs   → escribe deployments/pruebas-q1.json
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(raiz, "agent-client", "package.json"));
const sdk = require("@stellar/stellar-sdk");
const { Keypair, TransactionBuilder, Networks, Operation, Asset, Address, nativeToScVal, scValToNative, rpc, Horizon, xdr, authorizeEntry, Contract } = sdk;

const RPC_URL = "https://soroban-testnet.stellar.org";
const HORIZON_URL = "https://horizon-testnet.stellar.org";
const PASS = Networks.TESTNET;
const USDC_ASSET = new Asset("USDC", "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5");
const USDC_SAC = USDC_ASSET.contractId(PASS);
const WASM_HASH = JSON.parse(fs.readFileSync(path.join(raiz, "deployments/testnet.json"), "utf8")).wasm_hash;
const EXPERT = "https://stellar.expert/explorer/testnet";

// ---- .env (sin imprimir valores) ----
const envPath = path.join(raiz, ".env");
const env = Object.fromEntries(
  fs.readFileSync(envPath, "utf8").split("\n").filter((l) => /^[A-Z0-9_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
);
for (const n of ["PRUEBA_TESORERIA_SECRET_KEY", "PRUEBA_VENDEDOR_SECRET_KEY", "PRUEBA_AGENTE2_SECRET_KEY", "PRUEBA_AJENA_SECRET_KEY"]) {
  if (!env[n]) {
    env[n] = Keypair.random().secret();
    fs.appendFileSync(envPath, `${n}=${env[n]}\n`);
  }
}
const owner = Keypair.fromSecret(env.DEPLOYER_SECRET_KEY);
const agente = Keypair.fromSecret(env.AGENT_SECRET_KEY);
const tesoreria = Keypair.fromSecret(env.PRUEBA_TESORERIA_SECRET_KEY);
const vendedor = Keypair.fromSecret(env.PRUEBA_VENDEDOR_SECRET_KEY);
const agente2 = Keypair.fromSecret(env.PRUEBA_AGENTE2_SECRET_KEY);
const ajena = Keypair.fromSecret(env.PRUEBA_AJENA_SECRET_KEY);

const server = new rpc.Server(RPC_URL);
const horizon = new Horizon.Server(HORIZON_URL);
const resultados = [];
const ahoraCR = () => new Date().toLocaleString("es-CR", { timeZone: "America/Costa_Rica" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function registrar(r) {
  resultados.push({ ...r, hora_cr: ahoraCR() });
  const link = r.tx ? ` ${EXPERT}/tx/${r.tx}` : "";
  console.log(`[${r.ok ? "OK" : "FALLA"}] ${r.prueba}: ${r.real}${link}`);
}

async function friendbot(k) {
  try { await horizon.loadAccount(k.publicKey()); } catch { await fetch(`https://friendbot.stellar.org/?addr=${k.publicKey()}`); await sleep(3000); }
}

async function clasica(k, ops) {
  const acc = await horizon.loadAccount(k.publicKey());
  const b = new TransactionBuilder(acc, { fee: "1000", networkPassphrase: PASS }).setTimeout(60);
  ops.forEach((o) => b.addOperation(o));
  const tx = b.build();
  tx.sign(k);
  const r = await horizon.submitTransaction(tx);
  return { hash: r.hash, fee: Number(r.fee_charged ?? 0) };
}

async function trustline(k) {
  const acc = await horizon.loadAccount(k.publicKey());
  if (acc.balances.some((b) => b.asset_code === "USDC" && b.asset_issuer === USDC_ASSET.issuer)) return null;
  return clasica(k, [Operation.changeTrust({ asset: USDC_ASSET })]);
}

async function esperar(hash) {
  for (let i = 0; i < 40; i++) {
    const r = await server.getTransaction(hash);
    if (r.status === "SUCCESS") return r;
    if (r.status === "FAILED") throw new Error(`tx ${hash} FAILED`);
    await sleep(1500);
  }
  throw new Error(`tx ${hash} sin confirmar`);
}

function feeCobrado(r) {
  try { return Number(r.resultXdr.feeCharged().toString()); } catch { return null; }
}

function errorLegible(e) {
  const s = typeof e === "string" ? e : (e?.error ?? e?.message ?? JSON.stringify(e));
  const m = String(s).match(/Error\(Contract, #(\d+)\)/);
  const nombres = { 1: "Pausada", 2: "PeriodoVencido", 3: "FirmaInvalida", 4: "AgenteDesconocido", 5: "OperacionNoPermitida", 6: "MontoInvalido", 7: "MontoPorLlamada", 8: "TopeAlcanzado", 9: "PeriodoInvalido", 10: "ParametrosInvalidos" };
  if (m) return `Error(Contract, #${m[1]}) = ${nombres[m[1]] ?? "?"}`;
  const a = String(s).match(/Error\(Auth, \w+\)|Error\(Crypto, \w+\)|Error\(\w+, \w+\)/);
  return a ? a[0] : String(s).slice(0, 160);
}

// Invocación firmada por una cuenta G clásica (dueño, tesorería, etc.).
async function invocarG(firmante, contrato, fn, args) {
  const acc = await server.getAccount(firmante.publicKey());
  let tx = new TransactionBuilder(acc, { fee: "100000", networkPassphrase: PASS })
    .addOperation(new Contract(contrato).call(fn, ...args)).setTimeout(60).build();
  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) return { error: errorLegible(sim.error) };
  tx = rpc.assembleTransaction(tx, sim).build();
  tx.sign(firmante);
  const env_ = await server.sendTransaction(tx);
  if (env_.status === "ERROR") return { error: errorLegible(JSON.stringify(env_.errorResult)) };
  const r = await esperar(env_.hash);
  let ret = null;
  try { ret = r.returnValue ? scValToNative(r.returnValue) : null; } catch {}
  return { tx: env_.hash, fee: feeCobrado(r), ret };
}

// Pago del agente: USDC.transfer(C, to, monto). Lo envía `remitente` (como haría
// un facilitador) y la auth de C la firma `llaveAgente` (authorizeEntry).
// Doble simulación: la 1.ª en modo grabación, la 2.ª con la auth firmada
// (ahí corre __check_auth y aparecen los bloqueos, sin generar tx).
async function pagoAgente(cuenta, llaveAgente, to, monto, remitente = vendedor) {
  const acc = await server.getAccount(remitente.publicKey());
  const op = new Contract(USDC_SAC).call("transfer", new Address(cuenta).toScVal(), new Address(to).toScVal(), nativeToScVal(BigInt(monto), { type: "i128" }));
  let tx = new TransactionBuilder(acc, { fee: "100000", networkPassphrase: PASS }).addOperation(op).setTimeout(60).build();
  const sim1 = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim1)) return { error: errorLegible(sim1.error), etapa: "simulación 1" };
  const ultimo = sim1.latestLedger + 60;
  const auths = await Promise.all(
    (sim1.result.auth ?? []).map((a) =>
      a.credentials().switch() === xdr.SorobanCredentialsType.sorobanCredentialsAddress() ? authorizeEntry(a, llaveAgente, ultimo, PASS) : a,
    ),
  );
  const op2 = Operation.invokeHostFunction({ func: tx.operations[0].func, auth: auths });
  const acc2 = await server.getAccount(remitente.publicKey());
  let tx2 = new TransactionBuilder(acc2, { fee: "100000", networkPassphrase: PASS }).addOperation(op2).setTimeout(60).build();
  const sim2 = await server.simulateTransaction(tx2);
  if (rpc.Api.isSimulationError(sim2)) return { error: errorLegible(sim2.error), etapa: "simulación 2 (con __check_auth)" };
  tx2 = rpc.assembleTransaction(tx2, sim2).build();
  tx2.sign(remitente);
  const s = await server.sendTransaction(tx2);
  if (s.status === "ERROR") return { error: errorLegible(JSON.stringify(s.errorResult)), etapa: "envío" };
  const r = await esperar(s.hash);
  return { tx: s.hash, fee: feeCobrado(r) };
}

async function estado(cuenta) {
  const acc = await server.getAccount(owner.publicKey());
  const tx = new TransactionBuilder(acc, { fee: "100", networkPassphrase: PASS }).addOperation(new Contract(cuenta).call("estado")).setTimeout(60).build();
  const sim = await server.simulateTransaction(tx);
  const e = scValToNative(sim.result.retval);
  return Object.fromEntries(Object.entries(e).map(([k, v]) => [k, typeof v === "bigint" ? v.toString() : v instanceof Uint8Array || Buffer.isBuffer(v) ? Buffer.from(v).toString("hex") : v]));
}

async function saldoUSDC(g) {
  const a = await horizon.loadAccount(g);
  const b = a.balances.find((x) => x.asset_code === "USDC" && x.asset_issuer === USDC_ASSET.issuer);
  return b ? Math.round(Number(b.balance) * 1e7) : 0;
}

const i128 = (n) => nativeToScVal(BigInt(n), { type: "i128" });
const u64 = (n) => nativeToScVal(BigInt(n), { type: "u64" });
const hex = (k) => xdr.ScVal.scvBytes(k.rawPublicKey());

async function main() {
  const salida = { fecha_cr: ahoraCR(), red: "testnet", usdc_sac: USDC_SAC, usdc_asset: `USDC:${USDC_ASSET.issuer}`, wasm_hash: WASM_HASH, cuentas: {}, preparacion: [], pruebas: resultados };
  // 0. Cuentas de prueba: friendbot + trustline USDC.
  for (const k of [owner, tesoreria, vendedor, ajena]) await friendbot(k);
  for (const [n, k] of [["owner", owner], ["tesoreria", tesoreria], ["vendedor", vendedor]]) {
    const t = await trustline(k);
    if (t) salida.preparacion.push({ paso: `trustline USDC (${n})`, tx: t.hash, fee: t.fee });
  }
  salida.cuentas = { owner: owner.publicKey(), tesoreria: tesoreria.publicKey(), vendedor: vendedor.publicKey(), agente_hex: Buffer.from(agente.rawPublicKey()).toString("hex"), agente2_hex: Buffer.from(agente2.rawPublicKey()).toString("hex"), llave_ajena_hex: Buffer.from(ajena.rawPublicKey()).toString("hex") };

  // 0b. USDC de prueba para el dueño.
  if ((await saldoUSDC(owner.publicKey())) < 2_000_000) {
    let faucet = "";
    try {
      const r = await fetch("https://faucet.circle.com/api/faucet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ address: owner.publicKey(), blockchain: "stellar-testnet" }) });
      faucet = `HTTP ${r.status}: ${(await r.text()).slice(0, 120).replace(/\s+/g, " ")}`;
    } catch (e) { faucet = String(e).slice(0, 120); }
    salida.preparacion.push({ paso: "faucet de Circle por API (sin navegador)", resultado: faucet });
    await sleep(8000);
    if ((await saldoUSDC(owner.publicKey())) < 2_000_000) {
      // Plan B usado: cambiar XLM de testnet (friendbot) por USDC de Circle en el DEX de testnet.
      const t = await clasica(owner, [Operation.pathPaymentStrictReceive({ sendAsset: Asset.native(), sendMax: "50", destination: owner.publicKey(), destAsset: USDC_ASSET, destAmount: "2", path: [] })]);
      salida.preparacion.push({ paso: "2 USDC de Circle vía path payment XLM→USDC en el DEX de testnet", tx: t.hash, fee: t.fee });
    }
  }

  // 0c. Instancia nueva solo para pruebas (tesorería distinta del dueño).
  const dep = spawnSync("stellar", ["contract", "deploy", "--wasm-hash", WASM_HASH, "--", "--owner", owner.publicKey(), "--agente", Buffer.from(agente.rawPublicKey()).toString("hex"), "--token", USDC_SAC, "--tesoreria", tesoreria.publicKey(), "--fee_bps", "100"], {
    env: { ...process.env, STELLAR_ACCOUNT: env.DEPLOYER_SECRET_KEY, STELLAR_NETWORK: "testnet", STELLAR_RPC_URL: RPC_URL, STELLAR_NETWORK_PASSPHRASE: PASS },
    encoding: "utf8",
  });
  if (dep.status !== 0) throw new Error("deploy falló: " + errorLegible(dep.stderr));
  const cuenta = dep.stdout.trim().split("\n").pop();
  salida.deploy_tx = (dep.stderr.match(/tx\/([0-9a-f]{64})/) ?? [])[1] ?? null;
  salida.contrato_pruebas = cuenta;
  console.log(`Instancia de pruebas: ${EXPERT}/contract/${cuenta}`);
  await sleep(3000);

  const CENT = 100_000; // US$0,01
  const ahora = Math.floor(Date.now() / 1000);
  const fin = ahora + 7 * 24 * 3600;
  const tesoreriaAntes = await saldoUSDC(tesoreria.publicKey());
  const vendedorAntes = await saldoUSDC(vendedor.publicKey());

  // 1. renovar
  let r = await invocarG(owner, cuenta, "renovar", [i128(5 * CENT), i128(2 * CENT), u64(fin), i128(10 * CENT)]);
  registrar({ prueba: "01 renovar (tope 0,05; máx 0,02; 7 días; recarga 0,10)", comando: "renovar(500000, 200000, ahora+7d, 1000000) firmado por el dueño", esperado: "tx OK; saldo de C = 1.000.000; periodo 1", real: r.error ?? `tx OK; estado: ${JSON.stringify(await estado(cuenta))}`, ok: !r.error, tx: r.tx, fee: r.fee });
  // 2. pago válido
  r = await pagoAgente(cuenta, agente, vendedor.publicKey(), CENT);
  registrar({ prueba: "02 pago válido 0,01 al vendedor", comando: "USDC.transfer(C, vendedor, 100000), auth de C firmada por el agente", esperado: "tx OK; gastado 101.000; comisión 1.000", real: r.error ?? `tx OK; gastado ${(await estado(cuenta)).gastado}, pendiente ${(await estado(cuenta)).comision_pendiente}`, ok: !r.error, tx: r.tx, fee: r.fee });
  // 3. máximo por llamada
  r = await pagoAgente(cuenta, agente, vendedor.publicKey(), 3 * CENT);
  registrar({ prueba: "03 pago de 0,03 (> máx 0,02)", comando: "USDC.transfer(C, vendedor, 300000)", esperado: "bloqueado: Error(Contract, #7) MontoPorLlamada; sin tx", real: r.error ? `bloqueado en ${r.etapa}: ${r.error}` : "NO se bloqueó", ok: !!r.error && r.error.includes("#7"), tx: r.tx });
  // 4. firma ajena
  r = await pagoAgente(cuenta, ajena, vendedor.publicKey(), CENT);
  registrar({ prueba: "04 firma de una llave que no es la del agente", comando: "USDC.transfer(C, vendedor, 100000) firmado con otra llave ed25519", esperado: "bloqueado: Error(Contract, #4) AgenteDesconocido; sin tx", real: r.error ? `bloqueado en ${r.etapa}: ${r.error}` : "NO se bloqueó", ok: !!r.error && r.error.includes("#4"), tx: r.tx });
  // 5. pausa
  r = await invocarG(owner, cuenta, "pausar", []);
  registrar({ prueba: "05a pausar", comando: "pausar() firmado por el dueño", esperado: "tx OK; pausada = true", real: r.error ?? `tx OK; pausada = ${(await estado(cuenta)).pausada}`, ok: !r.error, tx: r.tx, fee: r.fee });
  r = await pagoAgente(cuenta, agente, vendedor.publicKey(), CENT);
  registrar({ prueba: "05b pago con la cuenta pausada", comando: "USDC.transfer(C, vendedor, 100000)", esperado: "bloqueado: Error(Contract, #1) Pausada; sin tx", real: r.error ? `bloqueado en ${r.etapa}: ${r.error}` : "NO se bloqueó", ok: !!r.error && r.error.includes("#1"), tx: r.tx });
  r = await invocarG(owner, cuenta, "reanudar", []);
  registrar({ prueba: "05c reanudar", comando: "reanudar() firmado por el dueño", esperado: "tx OK; pausada = false", real: r.error ?? `tx OK; pausada = ${(await estado(cuenta)).pausada}`, ok: !r.error, tx: r.tx, fee: r.fee });
  // 6. rotación
  r = await invocarG(owner, cuenta, "cambiar_agente", [hex(agente2)]);
  registrar({ prueba: "06a cambiar_agente a una llave nueva", comando: "cambiar_agente(llave2) firmado por el dueño", esperado: "tx OK", real: r.error ?? "tx OK", ok: !r.error, tx: r.tx, fee: r.fee });
  r = await pagoAgente(cuenta, agente, vendedor.publicKey(), CENT);
  registrar({ prueba: "06b pago con la llave vieja", comando: "USDC.transfer(C, vendedor, 100000) firmado con la llave vieja", esperado: "bloqueado: Error(Contract, #4) AgenteDesconocido; sin tx", real: r.error ? `bloqueado en ${r.etapa}: ${r.error}` : "NO se bloqueó", ok: !!r.error && r.error.includes("#4"), tx: r.tx });
  r = await pagoAgente(cuenta, agente2, vendedor.publicKey(), CENT);
  registrar({ prueba: "06c pago con la llave nueva (2.º pago)", comando: "USDC.transfer(C, vendedor, 100000) firmado con la llave nueva", esperado: "tx OK; gastado 202.000", real: r.error ?? `tx OK; gastado ${(await estado(cuenta)).gastado}`, ok: !r.error, tx: r.tx, fee: r.fee });
  // 7. pagos hasta topar
  for (const n of [3, 4]) {
    r = await pagoAgente(cuenta, agente2, vendedor.publicKey(), CENT);
    registrar({ prueba: `07${n === 3 ? "a" : "b"} pago ${n}.º de 0,01`, comando: "USDC.transfer(C, vendedor, 100000)", esperado: `tx OK; gastado ${n * 101000}`, real: r.error ?? `tx OK; gastado ${(await estado(cuenta)).gastado}`, ok: !r.error, tx: r.tx, fee: r.fee });
  }
  r = await pagoAgente(cuenta, agente2, vendedor.publicKey(), CENT);
  registrar({ prueba: "07c 5.º pago de 0,01 (pasaría a 505.000 > tope 500.000)", comando: "USDC.transfer(C, vendedor, 100000)", esperado: "bloqueado: Error(Contract, #8) TopeAlcanzado; sin tx", real: r.error ? `bloqueado en ${r.etapa}: ${r.error}` : "NO se bloqueó", ok: !!r.error && r.error.includes("#8"), tx: r.tx });
  // 7d. el último hueco: 0,0096 + 96 de comisión = 96.96… → probar el monto exacto que llena el tope
  const e7 = await estado(cuenta);
  const hueco = BigInt(e7.restante); // 96.000
  // máximo monto m con m + ceil(m/100) <= hueco
  let m = (hueco * 100n) / 101n; while (m + (m + 99n) / 100n > hueco) m--; 
  r = await pagoAgente(cuenta, agente2, vendedor.publicKey(), Number(m));
  registrar({ prueba: `07d pago que llena el tope exacto (${m} + comisión)`, comando: `USDC.transfer(C, vendedor, ${m})`, esperado: `tx OK; gastado ≤ 500.000`, real: r.error ?? `tx OK; gastado ${(await estado(cuenta)).gastado}, restante ${(await estado(cuenta)).restante}`, ok: !r.error, tx: r.tx, fee: r.fee });
  r = await pagoAgente(cuenta, agente2, vendedor.publicKey(), 1);
  registrar({ prueba: "07e 1 stroop extra después del tope", comando: "USDC.transfer(C, vendedor, 1)", esperado: "bloqueado: Error(Contract, #8) TopeAlcanzado", real: r.error ? `bloqueado en ${r.etapa}: ${r.error}` : "NO se bloqueó", ok: !!r.error && r.error.includes("#8"), tx: r.tx });
  // 8. cobrar comisión (la firma la tesorería solo como remitente; no hace falta auth)
  const eAntes = await estado(cuenta);
  r = await invocarG(tesoreria, cuenta, "cobrar_comision", []);
  const tesoreriaDespues = await saldoUSDC(tesoreria.publicKey());
  registrar({ prueba: "08 cobrar_comision", comando: "cobrar_comision() (pública)", esperado: `tx OK; llegan ${eAntes.comision_pendiente} stroops (1 % de lo pagado) a la tesorería`, real: r.error ?? `tx OK; devolvió ${r.ret}; tesorería ${tesoreriaAntes} → ${tesoreriaDespues} (+${tesoreriaDespues - tesoreriaAntes}); pendiente ahora ${(await estado(cuenta)).comision_pendiente}`, ok: !r.error && tesoreriaDespues - tesoreriaAntes === Number(eAntes.comision_pendiente), tx: r.tx, fee: r.fee });
  // 9. retirar
  const e9 = await estado(cuenta);
  r = await invocarG(owner, cuenta, "retirar", [new Address(owner.publicKey()).toScVal(), i128(BigInt(e9.saldo) + 1n)]);
  registrar({ prueba: "09a retirar más del saldo libre", comando: `retirar(dueño, ${BigInt(e9.saldo) + 1n})`, esperado: "bloqueado: Error(Contract, #10) ParametrosInvalidos", real: r.error ? `bloqueado: ${r.error}` : "NO se bloqueó", ok: !!r.error && r.error.includes("#10"), tx: r.tx });
  r = await invocarG(owner, cuenta, "retirar", [new Address(owner.publicKey()).toScVal(), i128(e9.saldo)]);
  registrar({ prueba: "09b retirar todo el saldo libre", comando: `retirar(dueño, ${e9.saldo})`, esperado: "tx OK; saldo de C = 0", real: r.error ?? `tx OK; saldo de C ${(await estado(cuenta)).saldo}`, ok: !r.error, tx: r.tx, fee: r.fee });
  salida.vendedor_recibio = (await saldoUSDC(vendedor.publicKey())) - vendedorAntes;
  salida.estado_final = await estado(cuenta);
  fs.writeFileSync(path.join(raiz, "deployments/pruebas-q1.json"), JSON.stringify(salida, null, 2) + "\n");
  console.log(`\n${resultados.filter((x) => x.ok).length}/${resultados.length} como se esperaba. Detalle: deployments/pruebas-q1.json`);
}
main().catch((e) => { console.error("Error:", errorLegible(e)); process.exit(1); });
