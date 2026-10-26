# Auditoría

## Lista de revisión
- [ ] Sin llaves, semillas, tokens ni `.env` en git
- [ ] `.gitignore` cubre `.env*` (excepto `.env.example`), `target/`, `node_modules/`, `.next/`
- [ ] Sin restos de Writz/Bitcoin en el código
- [ ] Links de docs responden
- [ ] Cada cifra tiene fuente
- [ ] Docs coinciden con el código (funciones, comandos, variables)
- [ ] Tests del contrato pasan; wasm compila; typecheck TS pasa
- [ ] CI en pull request y push a `main`: tests, wasm, typecheck, `docs:links`
- [ ] gitleaks sobre todo el historial y grep de semillas Stellar sin hallazgos
- [ ] `docs/transacciones.md` existe; cada tx de demo publicada lleva link a Stellar Expert
- [ ] Sin lenguaje de inversión / "sin riesgo"

## Resultados — 2026-10-25, 8:40 p. m. (CR), pasada de Grok Bot
| Punto | Resultado |
|---|---|
| Secretos | OK. `git grep` de `S…` (56 car.), `ghp_`, `PRIVATE KEY`: sin coincidencias. Único archivo env: `.env.example` (solo nombres). |
| `.gitignore` | OK. Cubre `.env`, `.env.*`, `!.env.example`, `target/`, `node_modules/`, `.next/`, `*.pem`, `*.key`, `.stellar/`. |
| Writz/Bitcoin | OK. Solo aparecen en reglas/decisiones que dicen que quedan fuera. |
| Links | OK (200): Cavos docs, Stellar x402 docs, x402 #946, agenteconomy.to, repo viejo. McKinsey bloquea peticiones automáticas (no se pudo verificar con curl; revisar en navegador). |
| Cifras | OK. README: solo ejemplo de cálculo del 1 % (aritmética). PITCH: 2 cifras, ambas con link. |
| Docs vs código | OK. Funciones del contrato, variables de `.env.example` y comandos de `package.json` coinciden con AGENTS.md/README. |
| Contrato | OK. `cargo test -p budget`: **7 pasan** (tope, sobregasto, periodo vencido + renovar, cancelar, monto inválido/duplicado, agente sin firma, solo dueño renueva/cancela). `cargo build --target wasm32v1-none --release`: `budget.wasm` 15 KB. |
| TypeScript | OK. `pnpm -r typecheck` pasa en `web`, `api-demo`, `agent-client`. No se corrió `next build` ni pruebas contra testnet. |
| Lenguaje legal | OK. Solo aparece en avisos que dicen que **no** es inversión. |

## Resultados — 2026-10-25, 8:50 p.m. (CR), pasada Q0
Comandos corridos en local. El workflow de GitHub todavía no se ejecutó: esta rama no se subió.

| Punto | Resultado |
|---|---|
| CI | `.github/workflows/ci.yml` dispara en `pull_request` y en `push` a `main`. En local: `cargo test -p budget` **7 pasan**; `cargo build -p budget --target wasm32v1-none --release` termina (rustc 1.99.1); `pnpm install --frozen-lockfile`, `pnpm typecheck` y `pnpm docs:links` pasan (20 nodos). |
| Secretos | gitleaks 8.30.1 con `--log-opts=--all` sobre el historial de la rama: sin hallazgos. Grep `\bS[A-Z2-7]{55}\b` sobre `git rev-list --all`: sin coincidencias. |
| Writz/Bitcoin | `git grep -i -E "writz\|bitcoin"` no pega en código (`contracts/`, `web/`, `api-demo/`, `agent-client/`). Solo en líneas que enuncian la regla o el fuera de alcance: `AGENTS.md`, `CONTRIBUTING.md`, `docs/DECISIONES.md`, `docs/AUDITORIA.md`, `docs/PLAN.md` y `docs/PLAN-OPUS.md` (USDC que no hay que usar, llaves viejas, tarea Q0, fuera del pitch). |
| transacciones.md | Creado vacío y enlazado desde [MAPA.md](MAPA.md) e [INDICE.md](INDICE.md). |

## Pasada Q1 — 2026-10-25, 9:00 p. m. (CR), Grok Bot (rama `rol/jose`, PR #11)
Revisión de `contracts/cuenta-presupuesto` contra PLAN-OPUS §2.1–§2.3, §3, fila Q1 de §4, TAREAS §1, contracts/cuenta-presupuesto/AGENTS.md, SEGURIDAD y estas reglas. Archivo de referencia: `contracts/cuenta-presupuesto/src/lib.rs` (`lib.rs:N`) y `test.rs`.

| Punto | Estado | Evidencia |
|---|---|---|
| §2.1 Config/Politica/Contadores en storage *instance* | cumplido | lib.rs:24, 33, 43; TTL en lib.rs:121–126 |
| §2.1 sin admin ni `upgrade` | cumplido | lib.rs:9; no hay función de upgrade |
| §2.2 constructor (fee ≤ 10 000) | cumplido | lib.rs:156; t17 |
| §2.2 `renovar`: cobra pendiente, recarga, reinicia, valida rangos (≤ 32 d) | cumplido | lib.rs:183–217; t06, t08, t14; testnet 01 |
| §2.2 `pausar`/`reanudar`/`cambiar_agente` (dueño) | cumplido | lib.rs:221–243; t07; testnet 05a–06c |
| §2.2 `retirar` no toca la comisión | cumplido | lib.rs:247; t09; testnet 09a/09b |
| §2.2 `cobrar_comision` pública, a tesorería fija | cumplido | lib.rs:262; t10; testnet 08 (enviada por la tesorería) |
| §2.2 `__check_auth`: orden pausa → periodo → firma → contextos → tope | cumplido | lib.rs:298–370; t01–t07 |
| §2.2 errores con código | parcial | firma ed25519 inválida aborta en host en vez de `FirmaInvalida=3` (no deja pasar; documentado) |
| §2.2 sin eventos en `__check_auth` | cumplido | solo `publish` en lib.rs:217, 226, 234, 243 |
| §2.3 los 11 tests | cumplido | t01–t11; `cargo test -p cuenta-presupuesto` 17/17 |
| §3 agente comprometido / loop / prompt injection (lado contrato) | cumplido | tope + máx. por llamada: t02, t03, t12, t13, t15; testnet 03, 07c, 07e |
| §3 llave ajena / rotación | cumplido | t04, t07; testnet 04, 06b, 06c |
| §3 replay | cumplido (por la red) | nonce de la auth entry de Soroban; no se probó aparte |
| §3 rate limit, facilitador, verificación `X-QUICKCHAIN-TX` | fuera de Q1 | Q2/Q3 |
| §3 secretos fuera de git | cumplido | `gitleaks git` 0 hallazgos (con `.gitleaks.toml`); `.env` gitignored |
| §4 fila Q1: contrato, tests, deploy, `deployments/testnet.json`, link | cumplido | [Demo](DEMO.md); `scripts/deploy-cuenta.sh` |
| §4 carpeta `contracts/cuenta-presupuesto/` | cumplido | renombrada desde `contracts/budget` al ponerse al día con main |
| TAREAS §1 | cumplido | tests, deploy, ID en Demo, comisión |
| contracts/cuenta-presupuesto/AGENTS.md coincide con el código | cumplido | actualizado a 17 tests |
| SEGURIDAD.md al día | cumplido tras corregir | tenía 3 filas del diseño viejo; corregidas |
| AUDITORIA.md al día | cumplido tras corregir | hallazgos 2–4 y el resultado de 7 tests eran viejos |
| Token = USDC de Circle (`CBIELTK6…`) | cumplido | 3 fuentes en [pruebas-q1](pruebas-q1.md); la nota «Writz» del plan está errada |
| Reglas AGENTS/CONTRIBUTING (rama propia, PR, sin secretos, sin Writz/Bitcoin, cifras con fuente) | cumplido | PR #11; links de Stellar Expert |
| CI con gitleaks | cumplido tras merge con main | `.github/workflows/ci.yml` (Q0) |

Casos borde revisados: overflow (t15), redondeo de la comisión (t11, t12), tope exacto (t12, testnet 07d/07e), cambio de periodo (t06, t14; una auth firmada antes cuenta en el periodo donde se ejecuta), transferencias de otro token (t05), `to == C` (t05), varias transferencias en una auth (t13), otras funciones firmadas por el agente (t05; se revisan también subinvocaciones) y agente malicioso: solo puede mover USDC con `transfer` y el acumulado incluye la comisión, así que el máximo que puede salir en un periodo es el `tope`. No necesitó cambios en `lib.rs`.

## Hallazgos abiertos
1. `api-demo` todavía no acepta `X-QUICKCHAIN-TX` → el reintento del agente recibirá 402 hasta resolver la pregunta abierta 1 (DECISIONES.md).
2. ~~Comisión del 1 % no implementada~~ → resuelto en Q1 (`calcular_comision`, t10–t12, testnet 08).
3. ~~Contrato sin desplegar~~ → resuelto en Q1 ([Demo](DEMO.md), [pruebas-q1](pruebas-q1.md)).
4. Web: ya no usa `approve` + `crear_presupuesto`; falta desplegar una cuenta por dueño y firmar `renovar` (Q4/Q5).
5. ~~No hay CI~~ → resuelto en Q0 (`.github/workflows/ci.yml` con tests, wasm, typecheck, links y gitleaks).
6. [Arquitectura](ARQUITECTURA.md) todavía describe el diseño viejo (`gastar`/`approve`). Le toca a Q9.

## Sugerencias del equipo de auditoría (2026-10-25)
Son **sugerencias opcionales**, no requisitos para que el producto sea bueno. Salen de las auditorías de Raven, jueces, validador y Pao.

| Sugerencia | Estado |
|---|---|
| Que cada integrante tenga commits propios en el repo | Opcional |
| Demo real en testnet: 4 llamadas pagadas + la 5.ª bloqueada por el tope, con links de Stellar Expert | **Pendiente** |
| Cambiar el contrato al diseño de cuenta-presupuesto `C…` (`__check_auth`). Según Raven, los facilitadores x402 rechazan pagos con `approve`/`transfer_from` | **Pendiente** |
| Validar con 5–10 personas que construyen agentes | Opcional |
| Evaluar una mensualidad como alternativa (o complemento) al 1 % | Opcional |
| Slogan: «Tu agente paga solo. Nunca más de tu tope.» | Opcional |
| Web con barra de tope (gastado vs. tope del mes) | Opcional |

<!-- enlaces:auto -->
## Enlaces

- ⬆️ Arriba: [Mapa (hub)](MAPA.md) · [Índice de docs](INDICE.md)
- 📖 Fuente de verdad: [PLAN-OPUS — la biblia](PLAN-OPUS.md)
- Relacionado: [Pruebas Q1](pruebas-q1.md) · [Decisiones](DECISIONES.md) · [Seguridad](SEGURIDAD.md)
- Lo enlazan: [Decisiones](DECISIONES.md) · [Índice de docs](INDICE.md) · [Mapa (hub)](MAPA.md) · [PLAN-OPUS — la biblia](PLAN-OPUS.md) · [Seguridad](SEGURIDAD.md)
- Tags: #quickchain #docs
<!-- /enlaces:auto -->
