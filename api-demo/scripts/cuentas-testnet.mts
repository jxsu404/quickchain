// Prepara cuentas desechables de TESTNET: pagador (G…), vendedor (payTo), facilitador y tesorería (Q8).
// Las llaves se guardan SOLO en el archivo indicado por QC_SECRETS_FILE (fuera del repo, chmod 600).
// Nunca imprime secretos. Fondea con friendbot, crea trustline USDC (Circle testnet) y compra USDC
// en el DEX de testnet con XLM (path payment) para el pagador.
import { Asset, Horizon, Keypair, Networks, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import { existsSync, readFileSync, writeFileSync, chmodSync } from "node:fs";

const ARCHIVO = process.env.QC_SECRETS_FILE;
if (!ARCHIVO) throw new Error("Definí QC_SECRETS_FILE (ruta fuera del repo)");
const USDC = new Asset("USDC", "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5");
const horizon = new Horizon.Server("https://horizon-testnet.stellar.org");

const env: Record<string, string> = {};
if (existsSync(ARCHIVO)) for (const l of readFileSync(ARCHIVO, "utf8").split("\n")) { const i = l.indexOf("="); if (i > 0) env[l.slice(0, i)] = l.slice(i + 1); }
for (const rol of ["PAGADOR", "VENDEDOR", "FACILITADOR", "TESORERIA"]) env[`${rol}_SECRET`] ??= Keypair.random().secret();
writeFileSync(ARCHIVO, Object.entries(env).map(([k, v]) => `${k}=${v}`).join("\n") + "\n"); chmodSync(ARCHIVO, 0o600);

const kp = (rol: string) => Keypair.fromSecret(env[`${rol}_SECRET`]);
async function fondear(k: Keypair) {
  try { await horizon.loadAccount(k.publicKey()); return; } catch {}
  const r = await fetch(`https://friendbot.stellar.org/?addr=${k.publicKey()}`); if (!r.ok) throw new Error("friendbot " + r.status);
}
async function tx(k: Keypair, ops: any[]) {
  const cuenta = await horizon.loadAccount(k.publicKey());
  const t = new TransactionBuilder(cuenta, { fee: "1000", networkPassphrase: Networks.TESTNET }).setTimeout(60);
  ops.forEach((o) => t.addOperation(o)); const b = t.build(); b.sign(k);
  const r = await horizon.submitTransaction(b); return r.hash;
}
const tieneTrust = async (k: Keypair) => (await horizon.loadAccount(k.publicKey())).balances.some((b: any) => b.asset_code === "USDC" && b.asset_issuer === USDC.getIssuer());
const saldo = async (k: Keypair) => (await horizon.loadAccount(k.publicKey())).balances.find((b: any) => b.asset_code === "USDC" && b.asset_issuer === USDC.getIssuer())?.balance ?? "0";

for (const rol of ["PAGADOR", "VENDEDOR", "FACILITADOR", "TESORERIA"]) { await fondear(kp(rol)); console.log(rol, kp(rol).publicKey()); }
for (const rol of ["PAGADOR", "VENDEDOR", "TESORERIA"]) if (!(await tieneTrust(kp(rol)))) {
  const h = await tx(kp(rol), [Operation.changeTrust({ asset: USDC })]);
  console.log(`trustline ${rol}: https://stellar.expert/explorer/testnet/tx/${h}`);
}
const meta = process.env.USDC_META ?? "2";
if (Number(await saldo(kp("PAGADOR"))) < Number(meta)) {
  const h = await tx(kp("PAGADOR"), [Operation.pathPaymentStrictReceive({ sendAsset: Asset.native(), sendMax: "2000", destination: kp("PAGADOR").publicKey(), destAsset: USDC, destAmount: meta, path: [] })]);
  console.log(`compra USDC (DEX testnet): https://stellar.expert/explorer/testnet/tx/${h}`);
}
console.log("USDC pagador:", await saldo(kp("PAGADOR")));
