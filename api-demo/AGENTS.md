# api-demo — vendedor demo y facilitador x402 (Q3)

Servidor HTTP chico en Node + TS (`node:http`, sin Next.js) que cobra por llamada con x402 `exact` en Stellar testnet (USDC de Circle, SAC `CBIELTK6…`). Cumple la fila Q3 de [PLAN-OPUS](../docs/PLAN-OPUS.md): el vendedor vive en `servidor/vendedor.ts` (decisión de Josué, ver [Decisiones](../docs/DECISIONES.md)).

## Endpoints (`servidor/vendedor.ts`)
- `GET /tipo-cambio` — US$0,01. Tasa USD/CRC de una fuente pública real ([ExchangeRate-API](https://open.er-api.com/v6/latest/USD)), rotulada como **no oficial del BCCR**. El BCCR pide un token para su servicio web, así que no se usó.
- `GET /caro` — US$1, el mismo dato. Sirve para la demo de bloqueo (`MontoPorLlamada`).
- `GET /api/clima` — endpoint viejo (US$ `X402_PRECIO`), se deja por compatibilidad.
- Facilitador propio: `POST /facilitador/verify`, `POST /facilitador/settle`, `GET /facilitador/supported`. Usa `ExactStellarScheme` (facilitador) de `@x402/stellar` con techo de fee `FACILITADOR_MAX_FEE_STROOPS` (por defecto 5.000.000) para tolerar pagadores `C…`.

## Código (`servidor/`)
- `vendedor.ts`: rutas, `atender(Request)` (lo usan los tests) y `arrancar(puerto)`.
- `x402.ts`: `cobrar(req, descripcion, entregar, precio?)`. Rescatada de `caja-tica-escudo/escudo/riesgo.ts`. Si el dato falla, no se cobra.
- `tipoCambio.ts`: lectura de la fuente; cada respuesta lleva `fuente` y `actualizado`.
- `facilitador.ts`: facilitador `exact` (paga los fees con `FACILITADOR_SECRET_KEY`, solo XLM).

## Variables (nombres en `.env.example`)
`PORT` (4020), `X402_PAY_TO`, `X402_PRECIO`, `X402_FACILITATOR_URL` (público `https://x402.org/facilitator` o el propio `http://<host>/facilitador`), `FACILITADOR_SECRET_KEY`, `FACILITADOR_MAX_FEE_STROOPS`, `STELLAR_RPC_URL`.

## Comandos
- `pnpm --filter api-demo vendedor` (o `pnpm dev:api`) → http://localhost:4020/tipo-cambio (sin pago responde 402 con los requisitos x402).
- `pnpm --filter api-demo test`: tests sin red.

## Scripts de prueba (testnet, llaves desechables solo en `QC_SECRETS_FILE`, fuera del repo)
- `npx tsx scripts/cuentas-testnet.mts` — crea y fondea PAGADOR/VENDEDOR/FACILITADOR/TESORERIA (friendbot), trustline USDC y compra USDC de prueba en el DEX de testnet.
- `npx tsx scripts/cuenta-demo.mts` — despliega una cuenta-presupuesto propia con el wasm de Q1 y llama `renovar`.
- `npx tsx scripts/pagar.mts` — paga desde una `G…` (cliente estándar de `@x402/stellar`).
- `npx tsx scripts/pagar-desde-cuenta.mts` — paga desde la `C…`: firma la auth entry con `authorizeEntry` + llave del agente y re-simula.

Evidencia en [docs/transacciones.md](../docs/transacciones.md).

<!-- enlaces:auto -->
## Enlaces

- ⬆️ Arriba: [Mapa (hub)](../docs/MAPA.md) · [Índice de docs](../docs/INDICE.md)
- 📖 Fuente de verdad: [PLAN-OPUS — la biblia](../docs/PLAN-OPUS.md)
- Relacionado: [agent-client](../agent-client/AGENTS.md) · [Demo (testnet)](../docs/DEMO.md) · [Transacciones (testnet)](../docs/transacciones.md) · [Decisiones](../docs/DECISIONES.md)
- Issue: [#3](https://github.com/jxsu404/quickchain/issues/3)
- Lo enlazan: [AGENTS (raíz)](../AGENTS.md) · [Tareas](../TAREAS.md) · [agent-client](../agent-client/AGENTS.md) · [Arquitectura](../docs/ARQUITECTURA.md) · [Demo (testnet)](../docs/DEMO.md) · [Mapa (hub)](../docs/MAPA.md) · [PLAN-OPUS — la biblia](../docs/PLAN-OPUS.md) · [web](../web/AGENTS.md)
- Tags: #quickchain #paquete
<!-- /enlaces:auto -->
