# Pruebas reales de Q1 en testnet (`cuenta-presupuesto`)

Corrida del 25/10/2026, 8:53–8:54 p. m. (hora de Costa Rica), con el wasm `7190eb76…3288` (el mismo de la instancia de la [Demo](DEMO.md)). **18 de 18 pasos dieron lo esperado.** Datos crudos en [`deployments/pruebas-q1.json`](../deployments/pruebas-q1.json).

## Cómo reproducir
```bash
# .env (gitignored) con DEPLOYER_SECRET_KEY y AGENT_SECRET_KEY; si faltan las PRUEBA_*, el script las genera y las agrega a .env sin imprimirlas.
pnpm install && stellar --version   # stellar-cli 28.1.0
node scripts/pruebas-q1.mjs         # escribe deployments/pruebas-q1.json
```
El script nunca imprime llaves. Cada pago lo arma como `USDC.transfer(C, vendedor, monto)`, firma la auth entry de `C` con la llave del agente (`authorizeEntry`) y **simula dos veces**. La simulación en modo *recording* no corre `__check_auth`; la segunda, con la auth firmada, sí. Si la segunda falla, no se envía nada y se anota el error. Por eso **los bloqueos no tienen tx**.

## Instancia y cuentas de prueba
- Contrato aparte (no toca el de la demo): [`CDPWYHPE…QWJYSE`](https://stellar.expert/explorer/testnet/contract/CDPWYHPERIW2RU7TPUE3ZGRQWHS7VPC5SY2V3SEHSPGCVMBHAGQWJYSE). Deploy: [059c72cd…](https://stellar.expert/explorer/testnet/tx/059c72cd848fa6b5acd2866e05218736df5cb9cd071d01c23a4b589daaabf9b8)
- Dueño `GCP4NEWM…NA3D` (deployer) · tesorería [`GBPWNQGV…W6W3`](https://stellar.expert/explorer/testnet/account/GBPWNQGVFX7MAWYKNP5VFO43II4GJOTTGDOTDW4LQPLUQGYPXCIHW6W3) · vendedor [`GA4OOAEA…6WVC`](https://stellar.expert/explorer/testnet/account/GA4OOAEAL2IW7XBJQCWEPZIH5VABUGOO7TV3JDKNEWNY4HJNW62D6WVC) · `fee_bps = 100`.
- Token: SAC del USDC de Circle `CBIELTK6…DAMA` (ver verificación abajo).

### De dónde salió el USDC (aviso)
1. **Faucet de Circle:** no se pudo automatizar. `https://faucet.circle.com/api/faucet` responde HTTP 404 y la API `v1/faucet/drips` exige API key y no ofrece Stellar. La web del faucet pide captcha.
2. **Cuenta del equipo:** no había ninguna con USDC de testnet disponible.
3. **Lo que se usó:** un *path payment* XLM → USDC en el DEX de testnet, de la cuenta deployer, por 2 USDC: [8fdd0760…](https://stellar.expert/explorer/testnet/tx/8fdd0760b59941153d258a9a6cdb10c3478e3af92383fec4b0453eba7fd907aa). Es USDC real de Circle en testnet, no un token propio. Esto **se desvía del orden de planes B** pedido (faucet → cuenta del equipo → token propio): se eligió porque mantiene el token verdadero.

Trustlines USDC (fee 100 c/u): dueño [d2a5f0dc…](https://stellar.expert/explorer/testnet/tx/d2a5f0dc7fafb9efc7a8d0350f7bb17ab21a252eaaa484a9a0de5d5d156c5a16), tesorería [019a4547…](https://stellar.expert/explorer/testnet/tx/019a45475838f81aa7493564588369308aa3102742e116b0c4928850c13d3e8d), vendedor [aadad6f2…](https://stellar.expert/explorer/testnet/tx/aadad6f2ca02c1973df0fad4577372271cbb5b7435f240007928618b77497a1a).

## Resultados
Montos en stroops de USDC (1 USDC = 10 000 000). Tope 500 000 (0,05), máximo por llamada 200 000 (0,02), pago normal 100 000 (0,01) + 1 000 de comisión.

| Paso | Qué se probó | Esperado | Real | Fee (stroops XLM) | Tx |
|---|---|---|---|---|---|
| 01 | `renovar(tope 0,05, max 0,02, fin +7 d, recarga 0,1)` (dueño) | OK | OK | 104612 | [f9a32bf3…](https://stellar.expert/explorer/testnet/tx/f9a32bf365a3b5f70d18454ce22fc85c7af209767cfaaec13bafb9057587741b) |
| 02 | pago 0,01 USDC al vendedor (llave del agente) | OK; gastado 101 000 | OK; gastado 101 000, pendiente 1 000 | 11805 | [c73c0450…](https://stellar.expert/explorer/testnet/tx/c73c04500b0683455b3650c624029562f0a007ff0b63d33ee174884705edd336) |
| 03 | pago 0,03 (> max 0,02) | bloqueo `#7 MontoPorLlamada` | bloqueado en simulación 2: `Error(Contract, #7)` | — | sin tx (bloqueo) |
| 04 | pago firmado con llave ajena | bloqueo `#4 AgenteDesconocido` | bloqueado: `#4` | — | sin tx (bloqueo) |
| 05a | `pausar` (dueño) | OK | OK | 3543 | [20232682…](https://stellar.expert/explorer/testnet/tx/2023268260e005bd05012eed64bc3289e2a6c64fa6df1d4ca3c78cbe4483a044) |
| 05b | pago con la cuenta en pausa | bloqueo `#1 Pausada` | bloqueado: `#1` | — | sin tx (bloqueo) |
| 05c | `reanudar` (dueño) | OK | OK | 3543 | [90c7f486…](https://stellar.expert/explorer/testnet/tx/90c7f486d0e0a2199a3fe230948850788e009e8a9c5727410b2edd64d3211f03) |
| 06a | `cambiar_agente(agente2)` (dueño) | OK | OK | 3833 | [ae7d8218…](https://stellar.expert/explorer/testnet/tx/ae7d8218468321d8b916128fe8d6f13d41a6c59a6fa1002c6accfdb8a1054d30) |
| 06b | pago con la llave vieja | bloqueo `#4` | bloqueado: `#4` | — | sin tx (bloqueo) |
| 06c | pago con la llave nueva | OK | OK; gastado 202 000 | 11805 | [9aa0c099…](https://stellar.expert/explorer/testnet/tx/9aa0c0997dbd60d58af6bfae61df6c265c32f033add731dfd631a23e06afdfd5) |
| 07a | 3.er pago 0,01 | OK | OK; gastado 303 000 | 11805 | [602c0be2…](https://stellar.expert/explorer/testnet/tx/602c0be2d370b04002bcbb70a7d35f04d1c472b7218cfdef7ddf13cc4dce7635) |
| 07b | 4.º pago 0,01 | OK | OK; gastado 404 000 | 11805 | [adcf2ac6…](https://stellar.expert/explorer/testnet/tx/adcf2ac60604ef60b527115cf27e606aee90ef92cb8f35fbc0c215ada10d3832) |
| 07c | 5.º pago 0,01 (404 000 + 101 000 > 500 000) | bloqueo `#8 TopeAlcanzado` | bloqueado: `#8` | — | sin tx (bloqueo) |
| 07d | pago de 95 049 stroops (+951 comisión = tope exacto) | OK; restante 0 | OK; gastado 500 000, restante 0 | 11805 | [7ea34ea6…](https://stellar.expert/explorer/testnet/tx/7ea34ea66afd82df5f22140f97dab4dc2b1e1d457996d826c7d3b100a4b8c2db) |
| 07e | 1 stroop más | bloqueo `#8` | bloqueado: `#8` | — | sin tx (bloqueo) |
| 08 | `cobrar_comision()` enviada por la tesorería (no el dueño) | devuelve 4 951; tesorería +4 951 | OK; 4 951 (= 4×1 000 + 951); pendiente 0 | 7930 | [deaf3431…](https://stellar.expert/explorer/testnet/tx/deaf3431af2e1d8a1c9e9fed45a96ef5b8910f7e1c38c210a6316a9991569a4f) |
| 09a | `retirar(saldo + 1)` (dueño) | bloqueo `#10 ParametrosInvalidos` | bloqueado: `#10` | — | sin tx (bloqueo) |
| 09b | `retirar(saldo)` (dueño) | OK; saldo de C = 0 | OK; saldo 0 | 6711 | [b06a13c9…](https://stellar.expert/explorer/testnet/tx/b06a13c9e6435b68489eaff5fff8d4774b16c0bcce7e909824ea5f69dfc43d2e) |

Saldos finales: vendedor recibió 495 049 (= 4 × 100 000 + 95 049); tesorería 4 951; `C` quedó en 0.

### Fees reales (stroops de XLM, fee cobrado)
| Operación | Fee |
|---|---|
| `renovar` con recarga (primera, crea entradas) | 104 612 |
| pago del agente (`USDC.transfer` con `__check_auth`) | 11 805 |
| `cobrar_comision` | 7 930 |
| `retirar` | 6 711 |
| `cambiar_agente` | 3 833 |
| `pausar` / `reanudar` | 3 543 |
| trustline / path payment | 100 |

Un pago del agente cuesta ≈ 0,0012 XLM en testnet.

## Verificación de `CBIELTK6…` (no es Writz)
- `stellar contract id asset --asset USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5 --network testnet` → `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA`.
- Horizon [`/assets?asset_code=USDC&asset_issuer=GBBD47…`](https://horizon-testnet.stellar.org/assets?asset_code=USDC&asset_issuer=GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5) muestra `contract_id` `CBIELTK6…` (≈128 000 cuentas con trustline).
- Circle lista el emisor de testnet: [USDC contract addresses](https://developers.circle.com/stablecoins/usdc-contract-addresses) → «Stellar Testnet USDC-GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5».

Conclusión: es el SAC del USDC de Circle. La nota del plan que lo atribuye a Writz parece un error; corregirla en PLAN-OPUS es decisión de Josué.

## Tests unitarios
`cargo test -p cuenta-presupuesto`: **17 pasan** (t01–t11 del plan y t12–t17 de casos borde; ver [contracts/cuenta-presupuesto](../contracts/cuenta-presupuesto/AGENTS.md)). La auditoría de cumplimiento está en [Auditoría](AUDITORIA.md).

<!-- enlaces:auto -->
## Enlaces

- ⬆️ Arriba: [Mapa (hub)](MAPA.md) · [Índice de docs](INDICE.md)
- 📖 Fuente de verdad: [PLAN-OPUS — la biblia](PLAN-OPUS.md)
- Relacionado: [Demo (testnet)](DEMO.md) · [Auditoría](AUDITORIA.md) · [Seguridad](SEGURIDAD.md) · [Decisiones](DECISIONES.md) · [contracts/cuenta-presupuesto](../contracts/cuenta-presupuesto/AGENTS.md)
- Issue: [#1](https://github.com/jxsu404/quickchain/issues/1)
- Lo enlazan: [Demo (testnet)](DEMO.md) · [Índice de docs](INDICE.md) · [Mapa (hub)](MAPA.md) · [Auditoría](AUDITORIA.md) · [contracts/cuenta-presupuesto](../contracts/cuenta-presupuesto/AGENTS.md)
- Tags: #quickchain #docs #q1
<!-- /enlaces:auto -->
