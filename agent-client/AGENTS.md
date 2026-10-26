# agent-client — SDK del agente (Q2)

Cumple la fila Q2 de [PLAN-OPUS](../docs/PLAN-OPUS.md). Vive en `agent-client/`, no en `sdk/` como dice el plan. El agente paga APIs x402 `exact` desde la **cuenta-presupuesto** (`C…`) sin firmas del dueño por llamada.

## API (`src/index.ts`)
- `crearFetchConPresupuesto({cuenta, secretoAgente, hostsPermitidos, rpcUrl?, maxPorLlamada?, maxLlamadasPorMinuto?, alPagar?})` devuelve un `fetch`. `hostsPermitidos` es **obligatorio y no vacío** (host con puerto, ej. `["localhost:4020"]`); si falta, o si `maxLlamadasPorMinuto` no es un entero ≥ 1, se lanza `ConfiguracionInvalida` al crear el fetch. Ante un `402`:
  1. toma la URL **final** (después de redirects) y exige que su host esté en `hostsPermitidos`;
  2. lee `PAYMENT-REQUIRED` y revisa `maxPorLlamada` (unidades de 7 decimales);
  3. revisa el límite de pagos por minuto (`maxLlamadasPorMinuto`, por defecto 10, ventana deslizante de 60 s; solo cuentan los 402 que se intentan pagar);
  4. arma `USDC.transfer(C…, payTo, monto)`, lo simula, firma la auth entry de la `C…` con la llave del agente (`authorizeEntry` + `Keypair`, formato `FirmaAgente`) y lo **vuelve a simular**, para que el footprint incluya `__check_auth`. La firma vence en `min(maxTimeoutSeconds, 300)` s, aunque el 402 pida más;
  5. reintenta con `PAYMENT-SIGNATURE` a la URL final con `redirect: "manual"` (el pago firmado no sigue redirects). `alPagar` recibe el hash y el link de Stellar Expert.
- Si el contrato rechaza, la simulación falla y se lanza `PagoBloqueado` con `motivo` (`TopeAlcanzado`, `MontoPorLlamada`, `Pausada`, `PeriodoVencido`, `AgenteDesconocido`, `SaldoInsuficiente`…) y `enCadena = true`. No hay tx y no se mueve plata. Los límites locales lanzan `HostNoPermitido`, `MaxPorLlamadaLocal` o `LimitePorMinuto` (subclase de `PagoBloqueado` con `limite` y `reintentarEnMs`), siempre antes de firmar.
- `leerEstado(cuenta, rpcUrl?)` devuelve `estado()` del contrato (tope, gastado, restante, fin_periodo, pausada…), solo lectura.
- `armarPagoDesdeCuenta(...)` construye el pago firmado; se exporta para otros clientes.

## Comandos
- `pnpm agente`: demo; paga `API_DEMO_URL` (`/tipo-cambio` por defecto) `LLAMADAS` veces e imprime los links y el estado. Sin `HOSTS_PERMITIDOS`, solo le paga al host de `API_DEMO_URL`.
- `pnpm --filter agent-client agente-nuevo`: crea la llave del agente. La secreta va **solo** a `AGENTE_ARCHIVO` (fuera del repo, chmod 600); en pantalla salen la pública y el hex para el constructor del contrato.
- `pnpm --filter agent-client cobrar-comision` (Q8): llama `cobrar_comision()` de `BUDGET_CONTRACT_ID`; la comisión va a la tesorería fija; `COBRADOR_SECRET` = cualquier G… con XLM (solo para el fee).
- `pnpm --filter agent-client medir-costos etiqueta=hash …` (Q8): tabla de fees reales desde Horizon con links; resultado en [docs/COSTOS.md](../docs/COSTOS.md).
- `pnpm --filter agent-client test`: tests con un 402 simulado (sin red).

## Variables (nombres en `.env.example`)
`BUDGET_CONTRACT_ID` (la `C…`), `AGENT_SECRET_KEY`, `STELLAR_RPC_URL`, `API_DEMO_URL`, `LLAMADAS`, `HOSTS_PERMITIDOS` (separados por coma), `MAX_LLAMADAS_POR_MINUTO`, `AGENTE_ARCHIVO`.

Evidencia en testnet: [transacciones](../docs/transacciones.md).

<!-- enlaces:auto -->
## Enlaces

- ⬆️ Arriba: [Mapa (hub)](../docs/MAPA.md) · [Índice de docs](../docs/INDICE.md)
- 📖 Fuente de verdad: [PLAN-OPUS — la biblia](../docs/PLAN-OPUS.md)
- Relacionado: [Costos (Q8)](../docs/COSTOS.md) · [Transacciones (testnet)](../docs/transacciones.md) · [Decisiones](../docs/DECISIONES.md) · [contracts/cuenta-presupuesto](../contracts/cuenta-presupuesto/AGENTS.md) · [api-demo](../api-demo/AGENTS.md) · [Demo (testnet)](../docs/DEMO.md)
- Issue: [#2](https://github.com/jxsu404/quickchain/issues/2)
- Lo enlazan: [AGENTS (raíz)](../AGENTS.md) · [Tareas](../TAREAS.md) · [api-demo](../api-demo/AGENTS.md) · [contracts/cuenta-presupuesto](../contracts/cuenta-presupuesto/AGENTS.md) · [Arquitectura](../docs/ARQUITECTURA.md) · [Demo (testnet)](../docs/DEMO.md) · [Mapa (hub)](../docs/MAPA.md) · [PLAN-OPUS — la biblia](../docs/PLAN-OPUS.md)
- Tags: #quickchain #paquete
<!-- /enlaces:auto -->
