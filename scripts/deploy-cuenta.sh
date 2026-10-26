#!/usr/bin/env bash
# Q1 — despliega `cuenta-presupuesto` (contracts/cuenta-presupuesto) en Stellar testnet.
# Lee las llaves de .env (ignorado por git) y nunca las imprime.
# Uso: bash scripts/deploy-cuenta.sh
# Variables (.env): DEPLOYER_SECRET_KEY, AGENT_SECRET_KEY (opcional: OWNER_ADDRESS,
#   AGENT_PUBLIC_KEY_HEX, QUICKCHAIN_TESORERIA, USDC_CONTRACT_ID, FEE_BPS)
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; [ -f .env ] && . ./.env; set +a
: "${DEPLOYER_SECRET_KEY:?Falta DEPLOYER_SECRET_KEY en .env}"
NET=testnet
RPC=https://soroban-testnet.stellar.org
PASS="Test SDF Network ; September 2015"

pub() { (cd agent-client && node -e 'const {Keypair}=require("@stellar/stellar-sdk");const k=Keypair.fromSecret(process.argv[1]);console.log(process.argv[2]==="hex"?Buffer.from(k.rawPublicKey()).toString("hex"):k.publicKey())' "$1" "${2:-}"); }

DEPLOYER=$(pub "$DEPLOYER_SECRET_KEY")
OWNER=${OWNER_ADDRESS:-$DEPLOYER}
TESORERIA=${QUICKCHAIN_TESORERIA:-$DEPLOYER}
AGENTE_HEX=${AGENT_PUBLIC_KEY_HEX:-$(pub "${AGENT_SECRET_KEY:?Falta AGENT_SECRET_KEY o AGENT_PUBLIC_KEY_HEX}" hex)}
FEE_BPS=${FEE_BPS:-100}
# USDC de Circle en testnet (SAC de USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5)
USDC=${USDC_CONTRACT_ID:-$(stellar contract id asset --asset USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5 --network $NET)}

echo "Fondeando deployer $DEPLOYER con friendbot (si ya existe, no pasa nada)…"
curl -s "https://friendbot.stellar.org/?addr=$DEPLOYER" >/dev/null || true

stellar contract build --package cuenta-presupuesto >/dev/null
WASM=target/wasm32v1-none/release/cuenta_presupuesto.wasm
export STELLAR_ACCOUNT="$DEPLOYER_SECRET_KEY" STELLAR_NETWORK=$NET STELLAR_RPC_URL=$RPC STELLAR_NETWORK_PASSPHRASE="$PASS"

WASM_HASH=$(stellar contract upload --wasm "$WASM" 2>/dev/null)
ID=$(stellar contract deploy --wasm-hash "$WASM_HASH" 2>/tmp/deploy-cuenta.log -- \
  --owner "$OWNER" --agente "$AGENTE_HEX" --token "$USDC" --tesoreria "$TESORERIA" --fee_bps "$FEE_BPS")
DEPLOY_TX=$(grep -oE 'tx/[0-9a-f]{64}' /tmp/deploy-cuenta.log | head -1 | cut -d/ -f2 || true)

cat > deployments/testnet.json <<JSON
{
  "red": "testnet",
  "contrato": "cuenta-presupuesto",
  "paquete": "contracts/cuenta-presupuesto",
  "contract_id": "$ID",
  "wasm_hash": "$WASM_HASH",
  "deploy_tx": "$DEPLOY_TX",
  "owner": "$OWNER",
  "agente_ed25519_hex": "$AGENTE_HEX",
  "token_usdc": "$USDC",
  "tesoreria": "$TESORERIA",
  "fee_bps": $FEE_BPS,
  "deployer": "$DEPLOYER",
  "fecha": "$(date '+%Y-%m-%d %H:%M') (CR)",
  "stellar_expert": "https://stellar.expert/explorer/testnet/contract/$ID"
}
JSON
echo "Contrato: $ID"
echo "https://stellar.expert/explorer/testnet/contract/$ID"
