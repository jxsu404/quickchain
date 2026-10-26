# Tareas — fecha límite: lunes 2026-10-26, antes de las 11:30 a. m. (hora de Costa Rica)

> **Regla n.º 1: [docs/PLAN-OPUS.md](docs/PLAN-OPUS.md) es la biblia de QuickChain.** Toda persona o agente que trabaje aquí (integrantes, Raúl, Martín o cualquier otro) lee el plan antes de empezar y sigue sus fases, tareas (Q0–Q15), horarios de corte y planes B. Si algo choca con el plan, gana el plan; para cambiarlo, se propone en el buzón y lo aprueba Josué.

Cada tarea tiene un issue en GitHub. Trabajá en tu rama `rol/<nombre>` y abrí PR a `main`.

## 1. Contrato de presupuesto (`contracts/budget`)
Listo cuando: `cargo test -p budget` pasa; está desplegado en testnet; el ID está en `docs/DEMO.md`; la comisión de 1 % está implementada o documentada como pendiente.

## 2. Cliente del agente (`agent-client`)
Listo cuando: `pnpm agente` recibe un 402, paga desde el contrato y reintenta; imprime el link de Stellar Expert de cada pago; cuando el contrato bloquea, lo muestra sin romperse.

## 3. API de prueba (`api-demo`)
Listo cuando: `GET /api/clima` responde 402 sin pago y 200 con pago; acepta el pago hecho desde el contrato (`X-QUICKCHAIN-TX`); está desplegada en Vercel.

## 4. Web con Cavos (`web`)
Listo cuando: el dueño entra con correo, ve su cuenta G…, firma el tope mensual (una firma) y ve cuánto lleva gastado el agente; desplegada en Vercel.

## 5. Demo del tope
Listo cuando: hay un guion en `docs/DEMO.md` con pagos reales en testnet (links de Stellar Expert) y un intento bloqueado por pasarse del tope.

## 6. README, pitch y video
Listo cuando: README revisado, `docs/PITCH.md` completo (cada cifra con fuente), slides con la plantilla del evento y video de ≤ 3 min subido.
