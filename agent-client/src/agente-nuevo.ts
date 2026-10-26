// Genera la llave ed25519 del agente (sin fondos). Uso: AGENTE_ARCHIVO=/ruta/fuera/del/repo.env pnpm --filter agent-client agente-nuevo
// La secreta se escribe SOLO en AGENTE_ARCHIVO (chmod 600); en pantalla sale la pública y su hex para el contrato.
import { Keypair } from "@stellar/stellar-sdk";
import { appendFileSync, chmodSync, existsSync, readFileSync } from "node:fs";

const archivo = process.env.AGENTE_ARCHIVO;
if (!archivo) throw new Error("Definí AGENTE_ARCHIVO (ruta fuera del repo, p. ej. ~/secrets/agente.env)");
if (existsSync(archivo) && /^AGENT_SECRET_KEY=/m.test(readFileSync(archivo, "utf8"))) throw new Error(`${archivo} ya tiene AGENT_SECRET_KEY; no se sobrescribe`);
const kp = Keypair.random();
appendFileSync(archivo, `AGENT_SECRET_KEY=${kp.secret()}\n`);
chmodSync(archivo, 0o600);
console.log("Llave del agente creada. Secreta guardada en", archivo);
console.log("Pública (G…):", kp.publicKey());
console.log("Para el contrato (agente: BytesN<32>, hex):", kp.rawPublicKey().toString("hex"));
