# Índice de documentación

> **Regla n.º 1: [docs/PLAN-OPUS.md](PLAN-OPUS.md) es la biblia de Stellar QuickPass.** Toda persona o agente que trabaje aquí (integrantes, Raúl, Martín o cualquier otro) lee el plan antes de empezar y sigue sus fases, tareas (Q0–Q15), horarios de corte y planes B. Si algo choca con el plan, gana el plan; cualquier integrante puede editar el plan y la app por PR y hacer merge a `main` con el CI en verde; los cambios importantes del plan se anotan con fecha en [DECISIONES](DECISIONES.md).

| Documento | Para qué |
|---|---|
| [PLAN-OPUS.md](PLAN-OPUS.md) | **Plan oficial (la biblia): fases, tareas, cortes** |
| [PLAN.md](PLAN.md) | Qué construimos y en qué orden |
| [STACK.md](STACK.md) | Tecnologías y por qué |
| [ARQUITECTURA.md](ARQUITECTURA.md) | Piezas y flujos (diagramas) |
| [DECISIONES.md](DECISIONES.md) | Decisiones con fecha y preguntas abiertas |
| [2026-10-26-boton-correr-agente.md](2026-10-26-boton-correr-agente.md) | Botón «Correr agente» en `/demo`: el agente paga x402 hasta el tope y queda bloqueado |
| [2026-10-26-nuevo-plazo-entrega.md](2026-10-26-nuevo-plazo-entrega.md) | Nuevo plazo APEX: 3:00 p. m. CR, congelar 2:30 p. m. |
| [SEGURIDAD.md](SEGURIDAD.md) | Modelo de amenazas |
| [AUDITORIA.md](AUDITORIA.md) | Lista de revisión y resultados |
| [DEMO.md](DEMO.md) | Guion de la demo y links de transacciones |
| [../web/AGENTS.md](../web/AGENTS.md) | Web: landing `/`, demo `/demo` (login Cavos), presupuesto `/presupuesto` |
| [../contracts/fabrica-presupuesto/AGENTS.md](../contracts/fabrica-presupuesto/AGENTS.md) | Fábrica: cualquiera crea su cuenta-presupuesto (`crear`, `listar`); decisión [2026-10-26](2026-10-26-fabrica-presupuesto.md) |
| [../mcp/README.md](../mcp/README.md) | MCP server: agentes MCP (Claude, Cursor, Grok Bot) pagan x402 con tope; decisión [2026-10-26](2026-10-26-mcp-quickpass.md) |
| [pruebas-q1.md](pruebas-q1.md) | Pruebas reales de Q1 en testnet (txs y fees) |
| [transacciones.md](transacciones.md) | Hashes de testnet (vacío hasta Q10) y link a Stellar Expert |
| [deploy-api.md](deploy-api.md) | Deploy del vendedor api-demo (Render / Docker) |
| [COSTOS.md](COSTOS.md) | Fees medidos en testnet y comisión de 1 % (Q8) |
| [../api-demo/AGENTS.md](../api-demo/AGENTS.md) | Vendedor demo `api-demo/servidor/vendedor.ts` (`/tipo-cambio`, `/caro`) y facilitador x402 (Q3) |
| [PITCH.md](PITCH.md) | Pitch (borrador) |
| [MARCA.md](MARCA.md) | Marca v1.0: paleta, tipografía, logo, voz |
| [2026-10-26-crear-agente-vacio.md](2026-10-26-crear-agente-vacio.md) | Decisión: `/crear` sin agente demo precargado (seguridad) |
| [auditorias/2026-10-25-consolidado.md](auditorias/2026-10-25-consolidado.md) | Auditoría de 3 modelos (Opus, Grok, GPT): consolidado + [Opus](auditorias/2026-10-25-claude-opus-5-5-high.md) · [Grok](auditorias/2026-10-25-grok-4.7-high.md) · [GPT](auditorias/2026-10-25-gpt-5.6-sol-high.md) |
| [../TAREAS.md](../TAREAS.md) | Tareas y fecha límite |
| [../CONTRIBUTING.md](../CONTRIBUTING.md) | Reglas del equipo |
| [../AGENTS.md](../AGENTS.md) | Contexto para agentes de código |
| `quickchain-buzon` (repo privado, por invitación) | Pedidos entre integrantes |

<!-- enlaces:auto -->
## Enlaces

- ⬆️ Arriba: [Mapa (hub)](MAPA.md) · (este es el índice)
- 📖 Fuente de verdad: [PLAN-OPUS — la biblia](PLAN-OPUS.md)
- Relacionado: [Plan (resumen)](PLAN.md) · [Arquitectura](ARQUITECTURA.md) · [Stack](STACK.md) · [Decisiones](DECISIONES.md) · [Seguridad](SEGURIDAD.md) · [Auditoría](AUDITORIA.md) · [Demo (testnet)](DEMO.md) · [Pruebas Q1](pruebas-q1.md) · [Transacciones (testnet)](transacciones.md) · [Pitch](PITCH.md) · [Auditoría 3 modelos](auditorias/2026-10-25-consolidado.md)
- Lo enlazan: [AGENTS (raíz)](../AGENTS.md) · [README](../README.md) · [Mapa (hub)](MAPA.md) · [PLAN-OPUS — la biblia](PLAN-OPUS.md) · [Transacciones (testnet)](transacciones.md)
- Tags: #quickchain #docs
<!-- /enlaces:auto -->
