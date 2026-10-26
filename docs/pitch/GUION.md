# Guion del pitch — Stellar QuickPass (antes QuickChain)

Pura Vida Ideathon · Track Genesis · Stellar. Español de Costa Rica, con voseo.

**Total hablado: 337 palabras ≈ 2:36 a 130 palabras/min** (límite 3:00). Las slides 10 (Demo, video de 2:00) y 12 (Equipo) quedan fuera del reloj, igual que en el pitch de Hyto.

Estructura y proporciones calcadas de [pitch-hyto](https://pitch-hyto.vercel.app/): Portada 0:08 · Problema (a) 0:20 · Problema (b) 0:15 · Solución 0:38 · Núcleo 0:11 · Esto ya funciona 0:18 · Visión 0:12 · Lo que buscamos 0:20 · Rumbo a mainnet 0:30 · [Demo] · Cierre 0:08 · [Equipo] = 3:00, escaladas a ~2:36.

Deck: `index.html` (← → / espacio / clic para navegar, **F** pantalla completa, **N** notas del orador con cronómetro, **R** reinicia el cronómetro; `index.html?notes` las abre ya). Versión con el nombre viejo: `index-quickchain.html`.

| # | Slide | Tiempo | Palabras | % del pitch | % en Hyto |
|---|---|---|---|---|---|
| 1 | Portada | 0:00–0:07 | 15 | 4 % | 4 % |
| 2 | Problema · 3 a. m. | 0:07–0:25 | 39 | 12 % | 11 % |
| 3 | Problema · todo o nada | 0:25–0:39 | 30 | 9 % | 8 % |
| 4 | Solución | 0:39–1:10 | 67 | 20 % | 21 % |
| 5 | Núcleo | 1:10–1:19 | 21 | 6 % | 6 % |
| 6 | Esto ya funciona | 1:19–1:36 | 35 | 10 % | 10 % |
| 7 | Visión | 1:36–1:48 | 26 | 8 % | 7 % |
| 8 | Modelo y lo que buscamos | 1:48–2:05 | 37 | 11 % | 11 % |
| 9 | Rumbo a mainnet | 2:05–2:29 | 52 | 15 % | 17 % |
| 10 | Demo | fuera del reloj | 0 | 0 % | 0 % |
| 11 | Cierre | 2:29–2:36 | 15 | 4 % | 4 % |
| 12 | Equipo | fuera del reloj | 0 | 0 % | 0 % |


## 01 · Portada — 0:00–0:07 (15 palabras)

> Somos Stellar QuickPass. Tu agente paga solo. Nunca más de tu tope. Primero, una historia.

## 02 · Problema · 3 a. m. — 0:07–0:25 (39 palabras)

> Ella es Ana. Tiene una tiendita de café en línea en Cartago y un agente de IA que trabaja de noche. Le dio su tarjeta. A las tres de la mañana despertó con el estómago apretado: ¿cuánto habrá gastado?

## 03 · Problema · todo o nada — 0:25–0:39 (30 palabras)

> Entonces le quitó la tarjeta, y ahora aprueba cada pago, uno por uno. El agente ya no le sirve. Todo o nada: o vivís con miedo, o firmás mil veces.

## 04 · Solución — 0:39–1:10 (67 palabras)

> Por eso hicimos Stellar QuickPass. Como el Quickpass de la autopista: no parás en cada peaje, se cobra solo. Uno: entrás con tu correo, sin frase semilla. Dos: firmás una sola vez tu tope del mes en USDC. Tres: tu agente paga cada API x402 por su cuenta. Si se quiere pasar, un contrato en Stellar le dice que no. Podés pausarlo o retirar lo que sobra.

## 05 · Núcleo — 1:10–1:19 (21 palabras)

> Stellar QuickPass es control: vos ponés el tope. Autonomía: el agente paga solo. Y trazabilidad: cada pago queda con su link.

## 06 · Esto ya funciona — 1:19–1:36 (35 palabras)

> Esto ya funciona en testnet. Con un tope de cinco centavos, el agente hizo cuatro pagos de un centavo. El quinto: bloqueado. Una llamada de un dólar: bloqueada. Y si se bloquea, no hay transacción.

## 07 · Visión — 1:36–1:48 (26 palabras)

> La visión: agentes que pagan solos, con un límite que pone una persona. En Stellar, el que dice que no es la cadena, no el agente.

## 08 · Modelo y lo que buscamos — 1:48–2:05 (37 palabras)

> El modelo es simple: uno por ciento de lo que gasta el agente, dentro del tope y sin mensualidad. Si tu agente gasta diez dólares, pagás diez centavos. Buscamos equipos con agentes reales para probarlo con nosotros.

## 09 · Rumbo a mainnet — 2:05–2:29 (52 palabras)

> ¿Nos ayudan a llegar a mainnet? Tres cosas. Una: auditar el contrato, porque hoy no está auditado. Dos: una revisión legal antes de tocar dinero real. Tres: que nos presenten a la gente correcta: equipos de Stellar, APIs que cobran con x402 y billeteras. Con eso, llevamos Stellar QuickPass a dinero real.

## 10 · Demo — fuera del reloj (0 palabras)

_Fuera del reloj: sin texto hablado._

## 11 · Cierre — 2:29–2:36 (15 palabras)

> Ana ya duerme tranquila. Stellar QuickPass: tu agente paga solo. Nunca más de tu tope.

## 12 · Equipo — fuera del reloj (0 palabras)

_Fuera del reloj: sin texto hablado._

## Fuentes de cada dato en pantalla

- Caso de Ana: **ilustrativo** (así lo dice la slide); no es una persona real ni una cita.
- «1000 llamadas = 1000 firmas»: con x402 `exact` cada llamada necesita un pago firmado y una tx nueva — [x402 issue #946](https://github.com/x402-foundation/x402/issues/946) (README del repo, PLAN-OPUS §7).
- Corrida Q10 (26/10/2026, 12:39 a. m. CR, cuenta [CBAVYNKB…](https://stellar.expert/explorer/testnet/contract/CBAVYNKBG5TKC56BXON4UKVOQX4YVPX2UA3YB77J6VSSCCKHKHSYJKCG)), tope 0,05 USDC, máx. 0,02: pagos [aa26ecdd](https://stellar.expert/explorer/testnet/tx/aa26ecdd60d84a052974132f4b630df26f6474740a3d50cf30ea891992203d26), [8929c0b8](https://stellar.expert/explorer/testnet/tx/8929c0b8a39ffe5e572dac0efbba411ab0fceb188b2697c3e15188b0fca05770), [af058a6a](https://stellar.expert/explorer/testnet/tx/af058a6a8138662f480b41280988cd8f49a3e2fe86b06b807369e7d2a7aa12fe), [3213715f](https://stellar.expert/explorer/testnet/tx/3213715f1bde951afe6f9c59d56c59552c18f081922072fa6fdf55b057f9370d); 5.º `TopeAlcanzado`, `/caro` US$1 `MontoPorLlamada`, pausa [2e8b7da3](https://stellar.expert/explorer/testnet/tx/2e8b7da3dafdc273fbdff6b6b4b244930949e35f2c86aaeeaa01f284e3fd8e10) → `Pausada`; los bloqueos no generan tx — docs/transacciones.md.
- Fee: 11.903 stroops por pago desde la `C…` con facilitador público ([d0e333b2](https://stellar.expert/explorer/testnet/tx/d0e333b29eb42b717426844ebf4dc443083fc2abaa72e5c60d454f137d1b1fc0)) vs. 11.597 desde una `G…` ([e82320dc](https://stellar.expert/explorer/testnet/tx/e82320dc157bd63ddb31f821794569da5929b5f680cc07ac81376040910788e0)) — docs/COSTOS.md. Sin precio XLM/USD (decisión del equipo).
- Comisión 1 %: `cobrar_comision()` mandó 0,0002 USDC a la tesorería ([820db07e](https://stellar.expert/explorer/testnet/tx/820db07e4b543a68ed5297398ae51009113aeadbfc1e75ac34d0be2ee919dc18)) — README, docs/COSTOS.md. «US$10 → US$0,10» es el ejemplo de PLAN-OPUS §7.
- Contrato vigente de la demo: [CBKMDFKW…](https://stellar.expert/explorer/testnet/contract/CBKMDFKWDHO2V6K27R5W7N3DPSDNHOV5GBACNHZQ4YRC5YLYF2XROEEE) (deployments/testnet.json).
- Equipo: según el README (commits): Josué Valles, José, Raúl Altamirano y Jayden — *el README dice que falta que Josué confirme la lista*.

## Reglas que respeta

- Nunca se presenta como inversión, ahorro, ganancia ni «sin riesgo»; testnet y contrato sin auditar dichos en pantalla (slides 9 y 11). La ley no se nombra en el pitch (PLAN-OPUS §7); se pide «revisión legal».
- Sin Writz, sin Bitcoin, sin precio XLM/USD, sin estadísticas de mercado, usuarios ni citas inventadas.

## Enlaces

- ⬆️ Arriba: [Pitch](../PITCH.md) · [Mapa (hub)](../MAPA.md)
- 📖 Fuente de verdad: [PLAN-OPUS — la biblia](../PLAN-OPUS.md)
- Relacionado: [Deck (HTML)](index.html) · [Demo (testnet)](../DEMO.md) · [Transacciones (testnet)](../transacciones.md) · [Costos](../COSTOS.md)
