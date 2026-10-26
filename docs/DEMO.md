# Demo (testnet)

## Guion (≈ 2 min)
1. El dueño entra con su correo en la web (Cavos) y ve su cuenta G….
2. Firma un tope de, por ejemplo, 0,05 USDC al mes para su agente (una firma).
3. Agente demo (Q7, `scripts/agente-demo.ts`): 5 llamadas a `/tipo-cambio` (US$0,01). Con tope 0,05 y comisión de 1 % (0,0101 por llamada) las **4 primeras pagan** y responden 200, cada una con su link.
4. La **5.ª queda bloqueada** por el contrato (`TopeAlcanzado`) y **`/caro` (US$1) también** (`MontoPorLlamada`, máx. 0,02). Los bloqueos pasan en la simulación: no hay tx y no se mueve plata. No hubo ninguna firma del dueño entre llamadas.
5. El dueño firma `renovar` y el agente sigue.

## Cómo correr el agente demo (Q7)
1. Vendedor: `cd api-demo && X402_PAY_TO=G… npx next dev -p 4020` (facilitador público `https://x402.org/facilitator` por defecto).
2. Cuenta con tope 0,05, máx. 0,02 por llamada y saldo ≥ US$1 (si el saldo es menor, `/caro` choca con `SaldoInsuficiente` antes que con `MontoPorLlamada`; visto en testnet el 2026-10-26).
3. `BUDGET_CONTRACT_ID=C… AGENT_SECRET_KEY=S… API_DEMO_URL=http://localhost:4020 pnpm --filter agent-client exec tsx ../scripts/agente-demo.ts` → sale con código 0 solo si da 4 pagos + 2 bloqueos.
4. Corrida completa (deploy → renovar → agente → comisión → pausa → retiro): Q10, `agent-client/src/corrida-e2e.ts`; resultados en [transacciones.md](transacciones.md).

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
