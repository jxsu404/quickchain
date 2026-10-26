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
| 2026-10-25 | CI en cada pull request y en cada push a `main`: `cargo test -p cuenta-presupuesto`, wasm (`wasm32v1-none`, rustc 1.99.1), `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm docs:links` | la base tiene que fallar sola si se rompe el contrato, los tipos o el grafo de docs |
| 2026-10-25 | Job de secretos: gitleaks 8.30.1 sobre todo el historial (`fetch-depth: 0`) y grep de semillas Stellar `\bS[A-Z2-7]{55}\b` | el repo viejo traía llaves; si vuelve una semilla, el PR no pasa. CLI MIT, no gitleaks-action: en un repo de organización la action pide licencia y solo mira el rango del push |
| 2026-10-25 | `docs/transacciones.md` nace vacío (tx, qué prueba, link de Stellar Expert testnet) | Q10 lo llena; el link es `https://stellar.expert/explorer/testnet/tx/<hash>` |
| 2026-10-25 | Q1: el contrato pasa a ser la **cuenta-presupuesto** `C…` de PLAN-OPUS §2 (`__check_auth`, una cuenta por dueño, el USDC se deposita con `renovar`). Se reemplaza el diseño `gastar` + `approve`/`transfer_from` | lo pide el plan y los facilitadores x402 rechazan `transfer_from` (AUDITORIA) |
| 2026-10-25 | Q1: la carpeta `contracts/budget` y el crate `budget` pasan a `contracts/cuenta-presupuesto/` y crate `cuenta-presupuesto` (struct `CuentaPresupuesto`) | nombre de PLAN-OPUS §4; CI, scripts y enlaces actualizados en el mismo cambio |
| 2026-10-25 | Q1: comisión 1 % (`fee_bps = 100`) redondeada hacia arriba, incluida en el tope, acumulada en `comision_pendiente` y cobrada en `renovar` o con `cobrar_comision()` (pública, a tesorería fija) | `__check_auth` no puede mover fondos (PLAN-OPUS §2.2); cierra la pregunta abierta 2 |
| 2026-10-25 | Q1: token = SAC del USDC de Circle en testnet (`USDC:GBBD47…` → `CBIELTK6…DAMA`). Ojo: el plan dice no usar `CBIELTK6…` "de Writz", pero ese ID **es** el SAC del USDC de Circle (`stellar contract id asset`). Lo confirma Josué | dato verificado con la CLI |
| 2026-10-25 | Q1: `CBIELTK6…` verificado con 3 fuentes (CLI, Horizon `/assets`, docs de Circle): es el USDC de Circle, no de Writz. Pruebas en testnet con USDC obtenido por path payment XLM→USDC en el DEX (el faucet de Circle no tiene API usable) | ver [pruebas-q1.md](pruebas-q1.md) |
| 2026-10-25 | Q3 (reemplazada, ver abajo): ~~el vendedor y el facilitador viven en `api-demo/` (`/tipo-cambio`, `/caro`, `/facilitador/*`), no en `servidor/` como dice el plan | es la carpeta que ya existe; mismo comportamiento |
| 2026-10-25 | Q3: vendedor en `servidor/vendedor.ts` por decisión de Josué: `api-demo/servidor/vendedor.ts` (node:http, sin Next.js) sirve `/tipo-cambio` (US$0,01), `/caro` (US$1) y el facilitador propio (`/facilitador/verify`, `/settle`, `/supported`, código en `api-demo/servidor/facilitador.ts`, URL configurable con `X402_FACILITATOR_URL`). Reemplaza la fila anterior | lo dice la fila Q3 de PLAN-OPUS |
| 2026-10-25 | Q3: el pago a la API es x402 `exact` estándar con `from = C…` (modo A del plan), no `X-QUICKCHAIN-TX` | probado en testnet: la `C…` pagó con el facilitador público y con el propio (ver [transacciones](transacciones.md)); responde la pregunta abierta 1 |
| 2026-10-25 | Q3: tipo de cambio de ExchangeRate-API (`open.er-api.com`), rotulado "no oficial del BCCR" | fuente real sin llave; el servicio del BCCR pide token |
| 2026-10-25 | Q2: el SDK vive en `agent-client/` (`src/sdk.ts`), no en `sdk/` como dice el plan; se quitó `gastar()` y `X-QUICKCHAIN-TX` | es el paquete que ya existe; el pago es x402 `exact` con `from = C…`, probado en testnet ([transacciones](transacciones.md)) |
| 2026-10-25 | Q2: la firma del agente usa `authorizeEntry` de stellar-sdk con un `Keypair`, sin firmador custom | el `Vec<{public_key, signature}>` coincide con `FirmaAgente` del contrato; se verificó en testnet (responde la pregunta abierta 2 del plan) |
| 2026-10-25 | Q8: la comisión de 1 % se usa tal como la implementa el contrato de #11 (acumulada en `__check_auth` y cobrada con `cobrar_comision()`/`renovar`); Q8 no toca el contrato. Scripts en `agent-client/src/` (`cobrar-comision`, `medir-costos`), no en `scripts/` | el plan ya lo asigna a Q1; probado en testnet ([costos](COSTOS.md)) |
| 2026-10-26 | Q3: la demo liquida con el facilitador **público** (`https://x402.org/facilitator`, el valor por defecto de `X402_FACILITATOR_URL`). El propio queda como respaldo local: sus rutas solo existen con `FACILITADOR_PROPIO=1` y solo atienden conexiones locales. **Aprobado por Josué** el 2026-10-26 6:41 a. m. CR (propuesta de la auditoría #23) | el público ya liquidó pagos desde la `C…` ([transacciones](transacciones.md), `d0e333b2…`); el propio no tiene auth y paga fees de terceros con su XLM ([auditoría](auditorias/2026-10-25-consolidado.md)) |
| 2026-10-26 | Q4: el dueño firma `renovar(i128, i128, u64, i128)` con Cavos `invokeContract` y argumentos tipados con `nativeToScVal`; antes, la web lee `estado()` (dueño, `fee_bps = 100`, USDC de Circle) y simula. Plan B: `pnpm renovar` (`scripts/renovar.mjs`) con `OWNER_SECRET`, en vez de Freighter, que no existe en el repo. Sin cambios al contrato | sin tipo, `nativeToScVal(500000n)` da `u64` y el contrato espera `i128`; la auditoría propone el plan B por CLI (consenso 3/3) |
| 2026-10-26 | Q2: el SDK exige `hostsPermitidos` no vacío (se compara contra la URL final, el pago no sigue redirects), limita a `maxLlamadasPorMinuto` pagos por minuto (10 por defecto, error `LimitePorMinuto`) y acota la vida de la firma a 300 s | PLAN-OPUS §3 (lista de hosts y llamadas por minuto); hallazgos de la auditoría sobre `maxTimeoutSeconds` y redirects |
| 2026-10-26 | Q7: el agente demo vive en `agent-client/src/agente-demo.ts` (reutilizable por Q10) y `scripts/agente-demo.ts` es la entrada que pide el plan; 5 llamadas en vez de `LLAMADAS=8` | con tope 0,05 y comisión 1 % entran 4 pagos; `/caro` necesita saldo ≥ US$1 en la cuenta para llegar a `MontoPorLlamada` (probado en testnet, [transacciones](transacciones.md)) |
| 2026-10-26 | DEMO.md: el vendedor se levanta con `pnpm --filter api-demo vendedor` (servidor `node:http` de #18) en vez de `next dev` | Josué decidió que el vendedor va en `servidor/vendedor.ts` (buzón 005); probado en testnet con ese servidor ([DEMO](DEMO.md)) |
| 2026-10-26 | Q10: la corrida usa una cuenta-presupuesto nueva desplegada con el SDK (`createCustomContract`, mismo `wasm_hash` de Q1), sin la CLI `stellar`; recarga 1,05 para que `/caro` muestre `MontoPorLlamada`; al final se retira todo el saldo libre al dueño | reproducible sin CLI y no deja plata de prueba varada ([transacciones](transacciones.md)) |
| 2026-10-26 | Q11: el README dice que la comisión de 1 % ya está en el contrato (antes decía "todavía no está implementada") y que el facilitador público aceptó pagos desde la `C…` | ambas cosas están probadas en testnet ([costos](COSTOS.md), [transacciones](transacciones.md)); la lista de equipo sale de los commits y la confirma Josué |
| 2026-10-26 | Q9: se actualizan `docs/SEGURIDAD.md` y `docs/ARQUITECTURA.md` (mayúsculas, ya enlazados) en vez de crear `seguridad.md`/`arquitectura.md` como dice el plan; la arquitectura vieja (`transfer_from`, `gastar`, `X-QUICKCHAIN-TX`) se reemplaza por la vigente (USDC en la `C…`, x402 `exact`) | evita duplicar nodos; refleja el código de main |
| 2026-10-26 | Josué aprobó propuestas 1-10 de la auditoría (#23) el 2026-10-26 6:41 a. m. CR | se incorporan a [PLAN-OPUS](PLAN-OPUS.md) (las 7 notas 🔎 pasan a texto oficial) y se marcan aprobadas en el [consolidado](auditorias/2026-10-25-consolidado.md) |
| 2026-10-26 | Deploy de api-demo: Render con `render.yaml` (Node 22, `pnpm --filter api-demo vendedor`), con `Dockerfile.api-demo` como alternativa; no Vercel, porque el plan solo pone la web en Vercel y el vendedor es `node:http` de larga vida. Sin `FACILITADOR_SECRET_KEY` en el host. **Aprobado por Josué** el 2026-10-26 7:03 a. m. CR | ver [deploy-api.md](deploy-api.md) |
| 2026-10-26 | Precio XLM/USD: se quita, Josué 2026-10-26 7:03 a. m. CR. No se cita CoinGecko ni otra fuente; los fees quedan en XLM medidos en testnet ([costos](COSTOS.md)). #32 no se fusiona | decisión de Josué |
| 2026-10-26 | **Permisos abiertos al equipo**: cualquier integrante puede editar el plan y la app por PR y hacer merge a `main` con el CI en verde, sin aprobación de Josué; los cambios importantes del plan se anotan aquí con fecha. Josué 2026-10-26 8:08 a. m. CR | pedido de Josué; José no tenía permisos |

| 2026-10-26 | Nombre del producto: **Stellar QuickPass** (antes QuickChain), Josué 8:24 a. m. CR. Cambia en docs visibles y textos de la web; **no** cambian repo, paquetes, contrato, variables de entorno ni identificadores de código | decisión de marca para el pitch y la identidad ([buzón 010](https://github.com/jxsu404/quickchain-buzon/blob/main/buzon/010-josue-jose-identidad-de-marca.md)) |
| 2026-10-26 | URLs con el nombre nuevo (Josué 8:30 a. m. CR): repo `jxsu404/stellar-quickpass` (redirige desde `jxsu404/quickchain`), web `stellar-quickpass.vercel.app` (sigue `quickchain.vercel.app`). Se quedan: la API en Render (`quickchain-api-demo.onrender.com`), el buzón `quickchain-buzon` y el `appSalt` de Cavos (cambiarlo cambiaría las direcciones) | consistencia con Stellar QuickPass |
## Preguntas abiertas
1. ~~**Cómo prueba el agente el pago a la API.**~~ Resuelta en Q3 (ver arriba): x402 `exact` con `from = C…`.
2. ~~**Comisión 1 %**~~ resuelto en Q1 (ver tabla).
3. **Allowance:** `approve` del token tiene vencimiento por ledger; la web debe pedir uno que cubra el periodo.

<!-- enlaces:auto -->
## Enlaces

- ⬆️ Arriba: [Mapa (hub)](MAPA.md) · [Índice de docs](INDICE.md)
- 📖 Fuente de verdad: [PLAN-OPUS — la biblia](PLAN-OPUS.md)
- Relacionado: [Costos (Q8)](COSTOS.md) · [Auditoría](AUDITORIA.md) · [Stack](STACK.md) · [Transacciones (testnet)](transacciones.md)
- Lo enlazan: [Auditoría](AUDITORIA.md) · [Índice de docs](INDICE.md) · [Mapa (hub)](MAPA.md) · [Plan (resumen)](PLAN.md) · [Stack](STACK.md)
- Tags: #quickchain #docs
<!-- /enlaces:auto -->
