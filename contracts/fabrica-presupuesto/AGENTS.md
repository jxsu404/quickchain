# contracts/fabrica-presupuesto

Fábrica Soroban (Rust, `soroban-sdk` 22): **cualquiera** crea su propia [cuenta-presupuesto](../cuenta-presupuesto/AGENTS.md). Guarda al iniciar `wasm_hash` (de la cuenta), `token` (USDC), `tesoreria` y `fee_bps`; el dueño solo elige su agente.

## Interfaz
```rust
fn __constructor(wasm_hash: BytesN<32>, token: Address, tesoreria: Address, fee_bps: u32);
fn crear(owner: Address, agente: BytesN<32>, salt: BytesN<32>) -> Address; // owner.require_auth(); evento ("creada", owner) -> id
fn direccion(owner: Address, salt: BytesN<32>) -> Address;                 // dirección determinística de crear
fn listar(owner: Address) -> Vec<Address>;                                 // cuentas creadas por owner
fn config() -> ConfigFabrica;
```
- Sal efectiva = `sha256(owner_xdr || salt)`: nadie puede ocupar la dirección de otro dueño.
- Pruebas: `cargo build -p cuenta-presupuesto --target wasm32v1-none --release && cargo test -p fabrica-presupuesto` (el test importa el wasm de la cuenta).
- Testnet: [`CAVWWLDYBCYFPDZT5P5XW7GSOQHE6TVLSZXQ47RIJKGEKUSD23AZ34MO`](https://stellar.expert/explorer/testnet/contract/CAVWWLDYBCYFPDZT5P5XW7GSOQHE6TVLSZXQ47RIJKGEKUSD23AZ34MO) (deploy [tx](https://stellar.expert/explorer/testnet/tx/141c417dad0b1d2091c66e5521882ab598c2da3191bbe304ba67d4bd49a75b00)); prueba `crear` [tx](https://stellar.expert/explorer/testnet/tx/d803111d804f1cdcb8e1f3f83ffacfffbf732f386cdc1e4d7133f05183cc9411) → [`CCAV5PZ46MDMKW256SW3UEM366KO2RKDCVK5ZW2N3CYDPLM446WJZZKX`](https://stellar.expert/explorer/testnet/contract/CCAV5PZ46MDMKW256SW3UEM366KO2RKDCVK5ZW2N3CYDPLM446WJZZKX). Fuente: [deployments/testnet.json](../../deployments/testnet.json).
- Web: `/crear` en [web](../../web/AGENTS.md) llama `crear` con la wallet Cavos y abre `/presupuesto?contract=C…`.
