# Demo de Stellar QuickPass (testnet)

Eslogan: «Your agent pays. You set the cap.»

## Guion (≈ 2 min, PLAN-OPUS §6)
0. La landing en `/` (inglés, para el jurado) lleva con «Try the demo» a `/demo` ([web](../web/AGENTS.md)).
1. El dueño entra con su correo en `/demo` (Cavos) y ve su cuenta `G…`.
2. En `/presupuesto` firma `renovar`: tope 0,05 USDC, máximo 0,02 por llamada, vence el 1 de noviembre 00:00 (hora CR). **Una firma** y link a Stellar Expert.
3. `LLAMADAS=6 pnpm agente` contra `/tipo-cambio` (0,01 USDC): 4 pagos responden 200, cada uno con su link.
4. El 5.º queda **bloqueado** por el contrato (`TopeAlcanzado`): 4 × (0,01 + 1 %) = 0,0404 y el 5.º llevaría el gasto a 0,0505 > 0,05 (mismo caso en [pruebas-q1](pruebas-q1.md), prueba 07c). Sin tx, no se movió plata. Alternativa en un solo comando: el agente demo de Q7 (`scripts/agente-demo.ts`, ver abajo) hace los 4 pagos + los 2 bloqueos.
5. `API_DEMO_URL=http://localhost:4020/caro pnpm agente` (US$1): bloqueado por `MontoPorLlamada`, también sin tx.
6. El mes siguiente, el dueño vuelve a firmar `renovar` y el agente sigue.
7. *(Pendiente de probar en producción.)* Después de «Correr agente», abrir `/dashboard?contract=C…` ([decisión](2026-10-26-dashboard.md)): anillo gastado/tope en Ámbar o Rojo, los 4 pagos con link a Stellar Expert y el bloqueo «no tx» de esa sesión. Capturas: [móvil](capturas/dashboard-movil.png) · [escritorio](capturas/dashboard-escritorio.png).

## Preparación (una vez, testnet)
1. **Vendedor:** `pnpm dev:api` con `X402_PAY_TO`. Por defecto liquida con el facilitador **público** `https://x402.org/facilitator`, que ya aceptó pagos desde la `C…` ([d0e333b2…](https://stellar.expert/explorer/testnet/tx/d0e333b29eb42b717426844ebf4dc443083fc2abaa72e5c60d454f137d1b1fc0)). El facilitador propio queda como respaldo **local**: `FACILITADOR_PROPIO=1` (y `FACILITADOR_SECRET_KEY`); solo responde a conexiones desde la misma máquina, así que no sirve detrás de un túnel ni en Vercel, a propósito. Vendedor desplegado en Render: `API_DEMO_URL=https://quickchain-api-demo.onrender.com` ([deploy-api](deploy-api.md)).
2. **Cuenta del dueño en Cavos:** entrar en la web. Si dice «todavía no existe en la red», el botón «Crear mi cuenta en testnet» la crea (Cavos la patrocina). Copiar la `G…`.
3. **Cuenta-presupuesto con ese dueño:** `OWNER_ADDRESS=<G… de Cavos> QUICKCHAIN_TESORERIA=<G… con trustline USDC, distinta del dueño> bash scripts/deploy-cuenta.sh` (recorte de Q5 a CLI). Poner la `C…` en `NEXT_PUBLIC_BUDGET_CONTRACT_ID` y `BUDGET_CONTRACT_ID`. No se toca el contrato: es el mismo wasm de Q1.
4. **USDC:** para `recarga > 0`, el dueño necesita trustline USDC (botón en la web) y saldo. Si no hay forma fácil de darle USDC a la cuenta Cavos, firmar `renovar` con recarga 0 y depositar el USDC directo en la `C…` desde otra cuenta (`USDC.transfer`); el contrato paga desde su propio saldo igual. Conviene `saldo de la C… ≥ tope` para que la comisión de 1 % quede cubierta.

## Firma de `renovar`: camino Cavos y plan B
- **Camino Cavos (web):** `/presupuesto` lee `estado()` y no deja firmar si el dueño no es tu `G…` de Cavos, si la comisión no es 1 % o si el token no es el USDC de Circle. Después simula `renovar(tope: i128, max_por_llamada: i128, fin_periodo: u64, recarga: i128)` y llama `wallet.invokeContract({ contractId, method: "renovar", args })` con los argumentos ya tipados (`nativeToScVal` con `i128`/`u64`). Requiere la cuenta en estado `ready`. Por defecto Cavos patrocina el fee; si en testnet falla, marcar «Mi cuenta paga el fee» (`{ fee: "self" }`, necesita XLM).
- **Plan B (CLI, sin Cavos):** si Cavos no firma a la hora de corte del plan, el dueño de la cuenta-presupuesto es una `G…` normal y firma con su llave: `OWNER_SECRET=… pnpm renovar --tope 0.05 --max 0.02 --recarga 0.05` (lee `BUDGET_CONTRACT_ID`; `--simular` prueba sin firmar; `--tesoreria G…` exige la tesorería). Imprime el link de Stellar Expert. Se dice en el video que esa firma fue por CLI.

## Qué está probado y qué no (2026-10-26)
- Probado contra testnet, solo lectura: `estado()` y la simulación de `renovar` con el dueño de `CBH3LQQC…` (deploy anterior; el vigente es [`CBKMDFKWDHO2V6K27R5W7N3DPSDNHOV5GBACNHZQ4YRC5YLYF2XROEEE`](https://stellar.expert/explorer/testnet/contract/CBKMDFKWDHO2V6K27R5W7N3DPSDNHOV5GBACNHZQ4YRC5YLYF2XROEEE)) como fuente (web y `pnpm renovar --simular`), incluidos los rechazos `PeriodoInvalido` y falta de saldo USDC.
- Probado sin red: argumentos `i128, i128, u64, i128`, fin de mes en hora CR, validaciones y chequeos previos (`pnpm --filter web test`); límites del SDK y facilitador opt-in (`pnpm test`); `next build`.
- **Sin probar:** la firma real con Cavos (falta un `NEXT_PUBLIC_CAVOS_APP_ID` y una cuenta-presupuesto cuyo dueño sea una `G…` de Cavos), el botón «Crear mi cuenta» (según el código del kit, la cuenta queda `ready` aunque falle el pago de 1 stroop) y el envío real de `pnpm renovar` (no hay `OWNER_SECRET` en este entorno). Cuando se hagan, los hashes van a [transacciones.md](transacciones.md).

## Cómo correr el agente demo (Q7)
1. Vendedor (después de [#18](https://github.com/jxsu404/stellar-quickpass/pull/18), `api-demo/servidor/vendedor.ts`): `X402_PAY_TO=G… pnpm dev:api` (= `pnpm --filter api-demo vendedor`) (puerto `PORT`, 4020 por defecto; facilitador público `https://x402.org/facilitator` salvo que `X402_FACILITATOR_URL` diga otra cosa). Probado con este vendedor el 2026-10-26 12:45–12:46 a. m. CR: 4 pagos ([1e5d05a2…](https://stellar.expert/explorer/testnet/tx/1e5d05a27bfd1d5a5aa783adf5ed4a191ee4c0a4bdbc5f6ddbf69fd11a86d9c4), [2d1c8201…](https://stellar.expert/explorer/testnet/tx/2d1c82014289c436c45f6d5730902096caae4f5f99d805dbcb0b4d92f0b439ce), [3fba1952…](https://stellar.expert/explorer/testnet/tx/3fba1952f2a9f7b0da3b95c7589646f4520259fbf0e0dfabc1e844bdd589104b), [a192d41f…](https://stellar.expert/explorer/testnet/tx/a192d41f4a3b35c81ad6b3b4cca52a78f3a02fcad5d9c49c684ee095e59681df)), 5.º `TopeAlcanzado` y `/caro` `MontoPorLlamada`, sin tx.
2. Cuenta con tope 0,05, máx. 0,02 por llamada y saldo ≥ US$1 (si el saldo es menor, `/caro` choca con `SaldoInsuficiente` antes que con `MontoPorLlamada`; visto en testnet el 2026-10-26).
3. `BUDGET_CONTRACT_ID=C… AGENT_SECRET_KEY=S… API_DEMO_URL=http://localhost:4020 pnpm --filter agent-client exec tsx ../scripts/agente-demo.ts` → sale con código 0 solo si da 4 pagos + 2 bloqueos.
4. Corrida completa (deploy → renovar → agente → comisión → pausa → retiro): Q10, `agent-client/src/corrida-e2e.ts`; resultados en [transacciones.md](transacciones.md).

## Datos de la demo
- ID del contrato `cuenta-presupuesto` (instancia Q4, dueño = cuenta Cavos de Josué): [`CBKMDFKWDHO2V6K27R5W7N3DPSDNHOV5GBACNHZQ4YRC5YLYF2XROEEE`](https://stellar.expert/explorer/testnet/contract/CBKMDFKWDHO2V6K27R5W7N3DPSDNHOV5GBACNHZQ4YRC5YLYF2XROEEE) — datos en [`deployments/testnet.json`](../deployments/testnet.json)
  - Deploy: [tx dfddedce…](https://stellar.expert/explorer/testnet/tx/dfddedce2f702472cdae2e4153fbe02257499dfc6d6f3a83ae5102179286d279). Sin `renovar` inicial todavía.
  - Anterior (Q1, dueño = deployer de prueba): `CBH3LQQCVTY74KXKCS2526KXH2F7B32RSMSIV4ZKXKFPQS5I4UR3TALX`.
- Presupuesto del botón «Correr agente» (`/demo` y reset de la demo, `DEMO_BUDGET_CONTRACT_ID`; tope 0,05 USDC por período; agente demo `GCK5JBEO3W42C6Z7FJNNWX67U66OO554KVA6TZ2OZYRKXNWUSOV64U3S`): [`CAD2CAZC7S22MTZKAKAW76LLU2FLGX6JQEK4ITNS4FS6T7WQ5TNFKNIB`](https://stellar.expert/explorer/testnet/contract/CAD2CAZC7S22MTZKAKAW76LLU2FLGX6JQEK4ITNS4FS6T7WQ5TNFKNIB) — ver [decisión](2026-10-26-boton-correr-agente.md) y `presupuesto_correr_agente` en [`deployments/testnet.json`](../deployments/testnet.json)
- Pruebas reales de Q1 (18 pasos, txs y fees, instancia aparte): [pruebas-q1.md](pruebas-q1.md)
- Transacciones (link Stellar Expert `https://stellar.expert/explorer/testnet/tx/<hash>`): [transacciones.md](transacciones.md) (vacío hasta Q10)

<!-- enlaces:auto -->
## Enlaces

- ⬆️ Arriba: [Mapa (hub)](MAPA.md) · [Índice de docs](INDICE.md)
- 📖 Fuente de verdad: [PLAN-OPUS — la biblia](PLAN-OPUS.md)
- Relacionado: [Pruebas Q1](pruebas-q1.md) · [Pitch](PITCH.md) · [agent-client](../agent-client/AGENTS.md) · [api-demo](../api-demo/AGENTS.md) · [web](../web/AGENTS.md)
- Issue: [#5](https://github.com/jxsu404/stellar-quickpass/issues/5)
- Lo enlazan: [README](../README.md) · [Tareas](../TAREAS.md) · [agent-client](../agent-client/AGENTS.md) · [api-demo](../api-demo/AGENTS.md) · [Índice de docs](INDICE.md) · [Mapa (hub)](MAPA.md) · [Pitch](PITCH.md) · [PLAN-OPUS — la biblia](PLAN-OPUS.md) · [Transacciones (testnet)](transacciones.md) · [web](../web/AGENTS.md)
- Tags: #quickchain #docs
<!-- /enlaces:auto -->
