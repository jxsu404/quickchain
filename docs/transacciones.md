# Transacciones (testnet)

Q10 completa la corrida limpia; las filas Q3 son de la prueba del vendedor y el facilitador (cuentas desechables de testnet). Q10 la llena con la corrida de punta a punta. Cada hash va con link `https://stellar.expert/explorer/testnet/tx/<hash>`.

| tx | qué prueba | link Stellar Expert testnet |
|---|---|---|
| `9cd2fa25` | Q3: deploy de cuenta-presupuesto desechable `CAUZN55N…` (wasm de Q1) | [9cd2fa25…](https://stellar.expert/explorer/testnet/tx/9cd2fa255d9a815c7f6be4ab8806525d5f976d08355fa19cf525bfff59dacbc8) |
| `dd75fdb9` | Q3: `renovar` (tope 0,05, máx. 0,02, recarga 0,05) | [dd75fdb9…](https://stellar.expert/explorer/testnet/tx/dd75fdb9447ffdef07a79c9406292fab658ee08760aad17f2515bb6c85458e7a) |
| `e82320dc` | Q3: pago x402 `exact` desde `G…`, facilitador **público** (`/tipo-cambio`, US$0,01) | [e82320dc…](https://stellar.expert/explorer/testnet/tx/e82320dc157bd63ddb31f821794569da5929b5f680cc07ac81376040910788e0) |
| `62eee965` | Q3: pago x402 desde `G…`, facilitador **propio** (`/tipo-cambio`) | [62eee965…](https://stellar.expert/explorer/testnet/tx/62eee96503c2c7e3bd5342249bbd8a3e6fbac319028782647c93e5f0d92d6d7f) |
| `77f4c55a` | Q3: pago x402 desde `G…`, facilitador propio (`/caro`, US$1) | [77f4c55a…](https://stellar.expert/explorer/testnet/tx/77f4c55a8857dde9cc7edfb3662beb67ddb06f28a20dfa6fb9a53310c4f32c0d) |
| `436f2854` | Q3: pago x402 desde la **`C…`** (firma del agente), facilitador **propio**; fee cobrado 11.803 stroops | [436f2854…](https://stellar.expert/explorer/testnet/tx/436f28547e5b270c1cf4fa5c8f5a8436418c3cd641f8bf6051ff7f2e646564da) |
| `9d9070bd` | Q3: `renovar` (recarga 1,2) para probar `/caro` | [9d9070bd…](https://stellar.expert/explorer/testnet/tx/9d9070bdcdc9bea2daf7c23a53cef10796865acf06e66141b9cb52c2774ef743) |
| `d0e333b2` | Q3: pago x402 desde la **`C…`**, facilitador **público** (pago 1/4) | [d0e333b2…](https://stellar.expert/explorer/testnet/tx/d0e333b29eb42b717426844ebf4dc443083fc2abaa72e5c60d454f137d1b1fc0) |
| `c8012dfe` | Q3: pago 2/4 desde la `C…` (público) | [c8012dfe…](https://stellar.expert/explorer/testnet/tx/c8012dfea83022a4acd0b9b218b5163d4e15324bf0fcfab011572925052f2dca) |
| `fd957785` | Q3: pago 3/4 desde la `C…` (público) | [fd957785…](https://stellar.expert/explorer/testnet/tx/fd95778529947eacd0c6b9f2cb05ed57a018cb3695366bc8e2a33e8527c05756) |
| `947c51f9` | Q3: pago 4/4 desde la `C…` (público) | [947c51f9…](https://stellar.expert/explorer/testnet/tx/947c51f9fe4b4a31504bcc722b0f135472a3146f93efb0fdffd536d057bd7852) |
| — (sin tx) | Q3: 5.º pago desde la `C…` bloqueado en simulación: `Error(Contract, #8)` = `TopeAlcanzado`. No se movió plata | — |
| — (sin tx) | Q3: `/caro` (US$1) desde la `C…` bloqueado: `Error(Contract, #7)` = `MontoPorLlamada` | — |
| `3ffe6872` | Q2: `renovar` de la `C…` de prueba (periodo nuevo, tope 0,05) | [3ffe6872…](https://stellar.expert/explorer/testnet/tx/3ffe6872898a046250cbf44a876746a4f71ae2e781a1c2639efc4038393af111) |
| `c0dca2fa` | Q2: SDK `crearFetchConPresupuesto`, pago 1/4 desde la `C…` (facilitador propio) | [c0dca2fa…](https://stellar.expert/explorer/testnet/tx/c0dca2fa3e85bf6c87571e6630e00cfd9d6cf4c90d3452b9daa430dba39bbe8b) |
| `baa5bd1c` | Q2: SDK, pago 2/4 | [baa5bd1c…](https://stellar.expert/explorer/testnet/tx/baa5bd1c7fe8d22d45566dacebe88055dd8434484fc6d7c8c518ef8abee927a9) |
| `943d8378` | Q2: SDK, pago 3/4 | [943d8378…](https://stellar.expert/explorer/testnet/tx/943d8378d79a2a7f7e83dd81d7584a7704b2f5e2ab371ea6731c87df19d81234) |
| `40a58cd5` | Q2: SDK, pago 4/4 | [40a58cd5…](https://stellar.expert/explorer/testnet/tx/40a58cd54b4c04e7b649807ba82ccd0ad4b71c0a237b8b3e8cd1c21a68caa32c) |
| — (sin tx) | Q2: SDK, 5.º pago → `PagoBloqueado: TopeAlcanzado` (contrato, en simulación) | — |
| — (sin tx) | Q2: SDK, `/caro` → `PagoBloqueado: MontoPorLlamada` (contrato, en simulación) | — |
| `7bc59672` | Q8: trustline USDC de la tesorería de prueba `GA6HM4CL…` | [7bc59672…](https://stellar.expert/explorer/testnet/tx/7bc596725f9040b2483ad8e8bf6743ae7f37143bc0d73f18576638a461c415dd) |
| `3fabf3ca` | Q8: deploy de la cuenta-presupuesto `CCKZ7XID…` con tesorería distinta del dueño | [3fabf3ca…](https://stellar.expert/explorer/testnet/tx/3fabf3cace524baf14702e60ef967d85f006129133a2f9cdd27749ac5a9222b0) |
| `5918d102` | Q8: `renovar` (tope 0,05, recarga 0,03) | [5918d102…](https://stellar.expert/explorer/testnet/tx/5918d1023c8eaf84234aaf94c64a57d937f10ed806e453672e6078d926323919) |
| `dd977105` | Q8: pago x402 de US$0,01 vía SDK (+1.000 unidades de comisión pendiente) | [dd977105…](https://stellar.expert/explorer/testnet/tx/dd9771057ccaf0448cb60b5e0c5325bc1124184aca2efa2a827fe355a364824c) |
| `2de5dc18` | Q8: 2.º pago de US$0,01 vía SDK (+1.000) | [2de5dc18…](https://stellar.expert/explorer/testnet/tx/2de5dc18d620d88bf1b3d7ece108848a8fcfa21be09c4a385634392dcc112c2b) |
| `820db07e` | Q8: `cobrar_comision()` → **2.000 unidades (0,0002 USDC) a la tesorería** | [820db07e…](https://stellar.expert/explorer/testnet/tx/820db07e4b543a68ed5297398ae51009113aeadbfc1e75ac34d0be2ee919dc18) |

<!-- enlaces:auto -->
## Enlaces

- ⬆️ Arriba: [Mapa (hub)](MAPA.md) · [Índice de docs](INDICE.md)
- 📖 Fuente de verdad: [PLAN-OPUS — la biblia](PLAN-OPUS.md)
- Relacionado: [Demo (testnet)](DEMO.md) · [Costos (Q8)](COSTOS.md)
- Lo enlazan: [Costos (Q8)](COSTOS.md) · [agent-client](../agent-client/AGENTS.md) · [api-demo](../api-demo/AGENTS.md) · [Decisiones](DECISIONES.md) · [Demo (testnet)](DEMO.md) · [Índice de docs](INDICE.md) · [Mapa (hub)](MAPA.md)
- Tags: #quickchain #docs
<!-- /enlaces:auto -->

## Fondos de prueba

- 2026-10-25: se consiguieron 2 USDC de prueba (Circle, testnet) cambiando XLM en el exchange de testnet, porque el faucet de Circle requiere navegador. Pendiente: usar primero la cuenta del equipo, como dice el plan.
