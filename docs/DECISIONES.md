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

## Preguntas abiertas
1. **Cómo prueba el agente el pago a la API.** El esquema x402 `exact` espera un pago firmado por quien paga; en QuickChain paga el contrato. Opción MVP: el agente manda `X-QUICKCHAIN-TX` y `api-demo` verifica la tx en el RPC (destino, monto, contrato). Alternativa: el contrato autoriza y el agente firma un `exact` normal. Decidir en tarea 2/3.
2. **Comisión 1 %:** ¿se cobra en `gastar` (dos transferencias) o en lote al renovar?
3. **Allowance:** `approve` del token tiene vencimiento por ledger; la web debe pedir uno que cubra el periodo.

<!-- enlaces:auto -->
## Enlaces

- ⬆️ Arriba: [Mapa (hub)](MAPA.md) · [Índice de docs](INDICE.md)
- 📖 Fuente de verdad: [PLAN-OPUS — la biblia](PLAN-OPUS.md)
- Relacionado: [Auditoría](AUDITORIA.md) · [Stack](STACK.md)
- Lo enlazan: [Auditoría](AUDITORIA.md) · [Índice de docs](INDICE.md) · [Mapa (hub)](MAPA.md) · [Plan (resumen)](PLAN.md) · [Stack](STACK.md)
- Tags: #quickchain #docs
<!-- /enlaces:auto -->
