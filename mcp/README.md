# quickpass-mcp — MCP server de Stellar QuickPass (testnet)

Servidor MCP (stdio, Node ≥ 20) para que cualquier agente de IA (Claude Desktop, Claude Code, Cursor, Grok Bot o cualquier cliente MCP) pague APIs x402 desde una **cuenta-presupuesto** con tope en cadena. El contrato hace cumplir el tope: el MCP no puede gastar más aunque el agente lo intente. **Solo Stellar testnet.** Decisión: [docs/2026-10-26-mcp-quickpass.md](../docs/2026-10-26-mcp-quickpass.md).

## Herramientas
| Tool | Qué hace |
|---|---|
| `quickpass_estado` | Tope, gastado del periodo, restante, máximo por llamada, saldo, fin del periodo, pausada. Solo lectura. |
| `quickpass_pagar_api` `{url, method?, body?, max_usdc?}` | Llama la URL; si responde 402 x402 (`exact`, `stellar:testnet`) paga desde la cuenta con la llave del agente, reintenta y devuelve la respuesta + `tx` + link de Stellar Expert. Si el contrato rechaza devuelve `bloqueado: true` (`"blocked: cap reached"` en el tope), sin tx. |
| `quickpass_pagos` `{limite?}` | Pagos recientes hechos por este MCP, con link de Stellar Expert. |

## 1. Requisitos
1. Una cuenta-presupuesto `C…` creada en `/crear` (fábrica `CAVWWLDY…`) con **tu agente** registrado y renovada en `/presupuesto` (tope, máximo por llamada, recarga USDC de testnet).
2. La llave del agente (testnet). Generala en tu máquina y poné solo su `G…` en `/crear`:
   ```bash
   node -e "const {Keypair}=require('@stellar/stellar-sdk');const k=Keypair.random();console.log('G (pegar en /crear):',k.publicKey());require('fs').writeFileSync(process.env.HOME+'/.quickpass-agente',k.secret(),{mode:0o600})"
   ```
   (correlo dentro de `mcp/` después del paso 2). La llave del agente no necesita fondos: el fee lo patrocina el facilitador x402.

## 2. Instalar (después de clonar)
```bash
git clone https://github.com/jxsu404/stellar-quickpass && cd stellar-quickpass/mcp
npm ci && npm run build      # deja mcp/dist/index.js
```
`npx github:jxsu404/stellar-quickpass#main` **no sirve**: npx no instala subcarpetas de un repo. Usá `node /ruta/a/stellar-quickpass/mcp/dist/index.js`.

## 3. Variables de entorno (únicas formas de configurarlo)
| Variable | Obligatoria | Valor |
|---|---|---|
| `QUICKPASS_CONTRACT_ID` | sí | `C…` de tu cuenta-presupuesto |
| `QUICKPASS_AGENT_SECRET` | sí | Secreta `S…` del agente (testnet). Nunca se loguea ni se devuelve. |
| `QUICKPASS_NETWORK` | no | `testnet` (única soportada) |
| `QUICKPASS_RPC_URL` | no | por defecto `https://soroban-testnet.stellar.org` |
| `QUICKPASS_HOSTS_PERMITIDOS` | no | hosts a los que puede pagar, separados por coma. Por defecto `quickchain-api-demo.onrender.com,localhost:4020` |
| `QUICKPASS_PAGOS_FILE` | no | historial local de pagos; por defecto `~/.quickpass-mcp/pagos-<C…>.json` |

## 4. Clientes

### Claude Desktop (`claude_desktop_config.json`)
macOS: `~/Library/Application Support/Claude/claude_desktop_config.json` · Windows: `%APPDATA%\Claude\claude_desktop_config.json`
```json
{
  "mcpServers": {
    "quickpass": {
      "command": "node",
      "args": ["/RUTA/ABSOLUTA/stellar-quickpass/mcp/dist/index.js"],
      "env": {
        "QUICKPASS_CONTRACT_ID": "C...",
        "QUICKPASS_AGENT_SECRET": "S...",
        "QUICKPASS_NETWORK": "testnet"
      }
    }
  }
}
```
Reiniciá Claude Desktop.

### Claude Code
```bash
claude mcp add quickpass \
  -e QUICKPASS_CONTRACT_ID=C... \
  -e QUICKPASS_AGENT_SECRET="$(cat ~/.quickpass-agente)" \
  -e QUICKPASS_NETWORK=testnet \
  -- node /RUTA/ABSOLUTA/stellar-quickpass/mcp/dist/index.js
```

### Cursor (`.cursor/mcp.json` del proyecto o `~/.cursor/mcp.json`)
Mismo bloque `mcpServers` que Claude Desktop. No commitees ese archivo si lleva la secreta (o usá `"QUICKPASS_AGENT_SECRET": "${env:QUICKPASS_AGENT_SECRET}"`).

### Cualquier cliente MCP (stdio)
Comando `node`, argumentos `["/RUTA/stellar-quickpass/mcp/dist/index.js"]`, con las variables de entorno de arriba. Para probar a mano: `npx @modelcontextprotocol/inspector node dist/index.js` (con las variables exportadas).

## 5. Prueba rápida
Pedile al agente: «usá quickpass_estado» y luego «pagá https://quickchain-api-demo.onrender.com/tipo-cambio con quickpass_pagar_api» (US$0,01 + 1 % de comisión). Repetí hasta el tope: el contrato responde `TopeAlcanzado` y el MCP devuelve `"blocked: cap reached"` sin enviar tx.

## Seguridad
- El tope, el máximo por llamada, la pausa y el fin del periodo los aplica el contrato (`__check_auth`) en la simulación: si rechaza, no hay tx.
- Límites locales extra: `max_usdc`, lista de hosts permitidos, 10 pagos por minuto.
- `src/sdk.ts` y `src/errores.ts` son copia de [agent-client](../agent-client/AGENTS.md) (para no tocar `web/`); mantenerlas en sync a mano.
- Solo testnet; no es inversión ni ahorro.
