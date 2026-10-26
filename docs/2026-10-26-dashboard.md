# 2026-10-26 · Dashboard del dueño (`/dashboard`)

**Decisión (Juliana, 2:43 p. m. CR; mockup A «anillo» elegido entre 3; falta OK de Josué en el PR):** la web tiene una página `/dashboard?contract=C…` que responde en un vistazo «¿cuánto gastó mi agente, cuánto le queda y qué bloqueó?». No cambia el contrato. Solo testnet.

## Qué muestra y de dónde sale cada dato
| Dato | Fuente |
|---|---|
| Anillo gastado / tope, restante, saldo, máx. por llamada, comisión pendiente, periodo, pausada | `estado()` del contrato por simulación (`leerEstado`, [lib/renovar.ts](../web/lib/renovar.ts)) |
| Tiempo para el fin del periodo (hora CR) | `fin_periodo` de `estado()` |
| Pagos del agente | Eventos `transfer` del SAC de USDC con `from = C…`, cuya tx invoca el SAC (pago x402) |
| Comisión enviada a la tesorería | `transfer` desde la `C…` hacia `tesoreria` |
| Retiros del dueño | `transfer` desde la `C…` cuya tx invoca la propia `C…` (`retirar`) |
| Recargas | `transfer` hacia la `C…` |
| Renovaciones y pausas | Eventos del contrato `renovar` (topic `["renovar", periodo]`) y `pausa` |
| Intentos bloqueados | Solo los que vio «Correr agente» en esta pestaña (`sessionStorage`) |

- Código: [web/lib/historial.ts](../web/lib/historial.ts) (eventos de Soroban RPC, paginados con cursor), [web/lib/tablero.ts](../web/lib/tablero.ts) (colores, tiempo, bloqueos) y `web/app/dashboard/`. Tests sin red en `web/test/tablero.test.ts`.
- Colores ([MARCA](MARCA.md)): Verde Paso hasta el 80 % del tope, Ámbar Tope si pasa del 80 %, Rojo Bloqueo si la cuenta está pausada, el periodo venció o «Correr agente» vio un bloqueo en este periodo. El color siempre va con ícono y texto.
- Acciones: «Renew / top up» → `/presupuesto?contract=C…`; «Pause/Resume agent» firma `pausar`/`reanudar` con Cavos (solo si la `G…` de Cavos es el `owner`); «Run demo agent» → `/demo?contract=C…`.

## Límites conocidos
- **Los bloqueos no están en la red.** El agente simula el pago y `__check_auth` lo rechaza (`TopeAlcanzado`, `MontoPorLlamada`…): no se envía tx y no hay evento. Por eso el dashboard no puede listar bloqueos de otros navegadores ni de otros agentes; lo dice en pantalla.
- **El RPC guarda ~7 días** (`ledgerRetentionWindow` = 120 960 ledgers, visto en `getHealth` el 2026-10-26). Lo más viejo se ve en Stellar Expert.
- Leer el historial toma ~5–6 s con la cuenta demo (70 movimientos), porque para cada pago se lee la tx y así se distingue un pago de un retiro.
- **Sin probar:** la firma de `pausar`/`reanudar` con Cavos (en este entorno no hay login de Cavos). La página llama `wallet.invokeContract({ contractId, method, args: [] })`, igual que `renovar` en `/presupuesto`.

## Prueba en el navegador (2026-10-26 ~2:40 p. m. CR, `next dev` contra testnet)
Cuenta demo [`CAD2CAZC…`](https://stellar.expert/explorer/testnet/contract/CAD2CAZC7S22MTZKAKAW76LLU2FLGX6JQEK4ITNS4FS6T7WQ5TNFKNIB), periodo #11: 81 % (0,0404 de 0,05 USDC) en Ámbar, restante 0,0096 USDC y 4 pagos de 0,01 USDC con su tx ([a70649da…](https://stellar.expert/explorer/testnet/tx/a70649dad8f0b44981994b9911c53ca81282ebfd07f053fdbd55baed25a7ade3), [b5cad151…](https://stellar.expert/explorer/testnet/tx/b5cad1515de960387000586d101c41b596301c312e545265a66e93c341c71d56), [ca3293bf…](https://stellar.expert/explorer/testnet/tx/ca3293bfd35a4910bdf1c5797ee6ce77309779d9c41a35cabd018cced93f5c84), [f571e9a9…](https://stellar.expert/explorer/testnet/tx/f571e9a95624ec5f25065fcf7c28b5f91e6d889355d0fde958402b61e40665ee)), más la renovación [c3581ca0…](https://stellar.expert/explorer/testnet/tx/c3581ca0cb9e015e09a9e7c0f5cc11d31e4ebca945954f7cef75c2b391a54d1c). El estado rojo y el de error (C… inválida) se probaron a mano; el rojo, con un bloqueo puesto en `sessionStorage` solo para la prueba.

<!-- enlaces:auto -->
## Enlaces

- ⬆️ [Mapa (hub)](MAPA.md) · [Índice de docs](INDICE.md) · [Decisiones](DECISIONES.md)
- 📖 Fuente de verdad: [PLAN-OPUS — la biblia](PLAN-OPUS.md)
- Relacionado: [web](../web/AGENTS.md) · [Botón «Correr agente»](2026-10-26-boton-correr-agente.md) · [Marca](MARCA.md) · [Arquitectura](ARQUITECTURA.md)
- Tags: #quickchain #docs
<!-- /enlaces:auto -->
