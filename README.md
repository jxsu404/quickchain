# QuickChain

**Tu agente de IA paga APIs solo, con un tope mensual en USDC que firmás una sola vez.**
Hecho para el Pura Vida Ideathon sobre Stellar (testnet).

## El problema
Las APIs empiezan a cobrar por llamada con x402. Con el esquema `exact`, cada llamada necesita un pago firmado y una transacción nueva ([issue #946 de x402](https://github.com/x402-foundation/x402/issues/946)). En Stellar, el facilitador público solo soporta `exact` ([docs de Stellar](https://developers.stellar.org/docs/build/agentic-payments/x402/built-on-stellar)). Resultado: o el dueño firma cada pago, o le da al agente una llave sin límite.

## La solución
1. El dueño entra con su **correo** usando [Cavos](https://docs.cavos.xyz/) (sin frase semilla).
2. Firma **una vez** un tope mensual en USDC para su agente.
3. Un contrato Soroban (`contracts/budget`) guarda ese tope. El agente paga APIs x402 sin pedir más firmas.
4. Si el agente intenta pasarse del tope o el mes terminó, el contrato **bloquea el pago**.
5. El mes siguiente, una firma renueva el presupuesto.

## Quién paga y cuánto
- El dueño del agente paga **1 % de lo que el agente gasta**. Sin mensualidad.
- Ejemplo: si el agente gasta 20 USDC en un mes, la comisión es 0,20 USDC.
- La comisión todavía no está implementada en el contrato (ver `TAREAS.md`).

## Nota legal
QuickChain es una herramienta para **controlar gastos** de un agente. **No es una inversión, ni ahorro, ni promete ganancias, ni es "sin riesgo".** No capta dinero del público. Ojo: el presupuesto en USDC **sí queda guardado en el contrato** de Stellar (no en una cuenta nuestra); solo el dueño puede pausarlo, cambiar el tope o retirar lo que sobra, y el agente solo puede gastar dentro del tope. Esta demo corre en Stellar **testnet** (dinero de prueba). Antes de usar dinero real en Costa Rica hay que revisar con un abogado lo que aplique de la Ley 10.961 y la normativa de SUGEF.

## Cómo correrlo
Requisitos: Node 22+, pnpm 9, Rust (rustup) con target `wasm32v1-none`, opcional `stellar` CLI.
```bash
pnpm install
cp .env.example .env          # llenar valores (nunca subir .env)
pnpm contrato:test            # tests del contrato
pnpm dev:api                  # API x402 de prueba en :4020
pnpm dev:web                  # web con Cavos en :3000
pnpm agente                   # el agente llama a la API hasta chocar con el tope
```

## Estructura
| Carpeta | Qué es |
|---|---|
| `contracts/budget` | Contrato Soroban del presupuesto (Rust) |
| `agent-client` | Cliente TS: ante 402 paga desde el presupuesto y reintenta |
| `api-demo` | API de prueba que cobra con x402 (Next.js) |
| `web` | Web del dueño con login Cavos (Next.js) |
| `docs/` | Plan, arquitectura, decisiones, seguridad, demo ([índice](docs/INDICE.md)) |
| (privado) | Buzón del equipo: repo privado `quickchain-buzon`, acceso por invitación |

Ver también: [TAREAS.md](TAREAS.md) · [CONTRIBUTING.md](CONTRIBUTING.md) · [AGENTS.md](AGENTS.md).

## Créditos
El código x402 de `api-demo` se rescató de [caja-tica-escudo](https://github.com/josedanielm0202-droid/caja-tica-escudo) (Milasur, Juliana Sanabria, josedanielm0202-droid).
