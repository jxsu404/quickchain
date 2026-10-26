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

## Hallazgos abiertos
1. `api-demo` todavía no acepta `X-QUICKCHAIN-TX` → el reintento del agente recibirá 402 hasta resolver la pregunta abierta 1 (DECISIONES.md).
2. Comisión del 1 % no implementada (TODO en `gastar`).
3. Contrato sin desplegar; `stellar` CLI no instalado en la máquina de la auditoría.
4. Web no firma aún `approve` + `crear_presupuesto`.
5. El YAML de CI está en la rama y los mismos comandos pasan en local; falta ver el check en verde en GitHub (esta pasada no hizo push).

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
- Relacionado: [Decisiones](DECISIONES.md) · [Seguridad](SEGURIDAD.md)
- Lo enlazan: [Decisiones](DECISIONES.md) · [Índice de docs](INDICE.md) · [Mapa (hub)](MAPA.md) · [PLAN-OPUS — la biblia](PLAN-OPUS.md) · [Seguridad](SEGURIDAD.md)
- Tags: #quickchain #docs
<!-- /enlaces:auto -->
