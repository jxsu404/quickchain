//! Fábrica de cuentas-presupuesto: cualquiera crea su propia instancia de
//! `cuenta-presupuesto` (mismo wasm, token, tesorería y comisión fijados al
//! iniciar la fábrica). El dueño firma `crear`.
#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, xdr::ToXdr, Address, Bytes, BytesN, Env,
    IntoVal, Val, Vec,
};

#[contracttype]
#[derive(Clone)]
pub struct ConfigFabrica {
    pub wasm_hash: BytesN<32>,
    pub token: Address,
    pub tesoreria: Address,
    pub fee_bps: u32,
}

#[contracttype]
enum Clave {
    Config,
    Cuentas(Address),
}

const TTL_UMBRAL: u32 = 17_280 * 30;
const TTL_EXTENDER: u32 = 17_280 * 60;

#[contract]
pub struct FabricaPresupuesto;

/// Sal efectiva = sha256(owner || salt): dos dueños con la misma sal no chocan
/// y nadie puede ocupar la dirección de otro.
fn sal_efectiva(env: &Env, owner: &Address, salt: &BytesN<32>) -> BytesN<32> {
    let mut b: Bytes = owner.clone().to_xdr(env);
    b.append(&Bytes::from_array(env, &salt.to_array()));
    env.crypto().sha256(&b).into()
}

#[contractimpl]
impl FabricaPresupuesto {
    pub fn __constructor(env: Env, wasm_hash: BytesN<32>, token: Address, tesoreria: Address, fee_bps: u32) {
        if fee_bps > 10_000 {
            panic!("fee_bps > 10000");
        }
        env.storage().instance().set(&Clave::Config, &ConfigFabrica { wasm_hash, token, tesoreria, fee_bps });
        env.storage().instance().extend_ttl(TTL_UMBRAL, TTL_EXTENDER);
    }

    /// Despliega una cuenta-presupuesto con `owner` como dueño y `agente` (ed25519) como agente.
    pub fn crear(env: Env, owner: Address, agente: BytesN<32>, salt: BytesN<32>) -> Address {
        owner.require_auth();
        let c: ConfigFabrica = env.storage().instance().get(&Clave::Config).unwrap();
        let args: Vec<Val> = (owner.clone(), agente, c.token, c.tesoreria, c.fee_bps).into_val(&env);
        let id = env
            .deployer()
            .with_current_contract(sal_efectiva(&env, &owner, &salt))
            .deploy_v2(c.wasm_hash, args);
        let k = Clave::Cuentas(owner.clone());
        let mut lista: Vec<Address> = env.storage().persistent().get(&k).unwrap_or(Vec::new(&env));
        lista.push_back(id.clone());
        env.storage().persistent().set(&k, &lista);
        env.storage().persistent().extend_ttl(&k, TTL_UMBRAL, TTL_EXTENDER);
        env.storage().instance().extend_ttl(TTL_UMBRAL, TTL_EXTENDER);
        env.events().publish((symbol_short!("creada"), owner), id.clone());
        id
    }

    /// Dirección que tendría `crear(owner, _, salt)` (determinística).
    pub fn direccion(env: Env, owner: Address, salt: BytesN<32>) -> Address {
        env.deployer().with_current_contract(sal_efectiva(&env, &owner, &salt)).deployed_address()
    }

    /// Cuentas creadas por `owner`, en orden.
    pub fn listar(env: Env, owner: Address) -> Vec<Address> {
        env.storage().persistent().get(&Clave::Cuentas(owner)).unwrap_or(Vec::new(&env))
    }

    pub fn config(env: Env) -> ConfigFabrica {
        env.storage().instance().get(&Clave::Config).unwrap()
    }
}

#[cfg(test)]
mod test;
