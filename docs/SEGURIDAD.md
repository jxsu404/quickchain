# Seguridad — modelo de amenazas

| Amenaza | Mitigación | Estado |
|---|---|---|
| Agente comprometido gasta todo | `__check_auth` de la cuenta-presupuesto: tope del periodo (con comisión), máximo por llamada, fin de periodo, pausa y rotación de llave | hecho (Q1: t01–t03, t06, t07, t12–t15; testnet [pruebas-q1](pruebas-q1.md) 03, 07c–07e) |
| El agente intenta otra operación con la cuenta | `__check_auth` solo acepta `token.transfer(C, to≠C, monto)`; lo demás da `OperacionNoPermitida` | hecho (t05, t13; varias transferencias en una auth se suman) |
| Otra llave se hace pasar por el agente | `__check_auth` exige exactamente 1 firma ed25519 de la llave `agente` | hecho (t04, t16; testnet 04, 06b) |
| El agente cambia su propio tope o saca fondos | `renovar`, `pausar`, `cambiar_agente` y `retirar` exigen `owner.require_auth()`; `__check_auth` rechaza llamadas a la propia cuenta | hecho (t05, t08; testnet 09a/09b) |
| Gasto después de fin de mes | `PeriodoVencido` (en `ahora ≥ fin_periodo`) | hecho (t06, t14) |
| Desbordamiento de enteros | `checked_*` (contadores y comisión) + `overflow-checks = true` (Cargo.toml:7) | hecho (t15) |
| Allowance mayor que el tope | ya no aplica: no hay `approve`/`transfer_from`; el USDC vive en `C` y `approve` desde `C` da `OperacionNoPermitida` | no aplica (t05) |
| API cobra sin entregar | `api-demo` prepara la respuesta antes de liquidar | hecho (heredado) |
| Prompt injection o un 402 que pide un monto enorme | `max_por_llamada` en cadena; en el SDK, `maxPorLlamada` local (los hosts, en la fila siguiente) | hecho (Q2/Q7: `/caro` de US$1 bloqueado con `MontoPorLlamada`, ver [transacciones](transacciones.md)). Límite: un vendedor o facilitador aceptado (host en `hostsPermitidos`) puede cobrar hasta `max_por_llamada` por llamada sin entregar |
| Prompt injection lleva al agente a pagarle a cualquier host | `hostsPermitidos` obligatorio y no vacío en el SDK desde #29 (antes era opcional); se compara contra la URL **final** (después de redirects) y el pago firmado va con `redirect: "manual"` | hecho (tests de `agent-client`, 2026-10-26) |
| Agente en loop | tope del periodo en cadena + `maxLlamadasPorMinuto` en el SDK, implementado en #29 (por defecto 10, error `LimitePorMinuto` antes de firmar) | hecho (tests de `agent-client`, 2026-10-26) |
| El 402 pide una firma que viva mucho (`maxTimeoutSeconds`) | el SDK la acota a 300 s | hecho (2026-10-26) |
| Repetir o modificar la auth entry | nonce y vencimiento de Soroban; la firma queda ligada a `transfer(C, payTo, monto)` | hecho (propio de Soroban) |
| Facilitador malicioso | solo puede enviar la transferencia exacta que firmó el agente | aceptado: un facilitador o vendedor aceptado puede cobrar hasta `max_por_llamada` por llamada sin entregar (riesgo de x402; el tope del periodo y el límite por minuto acotan el total) |
| Cualquiera usa el facilitador propio y gasta su XLM | apagado por defecto; con `FACILITADOR_PROPIO=1` solo atiende IP loopback con `Host` local y sin cabeceras de proxy. La demo usa el facilitador público | hecho (tests de `api-demo`, 2026-10-26) |
| Nosotros (el operador) | sin admin ni `upgrade`; la comisión va a una tesorería fija del constructor | hecho. Si se pierde la llave de la tesorería, solo se pierden comisiones |
| Vence el TTL de la instancia | `renovar` extiende el TTL | hecho; si nadie renueva por meses hay que restaurar |
| El dueño firma `renovar` sobre una cuenta con otra comisión, otro token u otro dueño | la web y `scripts/renovar.mjs` leen `estado()` y no firman si `fee_bps ≠ 100`, el token no es el USDC de Circle, el dueño no coincide o la tesorería no es la esperada | hecho (2026-10-26) |
| El SDK no valida `asset` ni `payTo` del 402 | el contrato solo deja transferir su token, hasta el máximo por llamada | pendiente |
| Pago falso con `X-QUICKCHAIN-TX` | ya no aplica: Q2 quitó ese header; el pago es x402 `exact` liquidado por el facilitador | no aplica |
| Filtración de llaves | `.gitignore` cubre `.env*`; `.env.example` solo nombres; `gitleaks git` sobre todo el historial sin hallazgos (`.gitleaks.toml` permite llaves públicas hex) | hecho (Q0: job de CI con gitleaks y grep de semillas Stellar en cada PR) |
| Auth entry firmada en un periodo y usada en otro | cuenta contra el periodo en que se ejecuta (los contadores se leen al ejecutar); vence por `signatureExpirationLedger` | aceptado |
| Pago a dirección *muxed* (`M…`) | `to` no convierte a `Address` → `OperacionNoPermitida` | limitación conocida |
| Firma ed25519 inválida | `ed25519_verify` aborta la ejecución (error de host, no `FirmaInvalida=3`); igual no pasa | hecho (t04) |
| Clickjacking / sniffing de MIME en la web | `X-Frame-Options: SAMEORIGIN`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`; CSP en Report-Only ([2026-10-26](2026-10-26-headers-seguridad.md)) | hecho (CSP que bloquea: pendiente) |
| Mensajes que suenen a inversión | reglas en AGENTS.md y CONTRIBUTING.md | hecho |

Riesgos aceptados para la demo: solo testnet; un presupuesto por agente; sin auditoría externa del contrato. Legal: no hay custodia nuestra (el USDC está en un contrato que solo controla el dueño); hay que confirmar con un abogado si cobrar 1 % nos hace VASP o proveedor de pagos según la normativa costarricense que aplique (el plan menciona la Ley 10.961 y a SUGEF; falta confirmar la cita con una fuente). Tabla base: [PLAN-OPUS §3](PLAN-OPUS.md). Pendiente para dar Q9 por lista: **revisión de otra persona**.

<!-- enlaces:auto -->
## Enlaces

- ⬆️ Arriba: [Mapa (hub)](MAPA.md) · [Índice de docs](INDICE.md)
- 📖 Fuente de verdad: [PLAN-OPUS — la biblia](PLAN-OPUS.md)
- Relacionado: [Pruebas Q1](pruebas-q1.md) · [Arquitectura](ARQUITECTURA.md) · [Auditoría](AUDITORIA.md) · [contracts/cuenta-presupuesto](../contracts/cuenta-presupuesto/AGENTS.md)
- Lo enlazan: [Headers de seguridad](2026-10-26-headers-seguridad.md) · [Cómo contribuir](../CONTRIBUTING.md) · [contracts/cuenta-presupuesto](../contracts/cuenta-presupuesto/AGENTS.md) · [Arquitectura](ARQUITECTURA.md) · [Auditoría](AUDITORIA.md) · [Índice de docs](INDICE.md) · [Mapa (hub)](MAPA.md) · [PLAN-OPUS — la biblia](PLAN-OPUS.md)
- Tags: #quickchain #docs
<!-- /enlaces:auto -->
