# 2026-10-26 — Headers de seguridad en la web

## Qué
`web/next.config.ts` agrega, para todas las rutas (`/:path*`):
- `X-Frame-Options: SAMEORIGIN` (nuestra app no necesita ser enmarcada por otros sitios; los iframes de Cavos los enmarcamos nosotros, no al revés).
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()`
- `Content-Security-Policy-Report-Only` permisiva (scripts/frames/fetch a `https:`, `wss:`): **solo reporta, no bloquea**, para no romper el login de Cavos ni las llamadas a Soroban RPC / Horizon / facilitador x402.

## Por qué
Endurecer la web sin riesgo antes del congelamiento (2:30 p. m. CR). Una CSP que bloquee queda para después de revisar los reportes de la consola.

## Enlaces
- ⬆️ [Índice de docs](INDICE.md) · [Seguridad](SEGURIDAD.md) · [Decisiones](DECISIONES.md)
