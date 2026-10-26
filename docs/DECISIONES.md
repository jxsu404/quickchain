# Decisiones

| Fecha | Decisión | Motivo |
|---|---|---|
| 2026-10-25 | Pivot: presupuesto del lado del **comprador** (el dueño del agente), no del vendedor de APIs | el dolor es firmar cada pago o dar una llave sin límite |
| 2026-10-25 | Nombre: **QuickChain** | — |
| 2026-10-25 | Modelo: **1 %** de lo que gasta el agente, sin mensualidad | el dueño paga solo si usa |
| 2026-10-25 | **Writz y Bitcoin fuera** | no son parte del producto |
| 2026-10-25 | **Repo nuevo** `jxsu404/quickchain`; el viejo `caja-tica-escudo` queda intacto | empezar limpio; se rescató solo el cobro x402 |
| 2026-10-25 | Web nueva en Next.js con Cavos (la vieja era Vite + Freighter, sin Cavos) | stack del equipo |
| 2026-10-25 | Sin base de datos | el estado vive en el contrato |
| 2026-10-25 | CI en cada pull request y en cada push a `main`: `cargo test -p budget`, wasm (`wasm32v1-none`, rustc 1.99.1), `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm docs:links` | la base tiene que fallar sola si se rompe el contrato, los tipos o el grafo de docs |
| 2026-10-25 | Job de secretos: gitleaks 8.30.1 sobre todo el historial (`fetch-depth: 0`) y grep de semillas Stellar `\bS[A-Z2-7]{55}\b` | el repo viejo traía llaves; si vuelve una semilla, el PR no pasa. CLI MIT, no gitleaks-action: en un repo de organización la action pide licencia y solo mira el rango del push |
| 2026-10-25 | `docs/transacciones.md` nace vacío (tx, qué prueba, link de Stellar Expert testnet) | Q10 lo llena; el link es `https://stellar.expert/explorer/testnet/tx/<hash>` |
| 2026-10-25 | Q3: el vendedor y el facilitador viven en `api-demo/` (`/tipo-cambio`, `/caro`, `/facilitador/*`), no en `servidor/` como dice el plan | es la carpeta que ya existe; mismo comportamiento |
| 2026-10-25 | Q3: el pago a la API es x402 `exact` estándar con `from = C…` (modo A del plan), no `X-QUICKCHAIN-TX` | probado en testnet: la `C…` pagó con el facilitador público y con el propio (ver [transacciones](transacciones.md)); responde la pregunta abierta 1 |
| 2026-10-25 | Q3: tipo de cambio de ExchangeRate-API (`open.er-api.com`), rotulado "no oficial del BCCR" | fuente real sin llave; el servicio del BCCR pide token |
| 2026-10-25 | Q2: el SDK vive en `agent-client/` (`src/sdk.ts`), no en `sdk/` como dice el plan; se quitó `gastar()` y `X-QUICKCHAIN-TX` | es el paquete que ya existe; el pago es x402 `exact` con `from = C…`, probado en testnet ([transacciones](transacciones.md)) |
| 2026-10-25 | Q2: la firma del agente usa `authorizeEntry` de stellar-sdk con un `Keypair`, sin firmador custom | el `Vec<{public_key, signature}>` coincide con `FirmaAgente` del contrato; se verificó en testnet (responde la pregunta abierta 2 del plan) |

## Preguntas abiertas
1. ~~**Cómo prueba el agente el pago a la API.**~~ Resuelta en Q3 (ver arriba). El esquema x402 `exact` espera un pago firmado por quien paga; en QuickChain paga el contrato. Opción MVP: el agente manda `X-QUICKCHAIN-TX` y `api-demo` verifica la tx en el RPC (destino, monto, contrato). Alternativa: el contrato autoriza y el agente firma un `exact` normal. Decidir en tarea 2/3.
2. **Comisión 1 %:** ¿se cobra en `gastar` (dos transferencias) o en lote al renovar?
3. **Allowance:** `approve` del token tiene vencimiento por ledger; la web debe pedir uno que cubra el periodo.

<!-- enlaces:auto -->
## Enlaces

- ⬆️ Arriba: [Mapa (hub)](MAPA.md) · [Índice de docs](INDICE.md)
- 📖 Fuente de verdad: [PLAN-OPUS — la biblia](PLAN-OPUS.md)
- Relacionado: [Auditoría](AUDITORIA.md) · [Stack](STACK.md) · [Transacciones (testnet)](transacciones.md)
- Lo enlazan: [Auditoría](AUDITORIA.md) · [Índice de docs](INDICE.md) · [Mapa (hub)](MAPA.md) · [Plan (resumen)](PLAN.md) · [Stack](STACK.md)
- Tags: #quickchain #docs
<!-- /enlaces:auto -->
