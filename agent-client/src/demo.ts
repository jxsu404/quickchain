// Agente demo: llama a la API varias veces pagando desde la cuenta-presupuesto hasta chocar con el tope.
import "dotenv/config";
import { crearFetchConPresupuesto, leerEstado } from "./sdk.js";
import { PagoBloqueado } from "./errores.js";

const falta = ["BUDGET_CONTRACT_ID", "AGENT_SECRET_KEY"].filter((k) => !process.env[k]);
if (falta.length) throw new Error(`Faltan variables: ${falta.join(", ")}`);
const cuenta = process.env.BUDGET_CONTRACT_ID!;
const rpcUrl = process.env.STELLAR_RPC_URL || undefined;
const url = process.env.API_DEMO_URL || "http://localhost:4020/tipo-cambio";
const pagar = crearFetchConPresupuesto({
  cuenta, secretoAgente: process.env.AGENT_SECRET_KEY!, rpcUrl,
  hostsPermitidos: process.env.HOSTS_PERMITIDOS?.split(",").filter(Boolean),
  alPagar: (p) => console.log(`  pagado ${Number(p.monto) / 1e7} USDC desde ${p.pagador}: ${p.link}`),
});
for (let i = 1; i <= Number(process.env.LLAMADAS || 5); i++) {
  try {
    const r = await pagar(url);
    console.log(`#${i}`, r.status, (await r.text()).slice(0, 120));
  } catch (e) {
    if (e instanceof PagoBloqueado) console.log(`#${i} BLOQUEADO (${e.enCadena ? "por el contrato, sin tx" : "por el SDK"}): ${e.message}`);
    else console.log(`#${i} error:`, (e as Error).message.slice(0, 300));
  }
}
const est = await leerEstado(cuenta, rpcUrl);
console.log(`Estado: gastado ${Number(est.gastado) / 1e7} de ${Number(est.tope) / 1e7} USDC, restante ${Number(est.restante) / 1e7}`);
