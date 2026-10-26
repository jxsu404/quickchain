# web — contexto para agentes

Next.js (App Router, TS) desplegado en Vercel (root directory `web`).
- Login: Cavos `@cavos/kit` (`CavosProvider` en `app/providers.tsx`, `useCavos()` en páginas). Correo, sin frase semilla, Stellar testnet.
- `app/page.tsx`: entrar/salir y ver la cuenta G….
- `app/presupuesto/page.tsx`: formulario de tope. TODO: firmar `approve` + `crear_presupuesto` con la wallet Cavos.
- Variable: `NEXT_PUBLIC_CAVOS_APP_ID` (crear app en el dashboard de Cavos y registrar las URLs de callback).
- No se rescató la web vieja (Vite + Freighter, sin Cavos): se escribió nueva.
Correr: `pnpm dev:web`.

<!-- enlaces:auto -->
## Enlaces

- ⬆️ Arriba: [Mapa (hub)](../docs/MAPA.md) · [Índice de docs](../docs/INDICE.md)
- 📖 Fuente de verdad: [PLAN-OPUS — la biblia](../docs/PLAN-OPUS.md)
- Relacionado: [contracts/budget](../contracts/budget/AGENTS.md) · [api-demo](../api-demo/AGENTS.md) · [Demo (testnet)](../docs/DEMO.md)
- Issue: [#4](https://github.com/jxsu404/quickchain/issues/4)
- Lo enlazan: [AGENTS (raíz)](../AGENTS.md) · [Tareas](../TAREAS.md) · [Arquitectura](../docs/ARQUITECTURA.md) · [Demo (testnet)](../docs/DEMO.md) · [Mapa (hub)](../docs/MAPA.md) · [PLAN-OPUS — la biblia](../docs/PLAN-OPUS.md)
- Tags: #quickchain #paquete
<!-- /enlaces:auto -->
