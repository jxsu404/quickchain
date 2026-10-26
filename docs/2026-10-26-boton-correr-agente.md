# 2026-10-26 · Botón «Correr agente» en /demo

**Decisión (aprobada por Josué 11:06 a. m. CR):** `/demo` tiene un botón **«Correr agente»** para que el jurado **vea** al agente pagar una API x402 desde la cuenta-presupuesto hasta el tope y quedar bloqueado. Solo testnet.

## Qué hace
- `POST /api/agente/correr?contract=C…` (sin `contract` usa la cuenta demo `DEMO_BUDGET_CONTRACT_ID`): el servidor hace de agente. Llama a la API de pago `GET /api/x402/tipo-cambio` (US$0,01, x402 `exact`, facilitador público `x402.org`), firma **solo** la auth entry de la `C…` con su llave ed25519 y reintenta. Hasta 10 llamadas; corta cuando el contrato rechaza. Responde NDJSON en streaming.
- La UI lista cada pago (monto en USDC + link a Stellar Expert testnet), el **presupuesto restante** y, al llegar al tope, **«⛔ Bloqueado: llegó al tope»** (`TopeAlcanzado`, rechazo en la simulación: sin tx, no se mueve plata).
- Con tope 0,05, máx. 0,02 y comisión 1 %: 4 pagos de 0,01 (gastado 0,0404) y el 5.º se bloquea.
- «Reset demo budget» (`POST /api/agente/reiniciar`): solo para la cuenta demo, su dueño de testnet firma `renovar` (tope 0,05, máx. 0,02, fin de mes CR) y repone el saldo. Así el jurado puede repetirlo.
- Código: [web/lib/agente-servidor.ts](../web/lib/agente-servidor.ts) (misma lógica que `armarPagoDesdeCuenta` de Raúl en [agent-client](../agent-client/AGENTS.md)) y [web/lib/x402-servidor.ts](../web/lib/x402-servidor.ts) (copia chica de `cobrar` de [api-demo](../api-demo/AGENTS.md)). La API se llama en proceso, no por HTTP, para que la protección de previews de Vercel no la bloquee.
- Aviso de espera al firmar con Cavos en `/presupuesto` y `/crear` (contador de segundos y «puede tardar 10–60 s»), por el reporte de Aang.

## Llaves y cuentas (testnet)
- La secreta del agente demo anterior (`eb54a995…`, [deployments/testnet.json](../deployments/testnet.json)) no estaba disponible. Se generó un agente nuevo `GCK5JBEO3W42C6Z7FJNNWX67U66OO554KVA6TZ2OZYRKXNWUSOV64U3S` (hex `95d4848e…`); `/crear` lo usa ahora como «agente demo».
- Variables de Vercel (producción y preview), **nunca en el repo**: `AGENT_SECRET_KEY`, `DEMO_OWNER_SECRET` (sensibles), `DEMO_BUDGET_CONTRACT_ID`, `X402_PAY_TO`.
- Cuenta demo creada con la [fábrica](2026-10-26-fabrica-presupuesto.md) (no se redesplegó ningún contrato): [`CAD2CAZC7S22MTZKAKAW76LLU2FLGX6JQEK4ITNS4FS6T7WQ5TNFKNIB`](https://stellar.expert/explorer/testnet/contract/CAD2CAZC7S22MTZKAKAW76LLU2FLGX6JQEK4ITNS4FS6T7WQ5TNFKNIB), dueño `GA67QBA6…`, vendedor (payTo) `GAAYCAII…`.
- La cuenta de Aang `CCK75LCVNWNL5PJD7QXSWZZN2FNMRIS7A4XIMZJKWK6GX6VGRMIGXRPR` autoriza al agente viejo `eb54a995…`: el botón muestra «AgenteDesconocido». Para usarla, su dueño tiene que firmar `cambiar_agente` con el agente nuevo o crear otra cuenta en `/crear`.

## Transacciones
Ver la sección «Botón Correr agente» en [transacciones](transacciones.md).

<!-- enlaces:auto -->
## Enlaces

- ⬆️ [Índice de docs](INDICE.md) · [Decisiones](DECISIONES.md) · [Fábrica](2026-10-26-fabrica-presupuesto.md) · [Transacciones](transacciones.md) · [web](../web/AGENTS.md)
<!-- /enlaces:auto -->
