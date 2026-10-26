// Errores del contrato cuenta-presupuesto (PLAN-OPUS §2.2) con mensajes claros para el agente.
export const ERRORES_CONTRATO: Record<number, { nombre: string; mensaje: string }> = {
  1: { nombre: "Pausada", mensaje: "El dueño pausó el presupuesto." },
  2: { nombre: "PeriodoVencido", mensaje: "Se terminó el periodo; el dueño tiene que renovar." },
  3: { nombre: "FirmaInvalida", mensaje: "La firma del agente no es válida." },
  4: { nombre: "AgenteDesconocido", mensaje: "Esta llave no es el agente registrado en la cuenta." },
  5: { nombre: "OperacionNoPermitida", mensaje: "La cuenta solo permite transferencias de USDC." },
  6: { nombre: "MontoInvalido", mensaje: "Monto inválido." },
  7: { nombre: "MontoPorLlamada", mensaje: "El cobro pasa el máximo por llamada que fijó el dueño." },
  8: { nombre: "TopeAlcanzado", mensaje: "Se alcanzó el tope del mes (incluida la comisión de 1 %)." },
  9: { nombre: "PeriodoInvalido", mensaje: "Periodo inválido." },
  10: { nombre: "ParametrosInvalidos", mensaje: "Parámetros inválidos." },
};

export type MotivoBloqueo =
  | (typeof ERRORES_CONTRATO)[number]["nombre"]
  | "HostNoPermitido" | "MaxPorLlamadaLocal" | "SinOpcionStellar" | "SaldoInsuficiente" | "PagoRechazado";

/** Pago bloqueado. `enCadena` = lo rechazó el contrato en la simulación (no hubo tx ni se movió plata). */
export class PagoBloqueado extends Error {
  constructor(public motivo: MotivoBloqueo, mensaje: string, public enCadena = false) {
    super(`${motivo}: ${mensaje}`);
    this.name = "PagoBloqueado";
  }
}

/** Traduce el texto de error de una simulación de Soroban a PagoBloqueado, si se reconoce. */
export function traducirErrorSimulacion(texto: string, cuenta: string): PagoBloqueado | null {
  // __check_auth falla así: "failed account authentication with error", C…, Error(Contract, #N)
  const auth = texto.match(/failed account authentication[\s\S]*?Error\(Contract, #(\d+)\)/);
  if (auth || (texto.includes(cuenta) && /Error\(Contract, #(\d+)\)/.test(texto) && texto.includes("Auth"))) {
    const n = Number((auth ?? texto.match(/Error\(Contract, #(\d+)\)/))![1]);
    const e = ERRORES_CONTRATO[n];
    if (e) return new PagoBloqueado(e.nombre, e.mensaje, true);
  }
  if (texto.includes("balance is not sufficient")) return new PagoBloqueado("SaldoInsuficiente", "La cuenta-presupuesto no tiene saldo USDC suficiente.", true);
  return null;
}
