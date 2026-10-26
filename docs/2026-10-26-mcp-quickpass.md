# 2026-10-26 · MCP server de QuickPass

**Decisión (pedida por Josué):** agregar [`mcp/`](../mcp/README.md), un servidor MCP (TypeScript, `@modelcontextprotocol/sdk`, stdio, Node ≥ 20) para que cualquier agente (Claude Desktop/Code, Cursor, Grok Bot, cualquier cliente MCP) pague APIs x402 desde una cuenta-presupuesto con tope, usable hoy en testnet.

- Carpeta nueva de nivel superior, fuera del workspace pnpm (`npm ci` propio): no toca `web/`, `/demo` ni `/crear`. La lógica de pago es copia de [agent-client](../agent-client/AGENTS.md) (`sdk.ts`, `errores.ts`).
- Tres tools: `quickpass_estado`, `quickpass_pagar_api`, `quickpass_pagos`. Config solo por variables de entorno; la secreta del agente nunca se loguea ni se devuelve.
- Distribución: clonar + `npm ci && npm run build` + `node mcp/dist/index.js`. `npx github:…` no instala subcarpetas, así que no se usa.
- CI: el job TypeScript corre `npm ci && npm run typecheck` en `mcp/`.

## Prueba real en testnet (2026-10-26 ~11:23 CR)
Cuenta creada con la fábrica, dueño y agente nuevos de testnet (llaves solo en la máquina de prueba, fuera del repo). Cliente MCP por stdio llamando a la API demo de Render (`/tipo-cambio`, US$0,01).

| Paso | Resultado |
|---|---|
| trustline + 0,2 USDC (XLM→USDC en el DEX) | [tx](https://stellar.expert/explorer/testnet/tx/9647b8f3df722ab5d799d935ca33863bba778ee1b5a6d5a05105308c1a511823) |
| `fabrica.crear` → [`CDPTB3CI…`](https://stellar.expert/explorer/testnet/contract/CDPTB3CIUCU3IGFPC6SXLENEJXIIQAQPZQDAWPRJXOACS4DQEU6RLQ2N) | [tx](https://stellar.expert/explorer/testnet/tx/b3d50e2d6a975513cd08a9abf09730ecaaf25017fec4b0655ecfa08be61b4dcf) |
| `renovar` (tope 0,025; máx. 0,02; recarga 0,05) | [tx](https://stellar.expert/explorer/testnet/tx/f5ee23cb13e57be310439025411a9715ec595f5d2d551057292b90c22613915b) |
| `quickpass_pagar_api` 1 (0,01) | [tx](https://stellar.expert/explorer/testnet/tx/c103facc06828b5e1f31780647b9efe5e2b52a07083497f272db43e376de41bf) |
| `quickpass_pagar_api` 2 (0,01) | [tx](https://stellar.expert/explorer/testnet/tx/97aca2a0974f64e9b2cc7443683a155624444eb62fcf1b9f31b6a384615b04b7) |
| `/caro` (US$1) con `max_usdc: 0.02` | bloqueado local `MaxPorLlamadaLocal`, sin tx |
| pago 3 (0,0202 + 0,0101 > 0,025) | `"blocked: cap reached"` (`TopeAlcanzado`, contrato), sin tx |
| `quickpass_estado` final | gastado 0,0202; restante 0,0048; saldo 0,03 |

Ver también [DECISIONES](DECISIONES.md) e [INDICE](INDICE.md).
