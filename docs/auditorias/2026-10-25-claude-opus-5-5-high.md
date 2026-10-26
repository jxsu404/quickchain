# Auditoría independiente de QuickChain — Claude Opus 5.5 (high)

**Fecha:** domingo 25 oct 2026, 11:30 p. m. (CR). **Entrega:** lunes 26 oct, 11:30 a. m. (CR). Quedan unas 12 horas.
**Fuente de verdad:** [docs/PLAN-OPUS.md](../PLAN-OPUS.md) (Q0–Q15).
**Alcance:** leí `AGENTS.md`, todo `docs/`, `TAREAS.md`, `README.md`, CI, scripts y todo el código de `contracts/cuenta-presupuesto`, `agent-client`, `api-demo` y `web`. Solo creé este archivo; no modifiqué nada más, no hice commits ni corrí instalaciones.

## Resumen

- **El núcleo funciona y tiene evidencia:** el contrato `cuenta-presupuesto`, el SDK del agente, el vendedor x402 y el cobro de la comisión están hechos. El repo trae hashes de testnet de pagos x402 **desde la `C…`** con el facilitador propio y con el **público**, el 5.º pago bloqueado por `TopeAlcanzado` y `/caro` bloqueado por `MontoPorLlamada` ([transacciones.md](../transacciones.md), [COSTOS.md](../COSTOS.md), [pruebas-q1.md](../pruebas-q1.md)).
- **Lo que falta para la demo es la web:** Q4 (firmar `renovar` con Cavos), Q5 (despliegue) y Q6 (panel) prácticamente no empezaron. `web/app/presupuesto/page.tsx` todavía apunta al diseño viejo (`approve` + `crear_presupuesto`) y tiene el botón deshabilitado. El plan B de Cavos (Freighter) **no existe en este repo**.
- **Contrato:** no encontré bugs críticos ni altos. Hay dos riesgos medios: `renovar` se cae si la tesorería no puede recibir USDC, y los parámetros del constructor (comisión y tesorería) los elige quien despliega, sin firma del dueño.
- **SDK:** sin bugs críticos. El riesgo medio es que la ventana de validez de la firma del agente la decide el vendedor (`maxTimeoutSeconds`).
- **Recomendación de plan:** congelar el contrato tal cual (hay evidencia en testnet con el wasm `7190eb76…`), dar por resuelto el punto de decisión de las 11:30 p. m. (el modo A funciona; el modo B no hace falta) y concentrar la noche en un Q4 mínimo con corte a la 1:30 a. m. El plan B pasa a ser `renovar` firmado por script, no Freighter.

### Límites de esta auditoría (importante)

- **No pude correr comandos:** la terminal y las consultas web fueron rechazadas en esta sesión. No corrí `cargo test`, `pnpm typecheck`, `pnpm --filter agent-client test` ni `git log`, y **no verifiqué en Horizon ni en Stellar Expert** los hashes que citan los docs. El estado "hecho" de abajo significa que el código está y es coherente con la evidencia que registra el repo, no que yo haya visto la tx en cadena.
- Revisé el árbol de trabajo actual (HEAD sin rama). Si hay trabajo en ramas `rol/*` sin fusionar (por ejemplo, un spike de Cavos), no está contemplado aquí.

Severidades: **Crítica** (pérdida de fondos o bypass del tope), **Alta** (rompe la promesa del producto o la demo sin plan B), **Media** (explotable con condiciones o rompe un flujo importante), **Baja** (endurecimiento), **Info** (aceptado o documentado).

---

## 1. Bugs y riesgos de seguridad

### 1.1 Contrato `contracts/cuenta-presupuesto/src/lib.rs`

Lo que está bien, para no repetirlo en cada fila: aritmética con `checked_*` y `overflow-checks = true` (`Cargo.toml:7`); `__check_auth` revisa **todos** los contextos (incluidas subinvocaciones) y solo acepta `token.transfer(C, to ≠ C, 0 < monto ≤ máx)` (`lib.rs:328-365`); exactamente una firma de la llave registrada (`lib.rs:314-321`); la comisión entra en el tope (`lib.rs:351-359`); todas las funciones del dueño exigen `owner.require_auth()`; sin `upgrade` ni admin; `__check_auth` no emite eventos. Los 17 tests (`test.rs`) cubren los 11 de PLAN-OPUS §2.3 y casos borde (overflow, tope exacto, varias transferencias en una auth).

| ID | Sev. | Dónde | Hallazgo | Sugerencia |
|---|---|---|---|---|
| C1 | **Media** | `lib.rs:199` → `lib.rs:138-152` | **`renovar` depende de que la tesorería pueda recibir USDC.** `renovar` llama a `cobrar_pendiente`, que hace `USDC.transfer(C → tesorería)`. Si `comision_pendiente > 0` y la tesorería `G…` no tiene trustline de USDC (o no existe, o el emisor la congela), la transferencia falla y **revierte todo `renovar`**. El dueño no puede renovar el mes y no tiene forma de destrabarlo, porque `retirar` no toca la comisión. En la demo pasa si se usa una `QUICKCHAIN_TESORERIA` nueva sin trustline. | **Antes de la entrega (operativo):** confirmar que la tesorería de la instancia de la demo tiene trustline de USDC. **Después (contrato):** sacar `cobrar_pendiente` de `renovar` (la comisión queda protegida igual por `retirar`, `lib.rs:253`) o usar `try_transfer` y seguir si falla. |
| C2 | **Media** | `lib.rs:156-170` (validación solo en `lib.rs:164`) | **El constructor no exige la firma del dueño** y acepta `fee_bps` hasta 10 000 (100 %), cualquier `tesoreria` y cualquier `token`. Con Q5 (el servidor despliega la cuenta de cada dueño), el operador o un atacante que controle el despliegue puede crear una `C…` con 100 % de comisión hacia su propia tesorería. El dueño después deposita con `renovar` sin que el contrato confirme qué está aceptando. | **Web (sin tocar el contrato):** antes de pedir la firma de `renovar`, leer `estado()` y verificar `fee_bps == 100`, `tesoreria` oficial y `token == CBIELTK6…`, y mostrárselo al dueño. **Contrato (roadmap):** tope de `fee_bps` (por ejemplo, ≤ 100) o un parámetro `fee_bps_esperado` en `renovar`. |
| C3 | Baja | `lib.rs:199-206`, `lib.rs:351-365` | La comisión no siempre tiene saldo detrás. `__check_auth` no mira el saldo: si `recarga < tope`, el agente puede gastar todo el saldo y la comisión queda pendiente sin fondos. Además, `renovar` cobra **antes** de depositar la recarga, así que tampoco se cobra en ese momento. No hay pérdida para el dueño; la tesorería cobra más tarde con `cobrar_comision`. | En `renovar`, mover `cobrar_pendiente` después de la recarga (si se mantiene ahí; ver C1). |
| C4 | Baja | `lib.rs:214` | `renovar` a mitad del periodo reinicia `gastado = 0`. Una segunda firma del dueño en el mismo mes le da al agente un tope nuevo completo. Es decisión del dueño, pero contradice "una firma al mes". | En la web, avisar si `fin_periodo` todavía no venció ("esto reinicia lo gastado"). |
| C5 | Baja | `lib.rs:282` | `estado().restante` no considera el saldo. El panel o el agente pueden mostrar "restante 0,05" con saldo 0, y el pago falla por saldo (lo traduce `errores.ts:36`). | En el panel o el SDK, mostrar `disponible = min(restante, saldo − comision_pendiente)`. Sin cambiar el contrato. |
| C6 | Baja | `lib.rs:121-127`, `lib.rs:177`, `lib.rs:216` | El TTL de la instancia solo se extiende en el constructor y en `renovar` (64 días). Si el dueño no renueva en ese plazo, la instancia se archiva y hay que restaurarla. Ya está aceptado en PLAN-OPUS §3. | Nada antes de la entrega. |
| C7 | Info | `lib.rs:342` | Si se filtra la llave del agente, se puede pagar a **cualquier** `payTo` hasta el tope, en pagos de hasta `max_por_llamada`. Es el límite honesto del plan (§3, fila 1). | Stretch del plan: lista de `payees` en cadena. Decirlo en el pitch si preguntan. |
| C8 | Info | `lib.rs:321`, `lib.rs:337-339` | Una firma ed25519 inválida aborta en el host en vez de devolver `FirmaInvalida=3`. Un `to` muxed (`M…`) se rechaza. Sin `upgrade`: cualquier corrección requiere desplegar una cuenta nueva por dueño. Todo esto está documentado. | — |

### 1.2 SDK del agente `agent-client/src/`

Lo que está bien: la firma usa `authorizeEntry` con `Keypair`, compatible con `FirmaAgente`. Hay doble simulación (`sdk.ts:47-50`), así que los bloqueos del contrato salen **sin tx**. La llave se lee del entorno y no se loguea. Los límites locales (`hostsPermitidos` y `maxPorLlamada`) se revisan **antes** de firmar.

| ID | Sev. | Dónde | Hallazgo | Sugerencia |
|---|---|---|---|---|
| S1 | **Media** | `sdk.ts:35` | **El vendedor decide cuánto vale la firma del agente.** `maxLedger = último + ceil(maxTimeoutSeconds / 5)`, y `maxTimeoutSeconds` viene del 402 sin límite. Un vendedor malicioso puede pedir un timeout enorme, guardar la auth entry firmada, responder con error para que el agente reintente (y pague otra vez) y liquidar la primera más tarde, incluso en el periodo siguiente. Cada cobro queda acotado por `max_por_llamada` y el tope, pero es un cobro doble silencioso. | Una línea: `Math.min(req.maxTimeoutSeconds ?? 60, 300)`. |
| S2 | Baja | `sdk.ts:70`, `sdk.ts:72`, `sdk.ts:84` | `hostsPermitidos` se compara contra la URL **original**, pero `fetch` sigue redirecciones. Un host permitido que redirige a otro puede devolver el 402 y recibir el `PAYMENT-SIGNATURE`. | Usar `redirect: "manual"` o comparar `r1.url`. |
| S3 | Baja | `sdk.ts:38-40`, `sdk.ts:76-78` | No se valida `asset` (que sea el SAC de USDC), `payTo` ni que `amount` sea un entero. El contrato rechaza otro token (`OperacionNoPermitida`), pero el SDK igual simula contra un contrato arbitrario, y `BigInt()` revienta con un monto mal formado. | Filtrar `a.asset === USDC_SAC` y validar `amount` con `/^\d+$/`. |
| S4 | Baja | `sdk.ts:20-23`, `demo.ts:11-15` | Los límites locales están apagados por defecto (`hostsPermitidos` vacío significa cualquier host; sin `maxPorLlamada`). El "límite de llamadas por minuto en el SDK" que PLAN-OPUS §3 (línea 157) da como mitigación **no está implementado**. | Implementarlo (unos 15 minutos) o sacarlo de la tabla de mitigaciones del plan y de SEGURIDAD. |
| S5 | Baja | `errores.ts:31-36` | La heurística de la segunda rama puede mapear un error del SAC (`#10`, saldo) a `ParametrosInvalidos`, porque la revisión de "balance is not sufficient" va después. | Revisar el saldo primero. |
| S6 | Baja | `sdk.ts:84-94` | El reintento reutiliza `init` (un `body` de tipo stream no se puede reenviar). Si la respuesta `r2` se pierde por la red después de liquidar, el llamador no sabe que pagó y puede volver a pagar. | Documentarlo. Para la demo solo se usan GET, así que no afecta. |
| S7 | Info | `sdk.ts:39`, `sdk.ts:47`, `sdk.ts:103-104` | `Networks.TESTNET` está fijo aunque `rpcUrl` es configurable. Con otro RPC, la firma falla (no se pierde plata). | Aceptable mientras sea solo testnet. |
| S8 | Baja (proceso) | `.github/workflows/ci.yml:26-41` | El CI no corre `pnpm --filter agent-client test`, y `armarPagoDesdeCuenta` no tiene test sin red. `AGENTS.md` da a entender que el CI corre "esos tests". | Agregar el paso al job `typescript`. |

### 1.3 Otros componentes que afectan la demo

| ID | Sev. | Dónde | Hallazgo | Sugerencia |
|---|---|---|---|---|
| O1 | **Media** (si se publica) | `api-demo/lib/facilitador.ts:15`, `:24-34` | `/facilitador/verify` y `/facilitador/settle` están abiertos, sin auth y sin restringir `payTo`, con un techo de fee por defecto de 5.000.000 stroops. El `max_fee` medido es de unos 17.000 ([COSTOS.md](../COSTOS.md)). Si se despliega en Vercel, cualquiera puede gastar el XLM de `FACILITADOR_SECRET_KEY` y tumbar la demo. | No publicar el facilitador propio: usar el público, que según la evidencia acepta la `C…` (`d0e333b2…`). Si se publica, bajar el techo (por ejemplo, a 100.000) y aceptar solo `payTo == X402_PAY_TO`. |
| O2 | **Media** (demo) | `agent-client/src/demo.ts:2`, `README.md:30` | El README manda a crear `.env` en la **raíz**, pero `pnpm agente` corre con cwd `agent-client/`, y `dotenv/config` lee `agent-client/.env`. Lo mismo pasa con Next (`api-demo/.env`, `web/.env`). Si no se exportan las variables, el día de la grabación sale "Faltan variables". | Verificarlo en el ensayo; si hace falta, usar `config({ path: "../.env" })` o `--env-file`. |
| O3 | **Media** (demo) | `deployments/testnet.json:8`, `:11`, `:17`; `docs/DEMO.md:14` | La instancia "de la demo" (`CBH3LQQC…`) tiene recarga 0 (sin USDC) y **dueño = tesorería = deployer**, así que la comisión vuelve al mismo dueño. Tal como está, no sirve para grabar. | Desplegar una instancia nueva para Q10 con el dueño de la demo y una tesorería distinta con trustline (ver C1). |
| O4 | Baja | `scripts/deploy-cuenta.sh:15`, `:19`; `api-demo/scripts/cuenta-demo.mts:29` | La semilla pasa por `argv` de `node` (visible en `ps`). La tesorería por defecto es el deployer o el dueño. `stellar contract upload … 2>/dev/null` (`:32`) oculta el motivo si falla. | Pasar la semilla por variable de entorno; exigir `QUICKCHAIN_TESORERIA` explícita. |
| O5 | Baja | `web/app/providers.tsx:8` | `appId: process.env.NEXT_PUBLIC_CAVOS_APP_ID!` no tiene guardia. Si falta en Vercel, el login falla sin un mensaje claro. | Mostrar un error visible si falta la variable. |
| O6 | Baja | `api-demo/lib/facilitador.ts:32` | Devuelve `e.message` crudo al cliente. | Mensaje genérico y log en el servidor. |

**Secretos:** no encontré llaves en archivos versionados. `.gitignore` cubre `.env*`; los scripts escriben las semillas solo en archivos fuera del repo (`QC_SECRETS_FILE`, `AGENTE_ARCHIVO`, con chmod 600) o en `.env`. El CI tiene gitleaks sobre todo el historial y un grep de semillas `S…`. No pude correr gitleaks para confirmarlo.

---

## 2. Estado de las fases Q0–Q15 (verificado contra el código)

| Fase | Estado | Evidencia en el código | Qué falta |
|---|---|---|---|
| Q0 Base del repo | **Hecho** | `.github/workflows/ci.yml` (tests, wasm, typecheck, `docs:links`, gitleaks y grep de semillas); `.env.example` solo con nombres; `docs/transacciones.md`. Grep de `writz\|bitcoin`: solo aparece en docs y reglas, no en `contracts/`, `web/`, `api-demo/` ni `agent-client/` | No pude ver si el CI está en verde. Docs viejos (ver §3) |
| Q1 Contrato | **Hecho** | `lib.rs` completo según §2.1–2.2; 17 tests en `test.rs`; `scripts/deploy-cuenta.sh`; `deployments/testnet.json`; 18 pasos en testnet en `deployments/pruebas-q1.json` | Riesgos C1–C2 (sugerencias) |
| Q2 SDK | **Hecho** | `agent-client/src/sdk.ts` (`crearFetchConPresupuesto`, `leerEstado`, `armarPagoDesdeCuenta`, doble simulación); `agente-nuevo.ts`; `test/sdk.test.ts` con un 402 simulado; hashes `c0dca2fa…` a `40a58cd5…` | Límite de llamadas por minuto (S4); tests en CI (S8). Vive en `agent-client/`, no en `sdk/` |
| Q3 Vendedor y facilitador | **Hecho** | `api-demo/app/tipo-cambio`, `app/caro`, `app/facilitador/*`, `lib/x402.ts`, `lib/facilitador.ts`; pagos `G…` y `C…` con los dos facilitadores en `transacciones.md` | No hay evidencia de despliegue en Vercel (lo pide `TAREAS.md:14`); O1 |
| Q4 Web con Cavos | **A medias (solo login)** | `web/app/page.tsx` (login y dirección) y `providers.tsx` | Friendbot, trustline, registrar el agente y **firmar `renovar`**. `presupuesto/page.tsx:17-18` sigue con el TODO de `approve` + `crear_presupuesto` y el botón deshabilitado. `:13` pide una `G…` del agente, pero el contrato usa `BytesN<32>` |
| Q5 Despliegue de cuentas | **Sin empezar** | No hay `POST /api/cuentas`. Sustituto por CLI: `deploy-cuenta.sh` (acepta `OWNER_ADDRESS`) y `cuenta-demo.mts` (dueño fijo = `PAGADOR`) | Todo, o usar el recorte del plan (CLI) |
| Q6 Panel | **Sin empezar** | Solo `leerEstado` en el SDK y la línea final de `demo.ts:25-26` | Panel web; `getEvents` del SAC |
| Q7 Agente demo | **A medias** | `agent-client/src/demo.ts`: N llamadas a **una** URL, con links y mensajes "BLOQUEADO (por el contrato, sin tx)" | En una sola corrida, 4 pagos + 5.º bloqueado + `/caro` bloqueado (hoy `/caro` requiere otra corrida con `API_DEMO_URL`); mostrar lo que queda después de cada pago (§6, línea 231) |
| Q8 Comisión y costo | **Hecho** | `cobrar-comision.ts`, `medir-costos.ts`, [COSTOS.md](../COSTOS.md) con hashes | Precio XLM/USD con fuente (pendiente declarado) |
| Q9 Seguridad y docs | **A medias** | `docs/SEGURIDAD.md` está casi al día | `SEGURIDAD.md:13` (fila de `X-QUICKCHAIN-TX`) y `:14` ("sin CI") están viejas; `ARQUITECTURA.md` describe el diseño viejo completo (`:7`, `:19-24`, `:43`) |
| Q10 Evidencia de punta a punta | **A medias** | Evidencia repartida en 4 instancias (`CAUZN55N…`, `CCKZ7XID…`, `CDPWYHPE…`, `CBH3LQQC…`) | Una corrida limpia en **una** instancia: deploy, `renovar`, 4 pagos, bloqueos, cobro, pausa y retiro |
| Q11 README | **A medias** | `README.md` existe | `:21` dice que la comisión "todavía no está implementada" (falso). Faltan los créditos a AgentAllowance y ACAN, "sin auditar", negocio y la tabla de tx |
| Q12 Validación | **Sin evidencia** | Nada en el repo | Respuestas citables o el "no" |
| Q13 Pitch | **A medias (borrador)** | `docs/PITCH.md` de 5 líneas | `PITCH.md:4` usa McKinsey y volúmenes de x402, que PLAN-OPUS §7 (línea 252) deja **fuera del pitch** |
| Q14 Video | Sin empezar | — | Es lo esperado a esta hora (ventana de 8:30 a 10:30 a. m.) |
| Q15 Entrega en APEX | Sin empezar | — | Es lo esperado (ventana de 10:30 a 11:00 a. m.) |

Atraso contra el reloj del plan: según §4, a esta hora Q4 debería llevar 2,5 h (ventana de 9:00 p. m. a 1:30 a. m., con el spike de Cavos en la primera hora) y no hay rastro del spike en el código.

---

## 3. Huecos entre el plan y el código

1. **Las rutas del plan no coinciden con el repo.** PLAN-OPUS §1.1 (líneas 26-33) habla de `sdk/`, `servidor/vendedor.ts`, `servidor/facilitador.ts`, `servidor/cuentas.ts`, `scripts/agente-demo.ts` y `scripts/cobrar-comision.ts`. En el código son `agent-client/src/sdk.ts`, `api-demo/app/*`, `api-demo/lib/facilitador.ts`, (no existe), `agent-client/src/demo.ts` y `agent-client/src/cobrar-comision.ts`. `DECISIONES.md` lo registra, pero el plan no.
2. **El fallback de Cavos no existe.** PLAN-OPUS §1.1 (línea 31) y el punto de decisión de la 1:30 a. m. (línea 196) dicen que `web/src/billetera/freighter.ts` "ya existe". En este repo no hay ningún archivo con Freighter (`web/AGENTS.md` dice que la web vieja no se rescató). El plan B de Q4 está vacío.
3. **El hallazgo 2 del plan quedó desmentido por la evidencia.** PLAN-OPUS línea 8, §9 (línea 286) y §10, pregunta 1 (línea 300) dicen que el facilitador público rechaza a la `C…`. `transacciones.md` registra 4 pagos desde la `C…` con el facilitador **público** (`d0e333b2…` a `947c51f9…`), y COSTOS.md mide unos 11.900 stroops, por debajo del techo de 50.000 que cita el plan. No lo verifiqué en cadena (ver límites).
4. **Mitigaciones del plan que el código no tiene:** el límite de llamadas por minuto en el SDK (§3, línea 157); la web que calcula el fin de mes en hora CR (§5, línea 207); los pagos vía `getEvents` en el panel (Q6); `/caro` dentro del mismo guion del agente (Q7).
5. **TAREAS.md contradice al plan y al código.** `TAREAS.md:14` exige `X-QUICKCHAIN-TX` y `/api/clima`; la decisión vigente es x402 `exact` con `from = C…`. Como TAREAS es la "definición de listo", alguien puede creer que Q3 no está terminado.
6. **Docs viejos que van a confundir al jurado o al equipo:** `README.md:21` (comisión "no implementada"); `docs/DEMO.md:6-7` ("5 pagan, la 6.ª se bloquea"; con tope 0,05 y comisión, el contrato bloquea la **5.ª**, como dice §6 del plan); `docs/DEMO.md:16` ("transacciones vacío hasta Q10", pero ya tiene 26 filas); `docs/PLAN.md:7-10` (7 tests, `approve`); `docs/ARQUITECTURA.md` entero; `web/AGENTS.md:6`; `docs/DECISIONES.md:30` (pregunta abierta sobre `approve`, que ya no aplica); `docs/AUDITORIA.md:73` (hallazgo 1, que ya no aplica).
7. **El pitch rompe la regla del plan.** `docs/PITCH.md:4` usa cifras que §7 (línea 252) excluye. Además, §7 (línea 249) cuenta con "N de M devs", y Q12 no tiene evidencia.
8. **La instancia publicada no sirve para la demo.** `DEMO.md` presenta `CBH3LQQC…` como "el contrato de la demo", pero tiene saldo 0 y dueño = tesorería (O3). Q4 y Q5 dicen "una cuenta por dueño" y no hay ninguna cuenta con dueño Cavos.
9. **CI contra la "definición de listo".** `AGENTS.md` exige que "tests y `pnpm typecheck` pasan", pero los tests del SDK no están en CI (S8).

---

## 4. Cambios propuestos al plan (priorizando una demo real en testnet)

Son propuestas para que Josué las apruebe en el buzón, como pide la regla n.º 1. Las marcadas como *sugerencia* no son requisito para la entrega.

| # | Dónde en PLAN-OPUS | Cambio | Por qué |
|---|---|---|---|
| P1 | Línea 8 (hallazgo 2), §9 línea 286, §10 pregunta 1 (línea 300), Q3 (línea 179) | Reescribir: "El facilitador público **aceptó** pagos desde la `C…` en testnet (`d0e333b2…`, fee de unos 11.900 stroops). El facilitador propio queda como respaldo; el modo B no hace falta para la demo." | La evidencia del repo lo contradice; evita gastar horas en un facilitador publicado (O1) |
| P2 | Puntos de decisión, línea 195 (11:30 p. m.) | Marcar **resuelto: modo A**. | `transacciones.md` registra 11 pagos x402 desde la `C…` |
| P3 | Línea 196 (1:30 a. m.) y §9 línea 285 | Reemplazar "Freighter (ya existe en `web/src/billetera/freighter.ts`)" por: **plan B = `renovar` firmado por script** (`invocarG` de `scripts/pruebas-q1.mjs` o `cuenta-demo.mts` con `RENOVAR=1`), y en la web solo login y panel de lectura. Se dice en el video. Freighter queda como *sugerencia* solo si sobra tiempo. | Ese archivo no existe en el repo; el script ya firmó `renovar` en testnet (`f9a32bf3…`) |
| P4 | Q5 (línea 181) y la línea 201 de recortes | Activar **ya** el recorte "servicio de despliegue → CLI": `OWNER_ADDRESS=<G… de Cavos> QUICKCHAIN_TESORERIA=<G… con trustline> bash scripts/deploy-cuenta.sh`. | Q5 está en 0 %; el constructor no necesita la firma del dueño, así que la CLI alcanza para la demo |
| P5 | Q4 (línea 180), criterio "listo cuando" | Partir Q4 en (a) login + friendbot + `invokeContract(renovar, [i128 tope, i128 máx, u64 fin, i128 recarga])` con `{sponsored:false}`; (b) *sugerencia:* trustline y USDC en la wallet Cavos. Si (b) no sale, usar `recarga = 0` y fondear la `C…` con una transferencia directa del SAC desde la cuenta del equipo (una `C…` no necesita trustline). | Reduce el spike de Cavos a una sola llamada; el USDC en la `G…` de Cavos es el paso más frágil |
| P6 | Q4 / §2.2 (seguridad, nueva fila en §3) | Antes de pedir la firma de `renovar`, la web lee `estado()` y muestra y verifica `fee_bps = 100`, la tesorería oficial y `token = CBIELTK6…`. | Mitiga C2 sin tocar el contrato |
| P7 | Q6 (línea 182) | Recortar a "`estado()` en la web (tope, gastado, restante, comisión pendiente, saldo) + botón Renovar". `getEvents` pasa a *sugerencia*; los links salen de la terminal del agente y de `transacciones.md`. | Cubre el tramo 1:40–1:55 del guion (§6) con una sola lectura |
| P8 | Q7 (línea 183) | Fijar que el guion del agente es **una corrida**: 5 llamadas a `/tipo-cambio` y una a `/caro`, imprimiendo lo que queda después de cada pago. | Es lo que muestra el video (§6, líneas 231-232) |
| P9 | Q10 (línea 186) | "Corrida limpia en **una instancia nueva** cuyo dueño es la cuenta de la demo (Cavos o el plan B), con una tesorería distinta del dueño **que tenga trustline USDC**." | Evita O3 y C1 en vivo |
| P10 | §3 (tabla, líneas 155-166) | Agregar tres filas: (1) "el vendedor retiene la auth firmada" (S1; mitigación: limitar `maxTimeoutSeconds` en el SDK); (2) "el facilitador propio expuesto paga fees de terceros" (O1); (3) "el deployer elige comisión y tesorería" (C2). Sacar o marcar "pendiente" el límite de llamadas por minuto (línea 157) si no se implementa. | Que la tabla de amenazas diga lo que el código hace |
| P11 | §1.1 (líneas 26-33) | Actualizar las rutas a las reales (hueco 1). | La regla n.º 1 dice que el plan manda; hoy apunta a carpetas inexistentes |
| P12 | §7 (líneas 249 y 252) | Si Q12 no tiene respuestas a las 9:00 a. m., cambiar "N de M devs…" por "tests + txs en testnet" y decir que la validación sigue abierta. Y que `PITCH.md` se alinee con la lista "fuera del pitch". | Las reglas de cifras con fuente y de no prometer de más |
| P13 | §4, nueva regla después de la línea 197 | **No tocar el contrato antes de la entrega.** C1–C5 quedan para el roadmap (§5, punto 7: "Auditoría y mainnet"). | Cambiar el wasm invalida la evidencia de `7190eb76…` y obliga a repetir Q1, Q2, Q3 y Q8 |
| P14 | §8, riesgo principal (línea 277) | Agregar la cuenta: la comisión de un pago de US$0,01 es de 1.000 unidades (0,0001 USDC) y el fee medido es de unos 0,00118 XLM ([COSTOS.md](../COSTOS.md)). El 1 % cubre el fee solo si 1 XLM vale menos de unos US$0,085 (aritmética: 0,0001 ÷ 0,0011805). Falta un precio de XLM con fuente para concluir. | Prepara la respuesta a "¿El 1 % cubre el fee?" sin inventar un precio |

---

## 5. Top 5 acciones para las próximas 12 horas

Horas en tiempo de CR. Son la ruta mínima a una demo real en testnet; lo demás es sugerencia.

1. **11:30 p. m.–1:30 a. m. · Q4 mínimo con Cavos (con corte duro).** Registrar las URLs de callback (localhost y Vercel) y `NEXT_PUBLIC_CAVOS_APP_ID`. Hacer login con un correo nuevo y fondear la `G…` de Cavos con friendbot. Desplegar una `C…` con `OWNER_ADDRESS=<esa G…>` y una tesorería con trustline (C1, P4). Firmar `renovar(500000, 200000, fin, 0)` con `invokeContract` y `{sponsored:false}`. Fondear la `C…` con USDC desde la cuenta del equipo (P5). **1:30 a. m.:** si no firmó, pasar al plan B por script (P3) y dejar en la web solo login y panel.
2. **En paralelo, 11:30 p. m.–1:00 a. m. · Dejar `pnpm agente` listo para grabar.** Una corrida con 4 pagos, el 5.º bloqueado (`TopeAlcanzado`) y `/caro` bloqueado (`MontoPorLlamada`), mostrando lo que queda después de cada pago (P8). Confirmar la carga del `.env` (O2) y elegir el facilitador (público o propio local, sin publicarlo; O1). Ensayar contra una instancia con saldo. *Sugerencia de una línea:* limitar `maxTimeoutSeconds` en `sdk.ts:35` (S1).
3. **1:00–3:00 a. m. · Panel mínimo (Q6 recortado).** `estado()` en la web (tope, gastado, restante, comisión, saldo), la verificación de `fee_bps` y tesorería antes de firmar (P6) y el botón "Renovar mes" que reusa la llamada de la acción 1. Si a las 3:00 no está, se usa la salida de la terminal (es el recorte del plan). **3:00 a. m.: congelar funcionalidades** (sin tocar el contrato, P13).
4. **7:00–8:30 a. m. · Q10 corrida limpia + docs al día.** En la instancia de la demo: `renovar`, 4 pagos, 2 bloqueos sin tx, `cobrar_comision`, `pausar` y retiro, todo a `docs/transacciones.md` con links. Quien tenga pocos commits en la revisión de las 8:00 corrige los docs viejos en 30 minutos: `README.md:21`, `DEMO.md:6-7` y `:16`, `TAREAS.md:14`, `SEGURIDAD.md:13-14`, `ARQUITECTURA.md` y `web/AGENTS.md:6`. También el README de Q11, con créditos a AgentAllowance y ACAN y "testnet, sin auditar".
5. **7:30–11:00 a. m. · Pitch, video y entrega.** Alinear `PITCH.md` con §7 (sacar McKinsey y los volúmenes de x402; P12). Grabar la demo a las 8:30 con las txs reales de la acción 4 (cada hash en pantalla tiene que estar en `transacciones.md`). Subir a YouTube no listado y a Drive. Entregar en APEX a las **11:00** con captura. Las 11:30 son el margen, no la meta.

### Sugerencias (no requisitos), solo si sobra tiempo

- CI: agregar `pnpm --filter agent-client test` al job `typescript` (S8).
- SDK: `redirect: "manual"` (S2), filtrar `asset == USDC` (S3), revisar el saldo primero en `errores.ts` (S5), límite de llamadas por minuto (S4).
- Facilitador: techo de 100.000 stroops y `payTo` restringido si llega a publicarse (O1).
- Contrato, después del hackathon: sacar `cobrar_pendiente` de `renovar` o usar `try_transfer` (C1), tope de `fee_bps` o `fee_bps_esperado` (C2), `disponible` en `estado()` (C5) y lista de `payees` (C7).

<!-- enlaces:auto -->
## Enlaces

- ⬆️ Arriba: [Mapa (hub)](../MAPA.md) · [Índice de docs](../INDICE.md)
- 📖 Fuente de verdad: [PLAN-OPUS — la biblia](../PLAN-OPUS.md)
- Relacionado: [grok-4.7-high](2026-10-25-grok-4.7-high.md) · [gpt-5.6-sol-high](2026-10-25-gpt-5.6-sol-high.md) · [consolidado](2026-10-25-consolidado.md) · [Auditoría](../AUDITORIA.md) · [Seguridad](../SEGURIDAD.md)
- Lo enlazan: [Mapa (hub)](../MAPA.md) · [Índice de docs](../INDICE.md) · [PLAN-OPUS](../PLAN-OPUS.md)
- Tags: #quickchain #auditoria
<!-- /enlaces:auto -->
