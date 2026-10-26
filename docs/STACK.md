# Stack
| Pieza | Tecnología | Por qué |
|---|---|---|
| Monorepo | pnpm workspaces (`web`, `api-demo`, `agent-client`) + Cargo workspace (`contracts/budget`) | un solo repo, un comando |
| Contrato | Rust + `soroban-sdk` 22 | tope y bloqueo en cadena |
| Login | Cavos `@cavos/kit` (Stellar testnet) | correo, sin frase semilla ([docs](https://docs.cavos.xyz/docs/quickstart)) |
| Web y API | Next.js (App Router, TS) en Vercel | como en hackathons anteriores |
| Pagos por uso | `@x402/core` + `@x402/stellar` (esquema `exact`) | estándar x402 en Stellar ([docs](https://developers.stellar.org/docs/build/agentic-payments/x402/built-on-stellar)) |
| Cliente | `@stellar/stellar-sdk` (RPC Soroban) | llamar al contrato |
| Base de datos | ninguna por ahora (Neon Postgres solo si de verdad hace falta) | el estado está en el contrato |

Versiones verificadas: rustc 1.99 (rustup) compila el wasm; con rustc 1.85 del sistema, `Cargo.lock` fija `ed25519-dalek` 2.2.0.

<!-- enlaces:auto -->
## Enlaces

- ⬆️ Arriba: [Mapa (hub)](MAPA.md) · [Índice de docs](INDICE.md)
- 📖 Fuente de verdad: [PLAN-OPUS — la biblia](PLAN-OPUS.md)
- Relacionado: [Arquitectura](ARQUITECTURA.md) · [Decisiones](DECISIONES.md)
- Lo enlazan: [Arquitectura](ARQUITECTURA.md) · [Decisiones](DECISIONES.md) · [Índice de docs](INDICE.md) · [Mapa (hub)](MAPA.md)
- Tags: #quickchain #docs
<!-- /enlaces:auto -->
