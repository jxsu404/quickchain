// Cliente x402 de prueba: paga un endpoint del vendedor demo desde una cuenta G… normal.
// Uso: PAGADOR_SECRET=... URL=http://localhost:4020/tipo-cambio npx tsx scripts/pagar.mts
// (la llave se lee del entorno; nunca se imprime). Imprime el link de Stellar Expert del cobro.
import { x402Client } from "@x402/core/client";
import { decodePaymentResponseHeader } from "@x402/core/http";
import { wrapFetchWithPayment } from "@x402/fetch";
import { createEd25519Signer } from "@x402/stellar";
import { ExactStellarScheme } from "@x402/stellar/exact/client";

const secreto = process.env.PAGADOR_SECRET;
if (!secreto) throw new Error("Falta PAGADOR_SECRET");
const url = process.env.URL ?? "http://localhost:4020/tipo-cambio";
const cliente = new x402Client().register("stellar:*", new ExactStellarScheme(createEd25519Signer(secreto, "stellar:testnet")));
const pagarFetch = wrapFetchWithPayment(fetch, cliente);

const r = await pagarFetch(url);
console.log("HTTP", r.status, JSON.stringify(await r.json()).slice(0, 400));
const pr = r.headers.get("payment-response");
if (pr) {
  const cobro = decodePaymentResponseHeader(pr) as any;
  console.log("pagador:", cobro.payer, "tx:", `https://stellar.expert/explorer/testnet/tx/${cobro.transaction}`);
}
