# agent-client — SDK del agente (Q2)

Cumple la fila Q2 de [PLAN-OPUS](../docs/PLAN-OPUS.md). Vive en `agent-client/`, no en `sdk/` como dice el plan. El agente paga APIs x402 `exact` desde la **cuenta-presupuesto** (`C…`) sin firmas del dueño por llamada.

## API (`src/index.ts`)
- `crearFetchConPresupuesto({cuenta, secretoAgente, rpcUrl?, maxPorLlamada?, hostsPermitidos?, alPagar?})` devuelve un `fetch`. Ante un `402`:
  1. lee `PAYMENT-REQUIRED`;
  2. revisa los límites locales (`hostsPermitidos`, `maxPorLlamada` en unidades de 7 decimales);
  3. arma `USDC.transfer(C…, payTo, monto)`, lo simula, firma la auth entry de la `C…` con la llave del agente (`authorizeEntry` + `Keypair`, formato `FirmaAgente`) y lo **vuelve a simular**, para que el footprint incluya `__check_auth`;
  4. reintenta con `PAYMENT-SIGNATURE`. `alPagar` recibe el hash y el link de Stellar Expert.
- Si el contrato rechaza, la simulación falla y se lanza `PagoBloqueado` con `motivo` (`TopeAlcanzado`, `MontoPorLlamada`, `Pausada`, `PeriodoVencido`, `AgenteDesconocido`, `SaldoInsuficiente`…) y `enCadena = true`. No hay tx y no se mueve plata. Los límites locales lanzan `HostNoPermitido` o `MaxPorLlamadaLocal`.
- `leerEstado(cuenta, rpcUrl?)` devuelve `estado()` del contrato (tope, gastado, restante, fin_periodo, pausada…), solo lectura.
- `armarPagoDesdeCuenta(...)` construye el pago firmado; se exporta para otros clientes.

## Comandos
- `pnpm agente`: demo; paga `API_DEMO_URL` (`/tipo-cambio` por defecto) `LLAMADAS` veces e imprime los links y el estado.
- `pnpm --filter agent-client agente-nuevo`: crea la llave del agente. La secreta va **solo** a `AGENTE_ARCHIVO` (fuera del repo, chmod 600); en pantalla salen la pública y el hex para el constructor del contrato.
- `pnpm --filter agent-client test`: tests con un 402 simulado (sin red).

## Variables (nombres en `.env.example`)
`BUDGET_CONTRACT_ID` (la `C…`), `AGENT_SECRET_KEY`, `STELLAR_RPC_URL`, `API_DEMO_URL`, `LLAMADAS`, `HOSTS_PERMITIDOS`, `AGENTE_ARCHIVO`.

Evidencia en testnet: [transacciones](../docs/transacciones.md).

<!-- enlaces:auto -->
## Enlaces

- ⬆️ Arriba: [Mapa (hub)](../docs/MAPA.md) · [Índice de docs](../docs/INDICE.md)
- 📖 Fuente de verdad: [PLAN-OPUS — la biblia](../docs/PLAN-OPUS.md)
- Relacionado: [Transacciones (testnet)](../docs/transacciones.md) · [Decisiones](../docs/DECISIONES.md) · [contracts/budget](../contracts/budget/AGENTS.md) · [api-demo](../api-demo/AGENTS.md) · [Demo (testnet)](../docs/DEMO.md)
- Issue: [#2](https://github.com/jxsu404/quickchain/issues/2)
- Lo enlazan: [AGENTS (raíz)](../AGENTS.md) · [Tareas](../TAREAS.md) · [api-demo](../api-demo/AGENTS.md) · [contracts/budget](../contracts/budget/AGENTS.md) · [Arquitectura](../docs/ARQUITECTURA.md) · [Demo (testnet)](../docs/DEMO.md) · [Mapa (hub)](../docs/MAPA.md) · [PLAN-OPUS — la biblia](../docs/PLAN-OPUS.md)
- Tags: #quickchain #paquete
<!-- /enlaces:auto -->
