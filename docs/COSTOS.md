# Costos medidos (testnet) y comisión de 1 %

Fila Q8 de [PLAN-OPUS](PLAN-OPUS.md). **Toda cifra sale de una tx real de Stellar testnet**: cada fila enlaza su hash en Stellar Expert. Los fees se leyeron de Horizon (`fee_charged`) con `pnpm --filter agent-client medir-costos`. No hay proyecciones ni precios externos: el valor del XLM en dólares no se incluye porque no tenemos una fuente citada (ver "Pendiente").

## Fee de red por operación

| Operación | Fee cobrado (stroops) | Fee cobrado (XLM) | Fee máximo ofrecido (stroops) | Fuente |
|---|---|---|---|---|
| Pago x402 desde C… (SDK, facilitador propio) | 11805 | 0.0011805 | 16893 | [dd977105…](https://stellar.expert/explorer/testnet/tx/dd9771057ccaf0448cb60b5e0c5325bc1124184aca2efa2a827fe355a364824c) |
| Pago x402 desde C… (SDK, facilitador propio) | 11805 | 0.0011805 | 16893 | [2de5dc18…](https://stellar.expert/explorer/testnet/tx/2de5dc18d620d88bf1b3d7ece108848a8fcfa21be09c4a385634392dcc112c2b) |
| Pago x402 desde C… (facilitador público) | 11903 | 0.0011903 | 16991 | [d0e333b2…](https://stellar.expert/explorer/testnet/tx/d0e333b29eb42b717426844ebf4dc443083fc2abaa72e5c60d454f137d1b1fc0) |
| Pago x402 desde G… normal (facilitador público) | 11597 | 0.0011597 | 16687 | [e82320dc…](https://stellar.expert/explorer/testnet/tx/e82320dc157bd63ddb31f821794569da5929b5f680cc07ac81376040910788e0) |
| Pago x402 desde G… normal (facilitador propio) | 11497 | 0.0011497 | 16587 | [62eee965…](https://stellar.expert/explorer/testnet/tx/62eee96503c2c7e3bd5342249bbd8a3e6fbac319028782647c93e5f0d92d6d7f) |
| renovar (firma del dueño, recarga 0,03 USDC) | 104612 | 0.0104612 | 1123656 | [5918d102…](https://stellar.expert/explorer/testnet/tx/5918d1023c8eaf84234aaf94c64a57d937f10ed806e453672e6078d926323919) |
| cobrar_comision (2.000 unidades a la tesorería) | 7930 | 0.0007930 | 1012730 | [820db07e…](https://stellar.expert/explorer/testnet/tx/820db07e4b543a68ed5297398ae51009113aeadbfc1e75ac34d0be2ee919dc18) |
| Deploy de una cuenta-presupuesto (constructor) | 656537 | 0.0656537 | 1759046 | [3fabf3ca…](https://stellar.expert/explorer/testnet/tx/3fabf3cace524baf14702e60ef967d85f006129133a2f9cdd27749ac5a9222b0) |

1 XLM = 10.000.000 stroops. En testnet el fee lo paga el **facilitador** en los pagos x402 (`areFeesSponsored: true`) y el **dueño** en `renovar` y en el deploy. `cobrar_comision` lo paga quien la llame.

## Comisión de 1 % (contrato de [#11](https://github.com/jxsu404/quickchain/pull/11), sin cambios)

- Instancia de prueba [`CCKZ7XID…`](https://stellar.expert/explorer/testnet/contract/CCKZ7XID33B73EMO2O3BBYKLVEHOJIQ7WVYJEV5TPIICEQXIDG3B7YKJ), con una tesorería propia [`GA6HM4CL…`](https://stellar.expert/explorer/testnet/account/GA6HM4CLRCQLW7G7GDS3HEFFLAU5ELNB7LA2IR3XV5IHRQ42BIPYWA5S), distinta del dueño.
- 2 pagos de US$0,01 (100.000 unidades). Cada uno suma 1.000 unidades de comisión, redondeada hacia arriba: `gastado` pasa a 0,0202 USDC y la comisión pendiente a 2.000 unidades.
- `cobrar_comision()` mandó **2.000 unidades (0,0002 USDC)** a la tesorería en la tx [820db07e…](https://stellar.expert/explorer/testnet/tx/820db07e4b543a68ed5297398ae51009113aeadbfc1e75ac34d0be2ee919dc18). El saldo USDC de la tesorería pasó de 0 a 0,0002, leído en Horizon antes y después.

## Lectura honesta

- Un pago desde la `C…` cuesta unos 11.800 stroops de fee: apenas entre 200 y 400 stroops más que uno desde una `G…` normal (entre 11.497 y 11.597). Eso queda **por debajo** del techo de 50.000 stroops del facilitador público, que de hecho aceptó la `C…`.
- En un pago de US$0,01, la comisión es 0,0001 USDC, mientras que el fee de red es de unos 0,00118 XLM y lo paga el facilitador. Para saber si el 1 % cubre ese fee hace falta un precio XLM/USD con fuente. Si no lo cubre en micropagos, se dice, como pide el plan (§8: lotes, canal o comisión mínima).
- `renovar` cuesta unos 104.612 stroops y el deploy unos 656.537 stroops. Son pagos de una vez al mes y una vez por dueño, respectivamente.

## Pendiente
- Precio XLM/USD con fuente citada, para convertir los fees a dólares.
- Repetir la medición en la corrida limpia de Q10 con la cuenta oficial del equipo.

<!-- enlaces:auto -->
## Enlaces

- ⬆️ Arriba: [Mapa (hub)](MAPA.md) · [Índice de docs](INDICE.md)
- 📖 Fuente de verdad: [PLAN-OPUS — la biblia](PLAN-OPUS.md)
- Relacionado: [Transacciones (testnet)](transacciones.md) · [agent-client](../agent-client/AGENTS.md) · [Decisiones](DECISIONES.md) · [Pitch](PITCH.md)
- Lo enlazan: [Mapa (hub)](MAPA.md) · [Índice de docs](INDICE.md) · [Transacciones (testnet)](transacciones.md) · [agent-client](../agent-client/AGENTS.md) · [Decisiones](DECISIONES.md)
- Tags: #quickchain #docs #q8
<!-- /enlaces:auto -->
