# Transacciones (testnet)

> **Contrato vigente:** [`CBKMDFKWDHO2V6K27R5W7N3DPSDNHOV5GBACNHZQ4YRC5YLYF2XROEEE`](https://stellar.expert/explorer/testnet/contract/CBKMDFKWDHO2V6K27R5W7N3DPSDNHOV5GBACNHZQ4YRC5YLYF2XROEEE) ([deployments/testnet.json](../deployments/testnet.json)). Los otros IDs `C…` de esta tabla son deploys anteriores de prueba.

La corrida limpia de Q10 está al final; las filas Q3 son de la prueba del vendedor y el facilitador (cuentas desechables de testnet). Q10 la llena con la corrida de punta a punta. Cada hash va con link `https://stellar.expert/explorer/testnet/tx/<hash>`.

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

## Contrato vigente (Q4)

Cuenta-presupuesto [`CBKMDFKWDHO2V6K27R5W7N3DPSDNHOV5GBACNHZQ4YRC5YLYF2XROEEE`](https://stellar.expert/explorer/testnet/contract/CBKMDFKWDHO2V6K27R5W7N3DPSDNHOV5GBACNHZQ4YRC5YLYF2XROEEE), dueño = cuenta Cavos de Josué. `renovar` todavía pendiente (sin firmar).

| Hash | Qué es | Link |
|---|---|---|
| `f0aa5692` | Q4: trustline USDC de la tesorería (GAAIYNFO…) — 26/10/2026, 5:17 a. m. CR | [f0aa5692…](https://stellar.expert/explorer/testnet/tx/f0aa56929d4dcdc9c87d10ade7d1efa7f24e1e688bf6d42881965eb154ba8028) |
| `dfddedce` | Q4: deploy de la cuenta-presupuesto vigente (deployer GBMD67Q5…) — 26/10/2026, 5:18 a. m. CR | [dfddedce…](https://stellar.expert/explorer/testnet/tx/dfddedce2f702472cdae2e4153fbe02257499dfc6d6f3a83ae5102179286d279) |

## Corrida limpia Q10 (26/10/2026, 12:39:07 a. m. CR)

Script: `agent-client/src/corrida-e2e.ts` (datos crudos en [`deployments/corrida-q10.json`](../deployments/corrida-q10.json)). Cuenta de la corrida Q10 (deploy anterior; el vigente es [`CBKMDFKWDHO2V6K27R5W7N3DPSDNHOV5GBACNHZQ4YRC5YLYF2XROEEE`](https://stellar.expert/explorer/testnet/contract/CBKMDFKWDHO2V6K27R5W7N3DPSDNHOV5GBACNHZQ4YRC5YLYF2XROEEE)) [`CBAVYNKB…`](https://stellar.expert/explorer/testnet/contract/CBAVYNKBG5TKC56BXON4UKVOQX4YVPX2UA3YB77J6VSSCCKHKHSYJKCG), vendedor de `api-demo` local con el facilitador **público** `x402.org`. Cuentas de testnet de prueba; sin valor real.

| tx | qué prueba | link Stellar Expert testnet |
|---|---|---|
| `8c0b190c` | Q10: deploy de la cuenta-presupuesto — C… = CBAVYNKBG5TKC56BXON4UKVOQX4YVPX2UA3YB77J6VSSCCKHKHSYJKCG | [8c0b190c…](https://stellar.expert/explorer/testnet/tx/8c0b190cfe716aade875f1d8e1697dcb35ab732150555294cb4f51aef58633ae) |
| `331c01f0` | Q10: renovar (tope 0,05, máx. 0,02, recarga 1,05) | [331c01f0…](https://stellar.expert/explorer/testnet/tx/331c01f02702acd7e94530fe6b92dc50eba1cb012b2e14d679a1be6b66cabe94) |
| `aa26ecdd` | Q10: agente: pago 1/5 /tipo-cambio (US$0,01) | [aa26ecdd…](https://stellar.expert/explorer/testnet/tx/aa26ecdd60d84a052974132f4b630df26f6474740a3d50cf30ea891992203d26) |
| `8929c0b8` | Q10: agente: pago 2/5 /tipo-cambio (US$0,01) | [8929c0b8…](https://stellar.expert/explorer/testnet/tx/8929c0b8a39ffe5e572dac0efbba411ab0fceb188b2697c3e15188b0fca05770) |
| `af058a6a` | Q10: agente: pago 3/5 /tipo-cambio (US$0,01) | [af058a6a…](https://stellar.expert/explorer/testnet/tx/af058a6a8138662f480b41280988cd8f49a3e2fe86b06b807369e7d2a7aa12fe) |
| `3213715f` | Q10: agente: pago 4/5 /tipo-cambio (US$0,01) | [3213715f…](https://stellar.expert/explorer/testnet/tx/3213715f1bde951afe6f9c59d56c59552c18f081922072fa6fdf55b057f9370d) |
| — (sin tx) | Q10: agente: pago 5/5 /tipo-cambio (US$0,01) — TopeAlcanzado (contrato, simulación, sin tx) | — |
| — (sin tx) | Q10: agente: /caro (US$1) — MontoPorLlamada (contrato, simulación, sin tx) | — |
| `2497dec9` | Q10: cobrar_comision() — 4000 unidades a la tesorería | [2497dec9…](https://stellar.expert/explorer/testnet/tx/2497dec9905e57b4c3267b05ee4e4cccae6a77ee8113837b1e6e7e1fd138945a) |
| `2e8b7da3` | Q10: pausar() | [2e8b7da3…](https://stellar.expert/explorer/testnet/tx/2e8b7da3dafdc273fbdff6b6b4b244930949e35f2c86aaeeaa01f284e3fd8e10) |
| — (sin tx) | Q10: pago con la cuenta pausada — Pausada (contrato, simulación, sin tx) | — |
| `ab4e837d` | Q10: retirar 1.0096 USDC al dueño | [ab4e837d…](https://stellar.expert/explorer/testnet/tx/ab4e837d3e37301d2a1d854af08b9a34d71a6a872a61bb59141441447f5e6c39) |
| `15b78583` | Limpieza: `retirar` del saldo de una corrida Q10 interrumpida (`CA4NUFYM…`, 1,0096 USDC de vuelta al dueño) | [15b78583…](https://stellar.expert/explorer/testnet/tx/15b7858346956c95faf4acc70fc6d333cc60194b00e2d6876deee881dfad74ef) |

## Botón «Correr agente» (/demo, 2026-10-26)

Ver [decisión](2026-10-26-boton-correr-agente.md). Presupuesto del botón «Correr agente» (tope 0,05 USDC por período): [`CAD2CAZC7S22MTZKAKAW76LLU2FLGX6JQEK4ITNS4FS6T7WQ5TNFKNIB`](https://stellar.expert/explorer/testnet/contract/CAD2CAZC7S22MTZKAKAW76LLU2FLGX6JQEK4ITNS4FS6T7WQ5TNFKNIB) (`presupuesto_correr_agente` en [deployments/testnet.json](../deployments/testnet.json); ver [DEMO.md](DEMO.md)).

| tx | qué prueba | link Stellar Expert testnet |
|---|---|---|
| `a0c60839` | trustline USDC del dueño demo `GA67QBA6…` | [a0c60839…](https://stellar.expert/explorer/testnet/tx/a0c608393e1d744fa64db6e3e31926e5fbb359dad73ce0063f3c62574112b32b) |
| `1e7558ef` | trustline USDC del vendedor (payTo) `GAAYCAII…` | [1e7558ef…](https://stellar.expert/explorer/testnet/tx/1e7558ef0de43cc45c7fd86181c0e55a42dbf7ccc4c5fc30261b8202609be489) |
| `41210173` | compra de 3 USDC en el DEX de testnet (dueño demo) | [41210173…](https://stellar.expert/explorer/testnet/tx/41210173e5ec504a401c0cf2fdc1607828a0251ea73ca60d61da84a7da569edc) |
| `6e4cc878` | fábrica `crear` → cuenta demo `CAD2CAZC…` (agente `GCK5JBEO…`) | [6e4cc878…](https://stellar.expert/explorer/testnet/tx/6e4cc87824e01c4b1cb916466c5536252e6394b1073e516dfb2fdf67080eb1ea) |
| `a0b911ff` | `renovar` (tope 0,05, máx. 0,02, recarga 0,05) | [a0b911ff…](https://stellar.expert/explorer/testnet/tx/a0b911ffe0eacf54c61c78c0af139b00946e4da1d8c431c29a9472b8d25ba7b5) |
| `c5a8368b` | prueba local: pago 1 (0,01) desde la `C…` | [c5a8368b…](https://stellar.expert/explorer/testnet/tx/c5a8368b1cff53720f468be5c0389698d0dfaac5dfacdaf1589b5c194a8bd1e8) |
| `90253b74` | prueba local: pago 2 | [90253b74…](https://stellar.expert/explorer/testnet/tx/90253b7409db3a36e61a2609569725aff32b70523783168cb75487bd82cdbe6a) |
| `78672d8c` | prueba local: pago 3 | [78672d8c…](https://stellar.expert/explorer/testnet/tx/78672d8c621c41419d3829c0ba44ce510bde9656a3b77add69986dc165d10d30) |
| `1a2832bc` | prueba local: pago 4 | [1a2832bc…](https://stellar.expert/explorer/testnet/tx/1a2832bc2881c5fa5895588bede67b439110c7227c2ac26b098e0db178633f8c) |
| — (sin tx) | prueba local: pago 5 bloqueado, `TopeAlcanzado` (simulación, sin tx) | — |
| `32cf2c1b` | prueba local: «Reset demo budget» (`renovar`) | [32cf2c1b…](https://stellar.expert/explorer/testnet/tx/32cf2c1b8428002d9e6309344f448fd782f4d8e33f0323e09ae48079d137f171) |
| `751d7693` | preview Vercel (PR #50): pago 1 (0,01) | [751d7693…](https://stellar.expert/explorer/testnet/tx/751d76935da781ef80b52c94e590190e1f6084b6ad2ef64196f730c2e977be49) |
| `504e8490` | preview: pago 2 | [504e8490…](https://stellar.expert/explorer/testnet/tx/504e849057b142494b30affbc25235a55ee7c646908678adb250a57da2129f9b) |
| `dc0c3298` | preview: pago 3 | [dc0c3298…](https://stellar.expert/explorer/testnet/tx/dc0c3298f1fce24832ebcfeec924534e245f7df5971333211502fa6a4208b6f8) |
| `90fbbb33` | preview: pago 4 (gastado 0,0404, restante 0,0096) | [90fbbb33…](https://stellar.expert/explorer/testnet/tx/90fbbb3383367729adec539a63cf3068ff622e6d136f8f189c89ecf8e04af745) |
| — (sin tx) | preview: pago 5 bloqueado, `TopeAlcanzado` (simulación, sin tx) | — |
| `7df663f8` | preview: «Reset demo budget» (`renovar`) | [7df663f8…](https://stellar.expert/explorer/testnet/tx/7df663f8f46ba74182b3b59eb31e069ef84defc5585393755c7b36fde60da2a8) |

<!-- enlaces:auto -->
## Enlaces

- ⬆️ Arriba: [Mapa (hub)](MAPA.md) · [Índice de docs](INDICE.md)
- 📖 Fuente de verdad: [PLAN-OPUS — la biblia](PLAN-OPUS.md)
- Relacionado: [Demo (testnet)](DEMO.md) · [Costos (Q8)](COSTOS.md)
- Lo enlazan: [Botón Correr agente](2026-10-26-boton-correr-agente.md) · [Costos (Q8)](COSTOS.md) · [agent-client](../agent-client/AGENTS.md) · [api-demo](../api-demo/AGENTS.md) · [Decisiones](DECISIONES.md) · [Demo (testnet)](DEMO.md) · [Índice de docs](INDICE.md) · [Mapa (hub)](MAPA.md)
- Tags: #quickchain #docs
<!-- /enlaces:auto -->

## Fondos de prueba

- 2026-10-25: se consiguieron 2 USDC de prueba (Circle, testnet) cambiando XLM en el exchange de testnet, porque el faucet de Circle requiere navegador. Pendiente: usar primero la cuenta del equipo, como dice el plan.
