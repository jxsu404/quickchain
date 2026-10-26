// Q7: agente demo de punta a punta en testnet (ver docs/DEMO.md).
// Uso: BUDGET_CONTRACT_ID=C… AGENT_SECRET_KEY=S… API_DEMO_URL=http://localhost:4020 \
//      pnpm --filter agent-client exec tsx ../scripts/agente-demo.ts
// La cuenta debe tener tope 0,05, máximo 0,02 por llamada y saldo ≥ US$1 (si no, /caro choca con SaldoInsuficiente antes que con MontoPorLlamada).
import { correrAgenteDemo } from "../agent-client/src/agente-demo.js";

const falta = ["BUDGET_CONTRACT_ID", "AGENT_SECRET_KEY"].filter((k) => !process.env[k]);
if (falta.length) throw new Error(`Faltan variables: ${falta.join(", ")}`);
// Sin top-level await: la raíz del repo no es "type": "module".
correrAgenteDemo({
  cuenta: process.env.BUDGET_CONTRACT_ID!, secretoAgente: process.env.AGENT_SECRET_KEY!,
  base: process.env.API_DEMO_URL || "http://localhost:4020", rpcUrl: process.env.STELLAR_RPC_URL || undefined,
}).then(({ resultados }) => {
const pagados = resultados.filter((r) => r.ok).length;
const esperado = pagados === 4 && resultados[4]?.motivo === "TopeAlcanzado" && resultados[5]?.motivo === "MontoPorLlamada";
console.log(esperado ? "\nDemo OK: 4 pagos, 5.º bloqueado por tope, /caro bloqueado por máximo por llamada." : `\nDemo NO salió como se esperaba (${pagados} pagos).`);
process.exitCode = esperado ? 0 : 1;
});
