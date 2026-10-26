// Q8: mide el costo real de red de transacciones de testnet (fee cobrado en stroops) leyendo Horizon.
// Uso: pnpm --filter agent-client medir-costos <etiqueta>=<hash> ...   → tabla Markdown con links.
const HORIZON = process.env.HORIZON_URL || "https://horizon-testnet.stellar.org";
const filas: string[] = ["| Operación | Fee cobrado (stroops) | Fee cobrado (XLM) | Fee máximo ofrecido (stroops) | Fuente |", "|---|---|---|---|---|"];
for (const arg of process.argv.slice(2)) {
  const [etiqueta, hash] = arg.split("=");
  const r = await fetch(`${HORIZON}/transactions/${hash}`);
  if (!r.ok) throw new Error(`Horizon ${r.status} para ${hash}`);
  const t = (await r.json()) as { fee_charged: string; max_fee: string; successful: boolean };
  if (!t.successful) throw new Error(`${hash} no fue exitosa`);
  filas.push(`| ${etiqueta} | ${t.fee_charged} | ${(Number(t.fee_charged) / 1e7).toFixed(7)} | ${t.max_fee} | [${hash.slice(0, 8)}…](https://stellar.expert/explorer/testnet/tx/${hash}) |`);
}
console.log(filas.join("\n"));
export {};
