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
| Prompt injection o un 402 que pide un monto enorme | `max_por_llamada` en cadena; en el SDK, `maxPorLlamada` local y `hostsPermitidos` | hecho (Q2/Q7: `/caro` de US$1 bloqueado con `MontoPorLlamada`, ver [transacciones](transacciones.md)). Límite: un vendedor permitido puede cobrar caro dentro del máximo |
| Agente en loop | tope por periodo | hecho (5.º pago bloqueado con `TopeAlcanzado`). Límite de llamadas por minuto en el SDK: pendiente |
| Repetir o modificar la auth entry | nonce y vencimiento de Soroban; la firma queda ligada a `transfer(C, payTo, monto)` | hecho (propio de Soroban) |
| Facilitador malicioso | solo puede enviar la transferencia exacta que firmó el agente | aceptado: puede cobrar y que el vendedor no entregue (riesgo de x402, acotado por llamada) |
| Nosotros (el operador) | sin admin ni `upgrade`; la comisión va a una tesorería fija del constructor | hecho. Si se pierde la llave de la tesorería, solo se pierden comisiones |
| Vence el TTL de la instancia | `renovar` extiende el TTL | hecho; si nadie renueva por meses hay que restaurar |
| Pago falso con `X-QUICKCHAIN-TX` | ya no aplica: Q2 quitó ese header; el pago es x402 `exact` liquidado por el facilitador | no aplica |
| Filtración de llaves | `.gitignore` cubre `.env*`; `.env.example` solo nombres; `gitleaks git` sobre todo el historial sin hallazgos (`.gitleaks.toml` permite llaves públicas hex) | hecho (Q0: job de CI con gitleaks y grep de semillas Stellar en cada PR) |
| Auth entry firmada en un periodo y usada en otro | cuenta contra el periodo en que se ejecuta (los contadores se leen al ejecutar); vence por `signatureExpirationLedger` | aceptado |
| Pago a dirección *muxed* (`M…`) | `to` no convierte a `Address` → `OperacionNoPermitida` | limitación conocida |
| Firma ed25519 inválida | `ed25519_verify` aborta la ejecución (error de host, no `FirmaInvalida=3`); igual no pasa | hecho (t04) |
| Mensajes que suenen a inversión | reglas en AGENTS.md y CONTRIBUTING.md | hecho |

Riesgos aceptados para la demo: solo testnet; un presupuesto por agente; sin auditoría externa del contrato. Legal: no hay custodia nuestra (el USDC está en un contrato que solo controla el dueño); hay que confirmar con un abogado si cobrar 1 % nos hace VASP o proveedor de pagos (Ley 10.961, SUGEF). Tabla base: [PLAN-OPUS §3](PLAN-OPUS.md). Pendiente para dar Q9 por lista: **revisión de otra persona**.

<!-- enlaces:auto -->
## Enlaces

- ⬆️ Arriba: [Mapa (hub)](MAPA.md) · [Índice de docs](INDICE.md)
- 📖 Fuente de verdad: [PLAN-OPUS — la biblia](PLAN-OPUS.md)
- Relacionado: [Pruebas Q1](pruebas-q1.md) · [Arquitectura](ARQUITECTURA.md) · [Auditoría](AUDITORIA.md) · [contracts/cuenta-presupuesto](../contracts/cuenta-presupuesto/AGENTS.md)
- Lo enlazan: [Cómo contribuir](../CONTRIBUTING.md) · [contracts/cuenta-presupuesto](../contracts/cuenta-presupuesto/AGENTS.md) · [Arquitectura](ARQUITECTURA.md) · [Auditoría](AUDITORIA.md) · [Índice de docs](INDICE.md) · [Mapa (hub)](MAPA.md) · [PLAN-OPUS — la biblia](PLAN-OPUS.md)
- Tags: #quickchain #docs
<!-- /enlaces:auto -->
