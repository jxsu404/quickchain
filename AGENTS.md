# AGENTS.md — contexto para agentes de código

> **Regla n.º 1: [docs/PLAN-OPUS.md](docs/PLAN-OPUS.md) es la biblia de QuickChain.** Toda persona o agente que trabaje aquí (integrantes, Raúl, Martín o cualquier otro) lee el plan antes de empezar y sigue sus fases, tareas (Q0–Q15), horarios de corte y planes B. Si algo choca con el plan, gana el plan; para cambiarlo, se propone en el buzón y lo aprueba Josué.

## Producto
QuickChain: el dueño de un agente de IA entra con correo (Cavos, sin frase semilla) y firma **una vez** un tope mensual en USDC en Stellar. El agente paga APIs x402 sin firmas por llamada hasta llegar al tope o a fin de mes. Un contrato Soroban hace cumplir el tope. Una firma renueva el mes siguiente. Modelo: 1 % de lo que gasta el agente, sin mensualidad.

## Arquitectura
Ver [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md). Resumen: `web` (dueño, Cavos) → `contracts/budget` (tope) ← `agent-client` (agente) → `api-demo` (cobra con x402).

## Mapa de carpetas
- `contracts/budget/` — Rust, soroban-sdk 22. Tiene su propio [AGENTS.md](contracts/budget/AGENTS.md).
- `agent-client/` — TS + @stellar/stellar-sdk. [AGENTS.md](agent-client/AGENTS.md)
- `api-demo/` — Next.js + @x402/core + @x402/stellar. [AGENTS.md](api-demo/AGENTS.md)
- `web/` — Next.js + @cavos/kit. [AGENTS.md](web/AGENTS.md)
- `docs/` — [INDICE.md](docs/INDICE.md).

## Comandos
`pnpm install` · `pnpm contrato:test` · `pnpm dev:api` · `pnpm dev:web` · `pnpm agente` · `pnpm typecheck`
Wasm: `cargo build -p budget --target wasm32v1-none --release` (o `stellar contract build`).

## Reglas del equipo
Rama `rol/<nombre>`, PR a `main`, commits pequeños. Detalle en [CONTRIBUTING.md](CONTRIBUTING.md).

## Reglas legales y de texto
- Nunca presentar QuickChain como inversión, ahorro, rendimiento ni "sin riesgo" (Ley 10.961, SUGEF).
- Toda cifra lleva fuente. Toda tx de demo lleva link `https://stellar.expert/explorer/testnet/tx/<hash>`.
- Sin Writz ni Bitcoin.

## Secretos
Nunca escribas llaves, semillas ni `.env` en el repo. Usá `.env` local (ignorado) y agregá solo el **nombre** a `.env.example`.

## Buzón
El buzón del equipo vive en el repo privado `jxsu404/quickchain-buzon` (acceso por invitación). Ahí van los pedidos entre integrantes.

## Definición de listo
1. Cumple el criterio de su tarea en [TAREAS.md](TAREAS.md).
2. Tests y `pnpm typecheck` pasan.
3. Docs del paquete (`AGENTS.md`) y `docs/` actualizados si cambió el comportamiento.
4. Sin secretos ni cifras sin fuente. PR a `main`.
