# Arquitectura

## Piezas
```mermaid
flowchart LR
  D[Dueño] -->|correo| W[web + Cavos]
  W -->|1 firma: approve + crear_presupuesto| C[(Contrato budget<br/>Soroban)]
  A[Agente IA<br/>agent-client] -->|gastar| C
  C -->|USDC transfer_from dueño→API| P[Cuenta de la API]
  A -->|HTTP| API[api-demo x402]
```

## Flujo de un pago
```mermaid
sequenceDiagram
  participant A as agent-client
  participant API as api-demo
  participant C as budget
  A->>API: GET /api/clima
  API-->>A: 402 + accepts (payTo, amount)
  A->>C: gastar(agent, payTo, amount)
  alt dentro del tope y del mes
    C-->>A: OK (hash de tx)
    A->>API: GET + X-QUICKCHAIN-TX
    API-->>A: 200 datos
  else pasa el tope / mes vencido / cancelado
    C-->>A: error (TopeExcedido / PeriodoVencido / Inactivo)
  end
```

## Ciclo mensual
```mermaid
stateDiagram-v2
  [*] --> Activo: crear_presupuesto (firma dueño)
  Activo --> Activo: gastar (firma agente, ≤ tope)
  Activo --> Vencido: fin del periodo
  Vencido --> Activo: renovar (firma dueño)
  Activo --> Cancelado: cancelar (firma dueño)
  Cancelado --> Activo: renovar
```

## Contrato `budget`
Estado por agente: `owner, agent, token, cap, period, inicio, gastado, activo`. El USDC no entra al contrato: queda en la cuenta del dueño y sale con `transfer_from` usando la allowance que el dueño dio una vez.

<!-- enlaces:auto -->
## Enlaces

- ⬆️ Arriba: [Mapa (hub)](MAPA.md) · [Índice de docs](INDICE.md)
- 📖 Fuente de verdad: [PLAN-OPUS — la biblia](PLAN-OPUS.md)
- Relacionado: [Stack](STACK.md) · [Seguridad](SEGURIDAD.md) · [contracts/budget](../contracts/budget/AGENTS.md) · [agent-client](../agent-client/AGENTS.md) · [api-demo](../api-demo/AGENTS.md) · [web](../web/AGENTS.md)
- Lo enlazan: [Índice de docs](INDICE.md) · [Mapa (hub)](MAPA.md) · [PLAN-OPUS — la biblia](PLAN-OPUS.md) · [Seguridad](SEGURIDAD.md) · [Stack](STACK.md)
- Tags: #quickchain #docs
<!-- /enlaces:auto -->
