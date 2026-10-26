# Deploy de api-demo (vendedor x402)

El vendedor [`api-demo/servidor/vendedor.ts`](../api-demo/servidor/vendedor.ts) (fila Q3 de [PLAN-OPUS](PLAN-OPUS.md)) es un servidor `node:http` que queda escuchando en `PORT`. El plan solo pone en Vercel la **web**. Para este servidor, lo más simple es un servicio web de Node que quede corriendo, sin reescribir nada para funciones serverless. Por eso se usa **Render**, con [`render.yaml`](../render.yaml), y queda [`Dockerfile.api-demo`](../Dockerfile.api-demo) como alternativa (Railway, Fly u otro host con Docker).

## Por qué no Vercel
En Vercel habría que convertir cada ruta en una función (`api/*.ts`) y adaptar el facilitador propio. Eso cambia código de Q3 cerca del freeze. Con Render, el código corre tal cual (`pnpm --filter api-demo vendedor`).

## Pasos (los hace quien tenga la cuenta de Render del equipo)
1. Render → **New → Blueprint** → elegir el repo `jxsu404/quickchain` y la rama `main`. Render lee `render.yaml`.
2. Llenar la variable **`X402_PAY_TO`** con la `G…` del vendedor; esta dirección es pública. Las demás ya vienen en el blueprint: `X402_FACILITATOR_URL=https://x402.org/facilitator`, `STELLAR_RPC_URL` de testnet y Node 22. Render pone `PORT` solo.
3. Deploy. Prueba: `curl -i https://<servicio>.onrender.com/tipo-cambio` tiene que dar **402** con el header `payment-required`.
4. Para la demo, el agente usa `API_DEMO_URL=https://<servicio>.onrender.com`.

**No poner `FACILITADOR_SECRET_KEY` en el host.** En `main`, las rutas `/facilitador/*` no tienen auth y pagan fees con esa llave. Sin la llave, responden 500, que es lo correcto: la demo usa el facilitador público. Además, desde #29 las rutas del facilitador propio solo existen con `FACILITADOR_PROPIO=1` y solo responden por loopback (misma máquina); en Render no se pone `FACILITADOR_PROPIO`.

El plan free de Render apaga el servicio cuando no se usa, y la primera llamada tarda unos segundos. Conviene llamarlo una vez antes de grabar.

## Servicio en Render
URL pública: **https://quickchain-api-demo.onrender.com** (servicio `quickchain-api-demo`, plan free, rama `main`). Para la demo: `API_DEMO_URL=https://quickchain-api-demo.onrender.com`.

## Prueba local (2026-10-26 06:27 CR)
`PORT=4321 X402_PAY_TO=GA6HM4CL… pnpm --filter api-demo vendedor` → `GET /tipo-cambio` respondió `HTTP/1.1 402 Payment Required` con `payment-required` (`scheme: exact`, `network: stellar:testnet`, `amount: 100000`, asset USDC `CBIELTK6…`, `areFeesSponsored: true`). Sin `FACILITADOR_SECRET_KEY`, `GET /facilitador/supported` dio 500.

<!-- enlaces:auto -->
## Enlaces

- ⬆️ Arriba: [Mapa (hub)](MAPA.md) · [Índice de docs](INDICE.md)
- 📖 Fuente de verdad: [PLAN-OPUS — la biblia](PLAN-OPUS.md)
- Relacionado: [api-demo](../api-demo/AGENTS.md) · [Demo (testnet)](DEMO.md) · [Seguridad](SEGURIDAD.md) · [Decisiones](DECISIONES.md)
- Tags: #quickchain #docs #q3
<!-- /enlaces:auto -->
