// Q7 (PLAN-OPUS): agente demo. 4 pagos de US$0,01 desde la cuenta-presupuesto, el 5.º bloqueado
// por el contrato (TopeAlcanzado) y /caro (US$1) bloqueado (MontoPorLlamada). Imprime cada link.
// Los bloqueos ocurren en la simulación: no hay tx y no se mueve plata.
import { crearFetchConPresupuesto, leerEstado, RPC_TESTNET } from "./sdk.js";
import { PagoBloqueado } from "./errores.js";

export interface ResultadoLlamada { paso: string; url: string; ok: boolean; tx?: string; link?: string; motivo?: string; enCadena?: boolean; detalle?: string }

const usdc = (u: bigint | number) => (Number(u) / 1e7).toFixed(4);

export async function correrAgenteDemo(op: { cuenta: string; secretoAgente: string; base: string; rpcUrl?: string; pagos?: number; log?: (s: string) => void }) {
  const log = op.log ?? console.log;
  const rpcUrl = op.rpcUrl ?? RPC_TESTNET;
  const base = op.base.replace(/\/$/, "");
  let ultimo: { tx?: string; link?: string } = {};
  const pagar = crearFetchConPresupuesto({
    cuenta: op.cuenta, secretoAgente: op.secretoAgente, rpcUrl,
    hostsPermitidos: [new URL(base).host],
    alPagar: (p) => { ultimo = { tx: p.tx, link: p.link }; },
  });
  const res: ResultadoLlamada[] = [];
  const llamar = async (paso: string, ruta: string) => {
    const url = `${base}${ruta}`;
    ultimo = {};
    try {
      const r = await pagar(url);
      const cuerpo = (await r.text()).slice(0, 80);
      const ok = r.ok && !!ultimo.tx;
      res.push({ paso, url, ok, ...ultimo, detalle: `${r.status} ${cuerpo}` });
      log(ok ? `✅ ${paso}: pagado → ${ultimo.link}` : `⚠️  ${paso}: respuesta ${r.status} sin pago liquidado (${cuerpo})`);
    } catch (e) {
      if (e instanceof PagoBloqueado) {
        res.push({ paso, url, ok: false, motivo: e.motivo, enCadena: e.enCadena, detalle: e.message });
        log(`⛔ ${paso}: BLOQUEADO ${e.enCadena ? "por el contrato (simulación, sin tx, no se movió plata)" : "por el SDK"} — ${e.message}`);
      } else {
        res.push({ paso, url, ok: false, detalle: (e as Error).message.slice(0, 300) });
        log(`❌ ${paso}: error — ${(e as Error).message.slice(0, 300)}`);
      }
    }
  };
  const antes = await leerEstado(op.cuenta, rpcUrl);
  log(`Cuenta ${op.cuenta}: tope ${usdc(antes.tope)} USDC, gastado ${usdc(antes.gastado)}, restante ${usdc(antes.restante)}`);
  const n = op.pagos ?? 5;
  for (let i = 1; i <= n; i++) await llamar(`pago ${i}/${n} /tipo-cambio (US$0,01)`, "/tipo-cambio");
  await llamar("/caro (US$1)", "/caro");
  const est = await leerEstado(op.cuenta, rpcUrl);
  log(`Estado final: gastado ${usdc(est.gastado)} de ${usdc(est.tope)} USDC, restante ${usdc(est.restante)}, comisión pendiente ${usdc(BigInt(String(est.comision_pendiente ?? 0)))}`);
  return { resultados: res, estado: est };
}
