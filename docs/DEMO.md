# Demo (testnet)

## Guion (≈ 2 min)
1. El dueño entra con su correo en la web (Cavos) y ve su cuenta G….
2. Firma un tope de, por ejemplo, 0,05 USDC al mes para su agente (una firma).
3. `pnpm agente` con `LLAMADAS=8` y API a 0,01 USDC: las primeras 5 llamadas pagan y responden 200.
4. La 6.ª llamada queda **bloqueada** por el contrato (`TopeAlcanzado`). No hubo ninguna firma del dueño entre llamadas.
5. El dueño firma `renovar` y el agente sigue.

## Datos de la demo
- ID del contrato `cuenta-presupuesto` (Q1): [`CBH3LQQCVTY74KXKCS2526KXH2F7B32RSMSIV4ZKXKFPQS5I4UR3TALX`](https://stellar.expert/explorer/testnet/contract/CBH3LQQCVTY74KXKCS2526KXH2F7B32RSMSIV4ZKXKFPQS5I4UR3TALX) — datos en [`deployments/testnet.json`](../deployments/testnet.json)
  - Deploy: [tx 9fdac47c…](https://stellar.expert/explorer/testnet/tx/9fdac47cfff9ecb3648fd89821b74ee7501c6d89a2a7d823d8cec6e2f30196b7)
  - `renovar` inicial (tope 0,05 USDC, máx. 0,02, recarga 0): [tx 17f33d65…](https://stellar.expert/explorer/testnet/tx/17f33d6533e16be433d5f3acd93a8dc282511f1087e7e29fff11abf32cd4212f)
  - Ojo: en esta instancia el dueño es la cuenta deployer de prueba, todavía sin USDC; Q4/Q5 despliegan una por dueño.
- Pruebas reales de Q1 (18 pasos, txs y fees, instancia aparte): [pruebas-q1.md](pruebas-q1.md)
- Transacciones (link Stellar Expert `https://stellar.expert/explorer/testnet/tx/<hash>`): [transacciones.md](transacciones.md) (vacío hasta Q10)

<!-- enlaces:auto -->
## Enlaces

- ⬆️ Arriba: [Mapa (hub)](MAPA.md) · [Índice de docs](INDICE.md)
- 📖 Fuente de verdad: [PLAN-OPUS — la biblia](PLAN-OPUS.md)
- Relacionado: [Pruebas Q1](pruebas-q1.md) · [Pitch](PITCH.md) · [agent-client](../agent-client/AGENTS.md) · [api-demo](../api-demo/AGENTS.md) · [web](../web/AGENTS.md)
- Issue: [#5](https://github.com/jxsu404/quickchain/issues/5)
- Lo enlazan: [README](../README.md) · [Tareas](../TAREAS.md) · [agent-client](../agent-client/AGENTS.md) · [api-demo](../api-demo/AGENTS.md) · [Índice de docs](INDICE.md) · [Mapa (hub)](MAPA.md) · [Pitch](PITCH.md) · [PLAN-OPUS — la biblia](PLAN-OPUS.md) · [Transacciones (testnet)](transacciones.md) · [web](../web/AGENTS.md)
- Tags: #quickchain #docs
<!-- /enlaces:auto -->
