# Auditoría de 3 modelos: consolidado (25 oct 2026)

Tres auditores independientes con Cursor CLI, mismo prompt, sobre `origin/main` (`9fa561f`, «Q8: comisión 1% y tabla de costos»):

| Auditor | Modelo | Informe |
|---|---|---|
| Opus | `claude-opus-5-5-high` | [2026-10-25-claude-opus-5-5-high.md](2026-10-25-claude-opus-5-5-high.md) |
| Grok | `grok-4.7-high` | [2026-10-25-grok-4.7-high.md](2026-10-25-grok-4.7-high.md) |
| GPT | `gpt-5.6-sol-high` | [2026-10-25-gpt-5.6-sol-high.md](2026-10-25-gpt-5.6-sol-high.md) |

Límite común: ninguno pudo correr tests ni consultar Horizon. Por eso «hecho» quiere decir que el código está y es coherente con los hashes que ya guarda el repo, no que alguien los haya verificado en vivo esta noche. **Todo lo que no está implementado se plantea como sugerencia, no como requisito.**

## 1. Consenso (3/3 salvo que se diga otra cosa)

**Contrato** (ninguno encontró un bug crítico ni una forma de pasar el tope total):
- **La tesorería sin trustline USDC traba `renovar`** (`lib.rs:138-151`, `:199`). Severidad media (3/3). Hoy se mitiga operando: la tesorería de la demo tiene que tener trustline y ser distinta del dueño.
- **El 1 % no queda reservado.** Si `recarga < tope`, la comisión queda como deuda sin saldo (`lib.rs:351-366`). Severidad media según GPT y Grok, baja según Opus. Se mitiga con `recarga ≥ tope`.
- **No hay «mes calendario» en cadena.** `renovar` antes de tiempo reinicia `gastado` (3/3, baja o media). La web o el script fija el 1 nov 00:00 CR. En el pitch conviene decir «tope del periodo que firmaste».
- **`fee_bps` lo elige quien despliega (0–10.000)** (3/3, baja o media). La web o el script debería mostrar y verificar `fee_bps = 100` y la tesorería oficial antes de que el dueño firme.
- **No redeployar el contrato antes de la entrega** (3/3). Los cambios en `lib.rs` van al roadmap.

**SDK y perímetro:**
- **El facilitador propio está abierto** (`api-demo/lib/facilitador.ts`): sin auth, sin allowlist de `payTo` y con un techo de 5 M stroops, así que cualquiera puede drenarle el XLM. Severidad alta según GPT, media según Opus y Grok. **No publicarlo; usar el público.**
- **`hostsPermitidos` vacío por defecto, sin `maxPorLlamada` en la demo y sin el límite de llamadas por minuto que promete el plan §3** (3/3, baja a media).
- **El 402 decide `maxTimeoutSeconds`**, o sea cuánto vive la firma (`sdk.ts:35`) (3/3, baja o media). Arreglo de una línea: `Math.min(..., 300)`.
- **Redirects:** `hostsPermitidos` se compara contra la URL original (Opus baja, GPT **alta**; Grok no lo menciona).
- **El SDK no valida `asset` ni `payTo`** (3/3, baja o media).
- **El CI no corre `pnpm --filter agent-client test`** (3/3).

**Plan contra código:**
- **Hallazgo 2 del plan (línea 8) desmentido:** el facilitador público sí liquidó pagos desde la `C…` (~11.900 stroops, tx `d0e333b2…`) (3/3).
- **El plan B de Cavos (Freighter en `web/src/billetera/freighter.ts`) no existe en el repo** (3/3).
- Estado de las fases: **Q1, Q2, Q3 y Q8 hechas; Q4 solo login** (`presupuesto/page.tsx` sigue con el TODO viejo de `approve`); **Q5 y Q6 sin empezar; Q7, Q9, Q10, Q11 y Q13 a medias; Q12, Q14 y Q15 sin empezar** (3/3).
- **La instancia de `deployments/testnet.json` (`CBH3LQQC…`) no sirve para grabar:** recarga 0 y dueño = tesorería (3/3).
- **Docs viejos:** `README.md:21` dice que la comisión no está implementada; `ARQUITECTURA.md` describe `approve`/`gastar`; `DEMO.md` habla de «6.ª bloqueada»; `TAREAS.md` pide `X-QUICKCHAIN-TX`; `PITCH.md` usa cifras que §7 excluye (3/3).
- Las rutas del plan (`sdk/`, `servidor/`) no coinciden con el código (`agent-client/`, `api-demo/`) (3/3).

## 2. Desacuerdos

| Tema | Opus | Grok | GPT |
|---|---|---|---|
| `max_por_llamada` por transfer y no por auth (t13) | No lo marca como bug | Media | Media |
| Severidad del facilitador abierto | Media | Media | **Alta** |
| Redirects en `hostsPermitidos` | Baja | — | **Alta** |
| Hora de corte de Cavos | 1:30 a. m. | 1:30 a. m. | 3:00 a. m. |
| Q0 | Hecho | Hecho | A medias (sin CI verde verificable) |
| Idempotencia y verificación de `PAYMENT-RESPONSE` | Documentarlo | Riesgo normal de x402 | Media |

## 3. Bugs críticos

**Ninguno crítico (3/3).** Los más graves son altos o medios y todos tienen mitigación operativa sin tocar el contrato: no publicar el facilitador propio, tesorería con trustline, `recarga ≥ tope`, `HOSTS_PERMITIDOS` y `maxPorLlamada` fijos, y no seguir redirects.

## 4. Propuesta de actualización del plan (solo lo que tiene consenso)

1. Línea 8 y §9/§10: el público aceptó la `C…`. El modo B sale del camino crítico y el propio queda como respaldo local, sin publicar.
2. Punto de decisión de las 11:30 p. m.: resuelto, modo A.
3. Punto de decisión de la 1:30 a. m. y §9: el plan B de Cavos pasa a ser `renovar` firmado por CLI o script, dicho en el video. Freighter no existe.
4. Q5: aplicar ya el recorte a CLI (`deploy-cuenta.sh` con `OWNER_ADDRESS`).
5. Q6: mínimo, `estado()` en la web o en la terminal; `getEvents` queda como sugerencia.
6. Q7: una sola corrida con 4 pagos, el 5.º bloqueado y `/caro` bloqueado, con cobro de comisión.
7. Q10: una instancia nueva con `recarga ≥ tope`, tesorería con trustline y distinta del dueño.
8. §3: marcar como pendiente el límite de llamadas por minuto y agregar las filas del facilitador abierto y del `maxTimeoutSeconds`.
9. Regla: no tocar el contrato antes de la entrega.
10. Sincronizar los docs viejos (README, ARQUITECTURA, DEMO, TAREAS, PITCH) como tarea de Q9/Q11/Q13.

## 5. Top 5 para las próximas 12 horas (consenso)

1. Corrida limpia en testnet sobre una sola `C…` con saldo (4 pagos + 2 bloqueos + comisión), con hashes en `transacciones.md`.
2. Spike de Cavos que solo firme `renovar` (`i128, i128, u64, i128`), con corte. Si no sale, CLI.
3. No construir Q5 ni el historial de Q6; como mucho, una vista de `estado()`.
4. Corregir `README.md:21` y los docs viejos, y armar el pitch desde §7 (con créditos a AgentAllowance y ACAN, sin McKinsey).
5. Grabar a las 8:30 y entregar en APEX a las 11:00.

## Decisiones para Josué

**Aprobadas por Josué el 2026-10-26 6:41 a. m. CR** (propuestas 1-10, en bloque; ver [DECISIONES](../DECISIONES.md) y [PLAN-OPUS](../PLAN-OPUS.md)):

- ✅ La hora de corte de Cavos: ya no aplica; el plan B es `renovar` por CLI (`pnpm renovar`).
- ✅ Arreglar el SDK (timeout, redirects, allowlist, límite por minuto): hecho en [#29](https://github.com/jxsu404/quickchain/pull/29).
- ✅ Cerrar la pregunta 6 del plan: el saldo no vuelve solo, hay que llamar `retirar`; `comision_pendiente` se mantiene tras `renovar`.
- ✅ Aprobar estas ediciones al PLAN-OPUS (regla n.º 1): aprobadas en bloque e incorporadas al plan.

<!-- enlaces:auto -->
## Enlaces

- ⬆️ Arriba: [Mapa (hub)](../MAPA.md) · [Índice de docs](../INDICE.md)
- 📖 Fuente de verdad: [PLAN-OPUS — la biblia](../PLAN-OPUS.md)
- Relacionado: [claude-opus-5-5-high](2026-10-25-claude-opus-5-5-high.md) · [grok-4.7-high](2026-10-25-grok-4.7-high.md) · [gpt-5.6-sol-high](2026-10-25-gpt-5.6-sol-high.md) · [Auditoría](../AUDITORIA.md) · [Seguridad](../SEGURIDAD.md)
- Lo enlazan: [Mapa (hub)](../MAPA.md) · [Índice de docs](../INDICE.md) · [PLAN-OPUS](../PLAN-OPUS.md)
- Tags: #quickchain #auditoria
<!-- /enlaces:auto -->
