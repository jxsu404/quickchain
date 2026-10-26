# 2026-10-26 · Fábrica de cuentas-presupuesto

**Decisión (aprobada por Josué):** cualquier usuario, no solo Josué, crea su propia cuenta-presupuesto con [contracts/fabrica-presupuesto](../contracts/fabrica-presupuesto/AGENTS.md).

- Una fábrica en testnet fija wasm (`7190eb76…`), USDC (`CBIELTK6…`), tesorería (`GAAIYNFO…`) y comisión 1 %; el usuario firma `crear(owner, agente, salt)` con su wallet Cavos en `/crear`.
- Sal derivada del dueño (`sha256(owner || salt)`) para que nadie robe la dirección de otro.
- `listar(owner)` evita base de datos: la web lee las cuentas del usuario del contrato.
- Fábrica: [`CAVWWLDYBCYFPDZT5P5XW7GSOQHE6TVLSZXQ47RIJKGEKUSD23AZ34MO`](https://stellar.expert/explorer/testnet/contract/CAVWWLDYBCYFPDZT5P5XW7GSOQHE6TVLSZXQ47RIJKGEKUSD23AZ34MO), deploy [tx](https://stellar.expert/explorer/testnet/tx/141c417dad0b1d2091c66e5521882ab598c2da3191bbe304ba67d4bd49a75b00). Prueba `crear` (deployer como dueño): [tx](https://stellar.expert/explorer/testnet/tx/d803111d804f1cdcb8e1f3f83ffacfffbf732f386cdc1e4d7133f05183cc9411) → [`CCAV5PZ46MDMKW256SW3UEM366KO2RKDCVK5ZW2N3CYDPLM446WJZZKX`](https://stellar.expert/explorer/testnet/contract/CCAV5PZ46MDMKW256SW3UEM366KO2RKDCVK5ZW2N3CYDPLM446WJZZKX).
- El deployer es una identidad nueva de testnet (`GB6QIMBS…`): la del deploy original (`GBMD67Q5…`) no estaba en la máquina. La fábrica no tiene admin ni `upgrade`.
