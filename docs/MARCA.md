# Marca de Stellar QuickPass (v1.0)

Resumen de la identidad de marca v1.0 del 26-oct-2026. Viene de la carpeta de Drive «Stellar QuickPass - Marca», que Josué compartió a las 8:55 a. m. CR: `StellarQuickPass-marca-v1.zip` y `StellarQuickPass-manual-de-marca.pdf`, de 15 páginas. Los archivos no dicen quién los hizo; según el equipo es trabajo de José. Los assets que usa la web están en `web/public/brand/`.

## Paleta
| Nombre | Hex | Uso | Variable CSS |
|---|---|---|---|
| Azul Vía (principal) | `#1F3FD9` | logo, botones, títulos destacados | `--sqp-principal` |
| Verde Paso (acento) | `#14C38E` | pago permitido, barra del logo, estados OK | `--sqp-acento` |
| Tinta (neutro oscuro) | `#0B1020` | texto principal, fondos oscuros | `--sqp-neutro-oscuro` |
| Niebla (neutro claro) | `#F4F6FB` | fondos claros, tarjetas | `--sqp-neutro-claro` |
| Ámbar Tope (apoyo) | `#F2A516` | solo estado «cerca del tope» | `--sqp-apoyo-1` |
| Rojo Bloqueo (apoyo) | `#E0464E` | solo estado «pago bloqueado» | `--sqp-apoyo-2` |

Proporción: 60 % neutros, 30 % Azul Vía y 10 % Verde Paso. Contrastes del manual (WCAG): Tinta sobre Niebla 17,5:1, Verde Paso sobre Tinta 8,31:1 y Azul Vía sobre blanco 7,57:1. **No** usar Azul Vía sobre Tinta (2,49:1) ni Verde Paso sobre blanco (2,27:1) para texto.

## Tipografía (Google Fonts, SIL OFL)
- **Space Grotesk** 500/700: títulos y logotipo.
- **Inter** 400/600/700: texto e interfaz.
- **JetBrains Mono** 400/600: montos, datos y código. Los montos siempre llevan «USDC».

La web las carga con `next/font/google` en `web/app/layout.tsx`. Para dar énfasis se usa peso 600, nunca cursiva, y no más de 3 tamaños por pieza.

## Logo
Versiones: principal vertical, horizontal en 2 líneas (la preferida), horizontal en 1 línea y solo el ícono. Cada una existe en color, negativo y un color (tinta, blanco o azul).
- Área de respeto: 2x, donde x es el alto de la barra verde. Tamaños mínimos: ícono 16 px, horizontal 110 px de ancho. Por debajo de 110 px se usa solo el ícono.
- No estirar, rotar, recolorear ni agregar sombras.
- Sobre fondo Tinta va el negativo; sobre Niebla o blanco, el de color.
- En la web, todas las páginas van sobre fondo Tinta con el logo horizontal negativo en la cabecera (`web/app/cabecera.tsx`). El CTA es Azul Vía con texto blanco; los links y textos sobre Tinta van en Niebla o Verde Paso, y el gris secundario es `#C9CED8`. El ícono se usa como favicon (`web/app/icon.png` y `apple-icon.png`). Íconos de pasos: `web/public/brand/iconos/`, recoloreados a Niebla.

## Voz
Clara, precisa y tranquila, sin jerga cripto. Palabras prohibidas: inversión, ahorro, rendimiento, ganancia, «sin riesgo» y «100 % seguro». Tampoco se menciona Bitcoin ni Writz. Toda cifra lleva fuente o la etiqueta «ejemplo», y mientras sea prototipo se dice «Stellar testnet». «Stellar» es una marca de la SDF y el proyecto no tiene afiliación con ella.

<!-- enlaces:auto -->
## Enlaces

- ⬆️ Arriba: [Índice de docs](INDICE.md)
- Relacionado: [web](../web/AGENTS.md) · [Decisiones](DECISIONES.md) · [Pitch](PITCH.md)
- Tags: #quickchain #docs
<!-- /enlaces:auto -->
