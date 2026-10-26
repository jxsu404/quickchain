# Arquitectura

Diseño vigente según [PLAN-OPUS §1](PLAN-OPUS.md) (modo A: la cuenta-contrato paga directo). El USDC del mes **vive en la cuenta-presupuesto `C…`**; no hay `approve` ni `transfer_from`.

## Piezas
```mermaid
flowchart LR
  D[Dueño G…] -->|correo| W[web + Cavos]
  W -->|1 firma: renovar tope, máx., fin, recarga| C[(cuenta-presupuesto C…<br/>Soroban)]
  A[Agente IA<br/>agent-client, llave sin fondos] -->|firma auth entry de transfer| F[Facilitador x402<br/>público o propio]
  F -->|envía transfer C→vendedor| C
  C -->|USDC| V[Vendedor api-demo G…<br/>servidor/vendedor.ts]
  A -->|HTTP + PAYMENT-SIGNATURE| V
  C -->|comisión 1 % acumulada| T[Tesorería fija]
```

## Flujo de un pago (x402 `exact`, `from = C…`)
```mermaid
sequenceDiagram
  participant A as agent-client
  participant V as vendedor (api-demo/servidor/vendedor.ts)
  participant F as facilitador
  participant C as cuenta-presupuesto
  A->>V: GET /tipo-cambio
  V-->>A: 402 + PAYMENT-REQUIRED (payTo, amount, areFeesSponsored)
  A->>A: arma transfer(C, payTo, amount), simula, firma la auth entry con la llave del agente, simula otra vez
  alt __check_auth lo rechaza en la simulación
    A-->>A: PagoBloqueado (TopeAlcanzado / MontoPorLlamada / Pausada / PeriodoVencido…), sin tx
  else pasa
    A->>V: GET + PAYMENT-SIGNATURE
    V->>F: verify y settle
    F->>C: envía la tx (el facilitador paga el fee)
    C->>C: __check_auth: firma del agente, solo transfer de USDC, tope + comisión, máx. por llamada, periodo, pausa
    C-->>V: USDC
    V-->>A: 200 + PAYMENT-RESPONSE (hash de la tx)
  end
```

## Ciclo del periodo
```mermaid
stateDiagram-v2
  [*] --> SinPresupuesto: deploy (constructor: owner, agente, token, tesorería, fee_bps)
  SinPresupuesto --> Activo: renovar (firma del dueño)
  Activo --> Activo: pago del agente (≤ tope y ≤ máx. por llamada)
  Activo --> Vencido: fin_periodo
  Vencido --> Activo: renovar (cobra comisión pendiente, reinicia gastado)
  Activo --> Pausado: pausar (dueño)
  Pausado --> Activo: reanudar (dueño)
```

## Contrato `cuenta-presupuesto`
- Config (constructor): `owner`, `token` (USDC de Circle en testnet), `tesoreria`, `fee_bps` (100 = 1 %). Sin admin ni `upgrade`.
- Política: `agente` (llave ed25519), `tope`, `max_por_llamada`, `fin_periodo`, `pausada`. Contadores: `periodo`, `gastado`, `comision_pendiente`.
- Funciones del dueño (`owner.require_auth()`): `renovar`, `pausar`, `reanudar`, `cambiar_agente`, `retirar` (no puede tocar la comisión pendiente). Pública: `cobrar_comision`, `estado`.
- Código: [`contracts/cuenta-presupuesto/src/lib.rs`](../contracts/cuenta-presupuesto/AGENTS.md). Corrida de punta a punta en testnet con links: [transacciones](transacciones.md).

<!-- enlaces:auto -->
## Enlaces

- ⬆️ Arriba: [Mapa (hub)](MAPA.md) · [Índice de docs](INDICE.md)
- 📖 Fuente de verdad: [PLAN-OPUS — la biblia](PLAN-OPUS.md)
- Relacionado: [Stack](STACK.md) · [Seguridad](SEGURIDAD.md) · [contracts/cuenta-presupuesto](../contracts/cuenta-presupuesto/AGENTS.md) · [agent-client](../agent-client/AGENTS.md) · [api-demo](../api-demo/AGENTS.md) · [web](../web/AGENTS.md)
- Lo enlazan: [Índice de docs](INDICE.md) · [Mapa (hub)](MAPA.md) · [PLAN-OPUS — la biblia](PLAN-OPUS.md) · [Seguridad](SEGURIDAD.md) · [Stack](STACK.md)
- Tags: #quickchain #docs
<!-- /enlaces:auto -->
