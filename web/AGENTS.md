# web — contexto para agentes

Next.js (App Router, TS) desplegado en Vercel (root directory `web`).
- Login: Cavos `@cavos/kit` (`CavosProvider` en `app/providers.tsx`, `useCavos()` en páginas). Correo, sin frase semilla, Stellar testnet.
- `app/page.tsx`: entrar/salir y ver la cuenta G….
- `app/presupuesto/page.tsx` (Q4): el dueño firma `renovar(tope: i128, max_por_llamada: i128, fin_periodo: u64, recarga: i128)` con `wallet.invokeContract({ contractId, method: "renovar", args })`. Pasos: (1) si la cuenta está `undeployed`, «Crear mi cuenta» hace un `execute` de 1 stroop a sí misma: Cavos crea la cuenta (patrocinada) y la deja `ready` aunque ese pago falle por saldo 0; (2) «Revisar cuenta» lee `estado()` y bloquea la firma si el dueño no es la `G…` de Cavos, si `fee_bps ≠ 100`, si el token no es el USDC de Circle o si la tesorería no es `NEXT_PUBLIC_QUICKCHAIN_TESORERIA` (cuando está definida); (3) simula `renovar` con el dueño como fuente y después pide **una** firma; (4) muestra el hash con link a Stellar Expert. Opcional: trustline USDC (`addTrustline`) para recargar, y «mi cuenta paga el fee» (`{ fee: "self" }`).
- `lib/renovar.ts`: argumentos tipados con `nativeToScVal` (`i128`, `i128`, `u64`, `i128`; sin tipo, Cavos los convierte a `u64` y el contrato los rechaza), fin de mes en hora CR, validación igual a la del contrato, `leerEstado`, `simularRenovar` y traducción de errores (el `#10` del SAC de USDC es saldo, no `ParametrosInvalidos`).
- **Requisito:** el `owner` de la cuenta-presupuesto tiene que ser la `G…` de Cavos del dueño. Hoy se despliega por CLI (`OWNER_ADDRESS=G… bash scripts/deploy-cuenta.sh`); la instancia de referencia `CBH3LQQC…` tiene otro dueño y la web no deja firmar.
- Plan B sin Cavos: `pnpm renovar` (`scripts/renovar.mjs`), ver [Demo](../docs/DEMO.md).
- Variables: `NEXT_PUBLIC_CAVOS_APP_ID` (crear app en el dashboard de Cavos y registrar las URLs de callback), `NEXT_PUBLIC_BUDGET_CONTRACT_ID` (la `C…` que precarga el formulario), `NEXT_PUBLIC_STELLAR_RPC_URL` y `NEXT_PUBLIC_QUICKCHAIN_TESORERIA` (opcionales).
- No se rescató la web vieja (Vite + Freighter, sin Cavos): se escribió nueva.
Correr: `pnpm dev:web`. Tests sin red: `pnpm --filter web test`.

<!-- enlaces:auto -->
## Enlaces

- ⬆️ Arriba: [Mapa (hub)](../docs/MAPA.md) · [Índice de docs](../docs/INDICE.md)
- 📖 Fuente de verdad: [PLAN-OPUS — la biblia](../docs/PLAN-OPUS.md)
- Relacionado: [contracts/cuenta-presupuesto](../contracts/cuenta-presupuesto/AGENTS.md) · [api-demo](../api-demo/AGENTS.md) · [Demo (testnet)](../docs/DEMO.md)
- Issue: [#4](https://github.com/jxsu404/stellar-quickpass/issues/4)
- Lo enlazan: [AGENTS (raíz)](../AGENTS.md) · [Tareas](../TAREAS.md) · [Arquitectura](../docs/ARQUITECTURA.md) · [Demo (testnet)](../docs/DEMO.md) · [Mapa (hub)](../docs/MAPA.md) · [PLAN-OPUS — la biblia](../docs/PLAN-OPUS.md)
- Tags: #quickchain #paquete
<!-- /enlaces:auto -->
