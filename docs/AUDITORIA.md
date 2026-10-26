# Auditoría

## Lista de revisión
- [ ] Sin llaves, semillas, tokens ni `.env` en git
- [ ] `.gitignore` cubre `.env*` (excepto `.env.example`), `target/`, `node_modules/`, `.next/`
- [ ] Sin restos de Writz/Bitcoin en el código
- [ ] Links de docs responden
- [ ] Cada cifra tiene fuente
- [ ] Docs coinciden con el código (funciones, comandos, variables)
- [ ] Tests del contrato pasan; wasm compila; typecheck TS pasa
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

## Hallazgos abiertos
1. `api-demo` todavía no acepta `X-QUICKCHAIN-TX` → el reintento del agente recibirá 402 hasta resolver la pregunta abierta 1 (DECISIONES.md).
2. Comisión del 1 % no implementada (TODO en `gastar`).
3. Contrato sin desplegar; `stellar` CLI no instalado en la máquina de la auditoría.
4. Web no firma aún `approve` + `crear_presupuesto`.

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
