# QuickChain

> **Regla n.º 1: [docs/PLAN-OPUS.md](docs/PLAN-OPUS.md) es la biblia de QuickChain.** Toda persona o agente que trabaje aquí (integrantes, Raúl, Martín o cualquier otro) lee el plan antes de empezar y sigue sus fases, tareas (Q0–Q15), horarios de corte y planes B. Si algo choca con el plan, gana el plan; para cambiarlo, se propone en el buzón y lo aprueba Josué.

**Tu agente de IA paga APIs solo, con un tope mensual en USDC que firmás una sola vez.**
Hecho para el Pura Vida Ideathon sobre Stellar. **Corre en testnet y el contrato no está auditado.**

## El problema
Las APIs empiezan a cobrar por llamada con x402. Con el esquema `exact`, cada llamada necesita un pago firmado y una transacción nueva ([issue #946 de x402](https://github.com/x402-foundation/x402/issues/946)). En Stellar, el facilitador público soporta `exact` ([docs de Stellar](https://developers.stellar.org/docs/build/agentic-payments/x402/built-on-stellar)). Resultado: o el dueño firma cada pago, o le da al agente una llave con fondos y sin límite.

## Cómo funciona
1. El dueño entra con su **correo** usando [Cavos](https://docs.cavos.xyz/) (sin frase semilla).
2. Se despliega su **cuenta-presupuesto**: una cuenta-contrato `C…` de Soroban ([`contracts/cuenta-presupuesto`](contracts/cuenta-presupuesto/AGENTS.md)).
3. El dueño firma **una vez** `renovar`: tope del mes, máximo por llamada, fin del periodo y recarga en USDC.
4. El agente tiene una llave ed25519 **sin fondos**. Ante un 402, el SDK ([`agent-client`](agent-client/AGENTS.md)) arma el pago x402 `exact` con `from = C…` y lo firma con esa llave.
5. El `__check_auth` del contrato solo deja pasar transferencias de USDC dentro del tope (comisión incluida), del máximo por llamada, antes del fin del periodo y sin pausa. Si no, **bloquea en la simulación: no hay tx y no se mueve plata**.
6. El dueño puede pausar, rotar la llave del agente o retirar lo que sobra, cada cosa con una firma.

Evidencia en testnet, cada fila con link a Stellar Expert: [docs/transacciones.md](docs/transacciones.md). Por ejemplo, un pago desde la `C…` con el facilitador público: [d0e333b2…](https://stellar.expert/explorer/testnet/tx/d0e333b29eb42b717426844ebf4dc443083fc2abaa72e5c60d454f137d1b1fc0). Diagramas en [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) y amenazas en [docs/SEGURIDAD.md](docs/SEGURIDAD.md).

## Por qué Stellar
- x402 ya corre en Stellar con el esquema `exact` y un facilitador público ([docs de Stellar](https://developers.stellar.org/docs/build/agentic-payments/x402/built-on-stellar), [blog de x402 en Stellar](https://stellar.org/es/blog/noticias-fundacion/x402-en-stellar)).
- Soroban permite cuentas-contrato con `__check_auth` propio: el límite lo aplica la cadena, no el agente.
- Fees medidos en testnet: un pago x402 desde la `C…` cobró unos 11.800 stroops ([dd977105…](https://stellar.expert/explorer/testnet/tx/dd9771057ccaf0448cb60b5e0c5325bc1124184aca2efa2a827fe355a364824c)), apenas unos cientos más que desde una `G…` normal ([e82320dc…](https://stellar.expert/explorer/testnet/tx/e82320dc157bd63ddb31f821794569da5929b5f680cc07ac81376040910788e0)). Tabla completa en [docs/COSTOS.md](docs/COSTOS.md).
- USDC de Circle en testnet (SAC `CBIELTK6…`).

## Negocio
- **Cliente:** quien tiene agentes (dev o equipo) y quiere que paguen APIs x402 sin darles una wallet con fondos.
- **Precio:** 1 % de lo que gasta el agente, acumulado en el contrato e incluido en el tope. Sin mensualidad ni costo de entrada.
- **Ya implementado:** cada pago suma la comisión y `cobrar_comision()` la manda a una tesorería fija. Probado en testnet ([820db07e…](https://stellar.expert/explorer/testnet/tx/820db07e4b543a68ed5297398ae51009113aeadbfc1e75ac34d0be2ee919dc18), ver [COSTOS](docs/COSTOS.md)).
- **Riesgo honesto:** en un pago de US$0,01 la comisión es 0,0001 USDC. Todavía no sabemos si eso cubre el fee de red en micropagos: falta un precio XLM/USD con fuente. Además, en x402 normalmente paga el vendedor; cobrarle al comprador hay que validarlo.

## Nota legal
QuickChain es una herramienta para **controlar gastos** de un agente. **No es una inversión, ni ahorro, ni promete ganancias, ni es "sin riesgo".** No capta dinero del público. El presupuesto en USDC **sí queda guardado en el contrato** de Stellar (no en una cuenta nuestra); solo el dueño puede pausarlo, cambiar el tope o retirar lo que sobra, y el agente solo puede gastar dentro del tope. Esta demo corre en Stellar **testnet** (dinero de prueba) y **el contrato no está auditado**. Antes de usar dinero real en Costa Rica hay que revisar con un abogado lo que aplique de la Ley 10.961 y la normativa de SUGEF.

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
Guía de la demo en testnet: [docs/DEMO.md](docs/DEMO.md).

## Estructura
| Carpeta | Qué es |
|---|---|
| `contracts/cuenta-presupuesto` | Contrato Soroban de la cuenta-presupuesto (Rust) |
| `agent-client` | SDK del agente: ante un 402 paga desde la `C…` y reintenta |
| `api-demo` | Vendedor demo que cobra con x402 y facilitador propio |
| `web` | Web del dueño con login Cavos (Next.js) |
| `docs/` | Plan, arquitectura, decisiones, seguridad, demo ([índice](docs/INDICE.md)) |
| (privado) | Buzón del equipo: repo privado `quickchain-buzon`, acceso por invitación |

Ver también: [TAREAS.md](TAREAS.md) · [CONTRIBUTING.md](CONTRIBUTING.md) · [AGENTS.md](AGENTS.md).

## Créditos
- La idea de usar una cuenta-contrato con tope como pagador x402 en Stellar ya la exploraron [AgentAllowance](https://github.com/karagozemin/AgentAllowance) y [ACAN](https://github.com/phoenix-2203/acan) (ambos con licencia MIT). Los reconocemos como trabajo previo.
- El contrato parte del patrón `__check_auth` del ejemplo `account` de [soroban-examples](https://github.com/stellar/soroban-examples).
- El código x402 de `api-demo` se rescató de [caja-tica-escudo](https://github.com/josedanielm0202-droid/caja-tica-escudo) (Milasur, Juliana Sanabria, josedanielm0202-droid).

## Equipo
Según los commits del repo: Josué Valles ([@jxsu404](https://github.com/jxsu404)), José ([@josedanielm0202-droid](https://github.com/josedanielm0202-droid)), Raúl Altamirano ([@Milasur](https://github.com/Milasur)) y Jayden. Falta que Josué confirme la lista completa.

<!-- enlaces:auto -->
## Enlaces

- ⬆️ Arriba: [Mapa (hub)](docs/MAPA.md) · [Índice de docs](docs/INDICE.md)
- 📖 Fuente de verdad: [PLAN-OPUS — la biblia](docs/PLAN-OPUS.md)
- Relacionado: [AGENTS (raíz)](AGENTS.md) · [Cómo contribuir](CONTRIBUTING.md) · [Tareas](TAREAS.md) · [Índice de docs](docs/INDICE.md) · [Pitch](docs/PITCH.md) · [Demo (testnet)](docs/DEMO.md)
- Lo enlazan: [Mapa (hub)](docs/MAPA.md) · [Pitch](docs/PITCH.md)
- Tags: #quickchain #docs
<!-- /enlaces:auto -->
