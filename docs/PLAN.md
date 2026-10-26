# Plan

> **Regla n.º 1: [docs/PLAN-OPUS.md](PLAN-OPUS.md) es la biblia de QuickChain.** Toda persona o agente que trabaje aquí (integrantes, Raúl, Martín o cualquier otro) lee el plan antes de empezar y sigue sus fases, tareas (Q0–Q15), horarios de corte y planes B. Si algo choca con el plan, gana el plan; para cambiarlo, se propone en el buzón y lo aprueba Josué.

**Meta:** demo funcionando en Stellar testnet antes del lunes 2026-10-26, 11:30 a. m. (CR).

1. Contrato `budget` con tope por periodo (hecho: código + 7 tests + wasm compila). Falta: desplegar en testnet, comisión 1 %.
2. API x402 de prueba (hecho: cobro `exact`). Falta: aceptar pagos desde el contrato y desplegar en Vercel.
3. Cliente del agente (hecho: 402 → `gastar` → reintento). Falta: probar contra testnet.
4. Web con Cavos (hecho: login y formulario). Falta: firmar `approve` + `crear_presupuesto`, mostrar gastado.
5. Demo del tope con links de Stellar Expert.
6. README, pitch y video.

Fuera de alcance: mainnet, colones, Writz, Bitcoin, Neon (no hace falta guardar datos: el estado vive en el contrato).
