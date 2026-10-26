# Seguridad — modelo de amenazas

| Amenaza | Mitigación | Estado |
|---|---|---|
| Agente comprometido gasta todo | tope por periodo en el contrato; `gastar` exige firma del agente | hecho (tests) |
| Otra cuenta se hace pasar por el agente | `agent.require_auth()` | hecho (test `agente_sin_firma_rechazado`) |
| El agente cambia su propio tope | `renovar`/`cancelar` exigen firma del dueño | hecho (test `solo_dueno_renueva_o_cancela`) |
| Gasto después de fin de mes | `PeriodoVencido` | hecho (test) |
| Desbordamiento de enteros | `checked_add` + `overflow-checks = true` | hecho |
| Allowance mayor que el tope | el contrato limita igual por `cap`; la web debe pedir `approve` = tope | pendiente (web) |
| API cobra sin entregar | `api-demo` prepara la respuesta antes de liquidar | hecho (heredado) |
| Pago falso con `X-QUICKCHAIN-TX` | verificar tx en RPC (destino, monto, contrato, no reutilizada) | pendiente (pregunta abierta 1) |
| Filtración de llaves | `.gitignore` cubre `.env*`; `.env.example` solo nombres | hecho |
| Mensajes que suenen a inversión | reglas en AGENTS.md y CONTRIBUTING.md | hecho |

Riesgos aceptados para la demo: solo testnet; un presupuesto por agente; sin auditoría externa del contrato.

<!-- enlaces:auto -->
## Enlaces

- ⬆️ Arriba: [Mapa (hub)](MAPA.md) · [Índice de docs](INDICE.md)
- 📖 Fuente de verdad: [PLAN-OPUS — la biblia](PLAN-OPUS.md)
- Relacionado: [Arquitectura](ARQUITECTURA.md) · [Auditoría](AUDITORIA.md) · [contracts/budget](../contracts/budget/AGENTS.md)
- Lo enlazan: [Cómo contribuir](../CONTRIBUTING.md) · [contracts/budget](../contracts/budget/AGENTS.md) · [Arquitectura](ARQUITECTURA.md) · [Auditoría](AUDITORIA.md) · [Índice de docs](INDICE.md) · [Mapa (hub)](MAPA.md) · [PLAN-OPUS — la biblia](PLAN-OPUS.md)
- Tags: #quickchain #docs
<!-- /enlaces:auto -->
