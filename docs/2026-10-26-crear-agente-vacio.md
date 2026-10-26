# 2026-10-26 — `/crear`: clave del agente vacía por defecto

**Aprobado por Josué** el 2026-10-26 11:12 a. m. CR.

## Problema (High, auditoría de seguridad de Flaria)
`/crear` precargaba la clave pública del agente demo. Quien tenga el secreto de ese agente (compartido) podía gastar la recarga de cualquier usuario hasta el tope.

## Decisión
- El campo «Agent public key» arranca **vacío**.
- Casilla «Use the demo agent (testing only)»: al marcarla rellena la clave demo (G…) y muestra un aviso de que la clave es compartida y cualquiera con ella puede gastar hasta el tope.
- El botón de crear solo se habilita con una clave Stellar `G…` válida (`StrKey.isValidEd25519PublicKey`).
- Solo cambia `web/app/crear/page.tsx`; no se tocan `/demo`, providers, Cavos ni contratos.

## Enlaces
- ⬆️ [Índice de docs](INDICE.md) · [Decisiones](DECISIONES.md) · [Fábrica](2026-10-26-fabrica-presupuesto.md)
