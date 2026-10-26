# Demo (testnet)

## Guion (≈ 2 min)
1. El dueño entra con su correo en la web (Cavos) y ve su cuenta G….
2. Firma un tope de, por ejemplo, 0,05 USDC al mes para su agente (una firma).
3. `pnpm agente` con `LLAMADAS=8` y API a 0,01 USDC: las primeras 5 llamadas pagan y responden 200.
4. La 6.ª llamada queda **bloqueada** por el contrato (`TopeExcedido`). No hubo ninguna firma del dueño entre llamadas.
5. El dueño firma `renovar` y el agente sigue.

## Datos de la demo
- ID del contrato: _pendiente (tarea 1)_
- Transacciones (link Stellar Expert `https://stellar.expert/explorer/testnet/tx/<hash>`): _pendiente (tarea 5)_

<!-- enlaces:auto -->
## Enlaces

- ⬆️ Arriba: [Mapa (hub)](MAPA.md) · [Índice de docs](INDICE.md)
- 📖 Fuente de verdad: [PLAN-OPUS — la biblia](PLAN-OPUS.md)
- Relacionado: [Pitch](PITCH.md) · [agent-client](../agent-client/AGENTS.md) · [api-demo](../api-demo/AGENTS.md) · [web](../web/AGENTS.md)
- Issue: [#5](https://github.com/jxsu404/quickchain/issues/5)
- Lo enlazan: [README](../README.md) · [Tareas](../TAREAS.md) · [agent-client](../agent-client/AGENTS.md) · [api-demo](../api-demo/AGENTS.md) · [Índice de docs](INDICE.md) · [Mapa (hub)](MAPA.md) · [Pitch](PITCH.md) · [PLAN-OPUS — la biblia](PLAN-OPUS.md) · [web](../web/AGENTS.md)
- Tags: #quickchain #docs
<!-- /enlaces:auto -->
