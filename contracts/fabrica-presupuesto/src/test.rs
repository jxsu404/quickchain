extern crate std;
use super::*;
use soroban_sdk::{testutils::Address as _, Env};

// wasm de la cuenta-presupuesto (compilar antes: cargo build -p cuenta-presupuesto --target wasm32v1-none --release)
mod cuenta {
    use soroban_sdk::auth::Context;
    soroban_sdk::contractimport!(file = "../../target/wasm32v1-none/release/cuenta_presupuesto.wasm");
}

fn montar() -> (Env, FabricaPresupuestoClient<'static>, Address, Address) {
    let env = Env::default();
    let hash = env.deployer().upload_contract_wasm(cuenta::WASM);
    let token = env.register_stellar_asset_contract_v2(Address::generate(&env)).address();
    let tesoreria = Address::generate(&env);
    let id = env.register(FabricaPresupuesto, (hash, token.clone(), tesoreria.clone(), 100u32));
    let f = FabricaPresupuestoClient::new(&env, &id);
    (env, f, token, tesoreria)
}

#[test]
fn crear_despliega_instancia_configurada() {
    let (env, f, token, tesoreria) = montar();
    env.mock_all_auths();
    let owner = Address::generate(&env);
    let agente = BytesN::from_array(&env, &[7; 32]);
    let salt = BytesN::from_array(&env, &[1; 32]);
    let esperada = f.direccion(&owner, &salt);
    let id = f.crear(&owner, &agente, &salt);
    assert_eq!(id, esperada);
    let auths = env.auths();
    assert_eq!(auths[0].0, owner);
    let e = cuenta::Client::new(&env, &id).estado();
    assert_eq!(e.owner, owner);
    assert_eq!(e.token, token);
    assert_eq!(e.tesoreria, tesoreria);
    assert_eq!(e.fee_bps, 100);
    assert_eq!(f.listar(&owner), soroban_sdk::vec![&env, id.clone()]);
}

#[test]
fn misma_sal_distinto_duenio_no_choca() {
    let (env, f, _, _) = montar();
    env.mock_all_auths();
    let (a, b) = (Address::generate(&env), Address::generate(&env));
    let ag = BytesN::from_array(&env, &[7; 32]);
    let s = BytesN::from_array(&env, &[0; 32]);
    assert_ne!(f.crear(&a, &ag, &s), f.crear(&b, &ag, &s));
    assert_eq!(f.listar(&a).len(), 1);
}

#[test]
#[should_panic]
fn crear_sin_firma_del_duenio_falla() {
    let (env, f, _, _) = montar();
    let owner = Address::generate(&env);
    f.crear(&owner, &BytesN::from_array(&env, &[7; 32]), &BytesN::from_array(&env, &[1; 32]));
}
