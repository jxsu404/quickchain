# contracts/budget — contexto para agentes

Contrato Soroban (Rust, `soroban-sdk` 22) que guarda un presupuesto por agente.
- Funciones: `crear_presupuesto(owner, agent, token, cap, period)`, `gastar(agent, to, amount)`, `renovar(agent, cap)`, `cancelar(agent)`, `consultar(agent)`.
- `gastar` falla con `TopeExcedido` si se pasa del tope y con `PeriodoVencido` si terminó el periodo.
- El USDC sale del dueño con `transfer_from`: el dueño debe dar `approve` al contrato (una firma).
- Pendiente (TODO en código): comisión 1 %, script de despliegue a testnet.

Comandos: `cargo test -p budget` · build wasm: `stellar contract build` (requiere target wasm32v1-none).
Nota: `Cargo.lock` fija `ed25519-dalek` 2.2.0 para compilar con rustc 1.85. No lo borres.

## Tests (7, todos pasan con `cargo test -p budget`)
| Test | Qué prueba |
|---|---|
| tope_se_respeta_y_paga | gasta dentro del tope, el USDC llega al destino, se puede llegar justo al tope |
| sobregasto_rechazado | pasarse del tope da `TopeExcedido` y no mueve fondos |
| periodo_vencido_bloquea_y_renovar_reinicia | al terminar el periodo da `PeriodoVencido`; `renovar` reinicia gastado y tope |
| cancelar_bloquea | tras `cancelar`, `gastar` da `Inactivo` |
| monto_invalido_y_duplicado | monto 0 rechazado; no se crea dos veces el mismo agente |
| agente_sin_firma_rechazado | si firma otra cuenta (no el agente), `gastar` falla |
| solo_dueno_renueva_o_cancela | el agente no puede cancelar su propio presupuesto |

<!-- enlaces:auto -->
## Enlaces

- ⬆️ Arriba: [Mapa (hub)](../../docs/MAPA.md) · [Índice de docs](../../docs/INDICE.md)
- 📖 Fuente de verdad: [PLAN-OPUS — la biblia](../../docs/PLAN-OPUS.md)
- Relacionado: [agent-client](../../agent-client/AGENTS.md) · [Seguridad](../../docs/SEGURIDAD.md)
- Issue: [#1](https://github.com/jxsu404/quickchain/issues/1)
- Lo enlazan: [AGENTS (raíz)](../../AGENTS.md) · [Tareas](../../TAREAS.md) · [agent-client](../../agent-client/AGENTS.md) · [Arquitectura](../../docs/ARQUITECTURA.md) · [Mapa (hub)](../../docs/MAPA.md) · [PLAN-OPUS — la biblia](../../docs/PLAN-OPUS.md) · [Seguridad](../../docs/SEGURIDAD.md) · [web](../../web/AGENTS.md)
- Tags: #quickchain #paquete
<!-- /enlaces:auto -->
