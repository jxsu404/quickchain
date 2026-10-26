//! Los 11 tests mínimos de docs/PLAN-OPUS.md §2.3 (t01–t11) y casos borde extra (t12–t17).
extern crate std;

use super::*;
use ed25519_dalek::{Signer, SigningKey};
use soroban_sdk::{
    auth::ContractContext,
    testutils::{Address as _, BytesN as _, Ledger},
    token::{StellarAssetClient, TokenClient},
    vec, IntoVal, Symbol, Val,
};

const USDC: i128 = 10_000_000; // 7 decimales
const CENTAVO: i128 = 100_000; // US$0,01
const DIA: u64 = 24 * 60 * 60;
const AHORA: u64 = 1_761_000_000;

struct Prueba {
    env: Env,
    cuenta: Address,
    cli: CuentaPresupuestoClient<'static>,
    token: TokenClient<'static>,
    owner: Address,
    tesoreria: Address,
    vendedor: Address,
    agente: SigningKey,
}

fn llave(n: u8) -> SigningKey {
    SigningKey::from_bytes(&[n; 32])
}
fn publica(env: &Env, k: &SigningKey) -> BytesN<32> {
    BytesN::from_array(env, &k.verifying_key().to_bytes())
}

/// Cuenta con tope US$0,05, máximo US$0,02 por llamada, 30 días y US$1 de saldo.
fn preparar() -> Prueba {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|l| l.timestamp = AHORA);
    let admin = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(admin);
    let token = TokenClient::new(&env, &sac.address());
    let owner = Address::generate(&env);
    let tesoreria = Address::generate(&env);
    let vendedor = Address::generate(&env);
    StellarAssetClient::new(&env, &sac.address()).mint(&owner, &(10 * USDC));
    let agente = llave(7);
    let cuenta = env.register(
        CuentaPresupuesto,
        (owner.clone(), publica(&env, &agente), sac.address(), tesoreria.clone(), 100u32),
    );
    let cli = CuentaPresupuestoClient::new(&env, &cuenta);
    cli.renovar(&(5 * CENTAVO), &(2 * CENTAVO), &(AHORA + 30 * DIA), &USDC);
    Prueba { env, cuenta, cli, token, owner, tesoreria, vendedor, agente }
}

fn ctx_transfer(t: &Prueba, from: &Address, to: &Address, monto: i128) -> Context {
    Context::Contract(ContractContext {
        contract: t.token.address.clone(),
        fn_name: Symbol::new(&t.env, "transfer"),
        args: (from.clone(), to.clone(), monto).into_val(&t.env),
    })
}

fn check(t: &Prueba, k: &SigningKey, ctxs: Vec<Context>) -> Result<(), Error> {
    let payload = BytesN::<32>::random(&t.env);
    let sig = k.sign(&payload.to_array()).to_bytes();
    let firmas = vec![
        &t.env,
        FirmaAgente { public_key: publica(&t.env, k), signature: BytesN::from_array(&t.env, &sig) },
    ];
    let firmas_val: Val = firmas.into_val(&t.env);
    t.env
        .try_invoke_contract_check_auth::<Error>(&t.cuenta, &payload, firmas_val, &ctxs)
        .map_err(|e| e.expect("error de contrato"))
}

fn pagar(t: &Prueba, monto: i128) -> Result<(), Error> {
    let c = ctx_transfer(t, &t.cuenta, &t.vendedor, monto);
    check(t, &t.agente, vec![&t.env, c])
}

#[test]
fn t01_agente_paga_dentro_del_tope() {
    let t = preparar();
    assert_eq!(pagar(&t, CENTAVO), Ok(()));
    let e = t.cli.estado();
    assert_eq!(e.gastado, CENTAVO + 1_000);
    assert_eq!(e.comision_pendiente, 1_000);
    assert_eq!(e.restante, 5 * CENTAVO - CENTAVO - 1_000);
    assert_eq!(e.saldo, USDC);
}

#[test]
fn t02_pasarse_del_tope_con_comision() {
    let t = preparar();
    // 4 × (0,01 + comisión) = 404.000; un 5.º pago de 0,01 pasaría a 505.000 > 500.000
    for _ in 0..4 {
        assert_eq!(pagar(&t, CENTAVO), Ok(()));
    }
    assert_eq!(pagar(&t, CENTAVO), Err(Error::TopeAlcanzado));
    assert_eq!(t.cli.estado().gastado, 4 * (CENTAVO + 1_000));
}

#[test]
fn t03_monto_mayor_al_maximo_por_llamada() {
    let t = preparar();
    assert_eq!(pagar(&t, USDC), Err(Error::MontoPorLlamada));
    assert_eq!(pagar(&t, 0), Err(Error::MontoInvalido));
    assert_eq!(t.cli.estado().gastado, 0);
}

#[test]
fn t04_firma_de_otra_llave() {
    let t = preparar();
    let c = ctx_transfer(&t, &t.cuenta, &t.vendedor, CENTAVO);
    assert_eq!(check(&t, &llave(9), vec![&t.env, c.clone()]), Err(Error::AgenteDesconocido));
    // Llave pública correcta pero firma falsa: ed25519_verify aborta.
    let payload = BytesN::<32>::random(&t.env);
    let firmas = vec![
        &t.env,
        FirmaAgente { public_key: publica(&t.env, &t.agente), signature: BytesN::from_array(&t.env, &[1u8; 64]) },
    ];
    let r = t.env.try_invoke_contract_check_auth::<Error>(&t.cuenta, &payload, firmas.into_val(&t.env), &vec![&t.env, c]);
    assert!(r.is_err());
    // Sin firmas
    let vacias: Vec<FirmaAgente> = Vec::new(&t.env);
    let r = t.env.try_invoke_contract_check_auth::<Error>(
        &t.cuenta,
        &BytesN::random(&t.env),
        vacias.into_val(&t.env),
        &vec![&t.env, ctx_transfer(&t, &t.cuenta, &t.vendedor, CENTAVO)],
    );
    assert_eq!(r.map_err(|e| e.unwrap()), Err(Error::FirmaInvalida));
}

#[test]
fn t05_operaciones_no_permitidas() {
    let t = preparar();
    let approve = Context::Contract(ContractContext {
        contract: t.token.address.clone(),
        fn_name: Symbol::new(&t.env, "approve"),
        args: (t.cuenta.clone(), t.vendedor.clone(), CENTAVO, 1000u32).into_val(&t.env),
    });
    assert_eq!(check(&t, &t.agente, vec![&t.env, approve]), Err(Error::OperacionNoPermitida));
    let otro = Context::Contract(ContractContext {
        contract: Address::generate(&t.env),
        fn_name: Symbol::new(&t.env, "transfer"),
        args: (t.cuenta.clone(), t.vendedor.clone(), CENTAVO).into_val(&t.env),
    });
    assert_eq!(check(&t, &t.agente, vec![&t.env, otro]), Err(Error::OperacionNoPermitida));
    let de_otro = ctx_transfer(&t, &t.owner, &t.vendedor, CENTAVO);
    assert_eq!(check(&t, &t.agente, vec![&t.env, de_otro]), Err(Error::OperacionNoPermitida));
    let a_si_misma = ctx_transfer(&t, &t.cuenta, &t.cuenta, CENTAVO);
    assert_eq!(check(&t, &t.agente, vec![&t.env, a_si_misma]), Err(Error::OperacionNoPermitida));
    let renovar = Context::Contract(ContractContext {
        contract: t.cuenta.clone(),
        fn_name: Symbol::new(&t.env, "renovar"),
        args: ().into_val(&t.env),
    });
    assert_eq!(check(&t, &t.agente, vec![&t.env, renovar]), Err(Error::OperacionNoPermitida));
    assert_eq!(t.cli.estado().gastado, 0);
}

#[test]
fn t06_periodo_vencido_y_renovar() {
    let t = preparar();
    t.env.ledger().with_mut(|l| l.timestamp = AHORA + 30 * DIA);
    assert_eq!(pagar(&t, CENTAVO), Err(Error::PeriodoVencido));
    let ahora = AHORA + 30 * DIA;
    t.cli.renovar(&(5 * CENTAVO), &(2 * CENTAVO), &(ahora + 30 * DIA), &0);
    assert_eq!(pagar(&t, CENTAVO), Ok(()));
    assert_eq!(t.cli.estado().periodo, 2);
}

#[test]
fn t07_pausada() {
    let t = preparar();
    t.cli.pausar();
    assert_eq!(pagar(&t, CENTAVO), Err(Error::Pausada));
    t.cli.reanudar();
    assert_eq!(pagar(&t, CENTAVO), Ok(()));
    // Rotación de llave: la vieja deja de servir
    let nueva = llave(8);
    t.cli.cambiar_agente(&publica(&t.env, &nueva));
    assert_eq!(pagar(&t, CENTAVO), Err(Error::AgenteDesconocido));
    let c = ctx_transfer(&t, &t.cuenta, &t.vendedor, CENTAVO);
    assert_eq!(check(&t, &nueva, vec![&t.env, c]), Ok(()));
}

#[test]
fn t08_renovar_exige_dueno_y_periodo_valido() {
    let t = preparar();
    // Sin auths simuladas, renovar falla (no firmó el dueño).
    t.env.set_auths(&[]);
    let r = t.cli.try_renovar(&(5 * CENTAVO), &(2 * CENTAVO), &(AHORA + 10 * DIA), &0);
    assert!(r.is_err());
    t.env.mock_all_auths();
    let r = t.cli.try_renovar(&(5 * CENTAVO), &(2 * CENTAVO), &(AHORA + 40 * DIA), &0);
    assert_eq!(r, Err(Ok(Error::PeriodoInvalido)));
    let r = t.cli.try_renovar(&(5 * CENTAVO), &(2 * CENTAVO), &AHORA, &0);
    assert_eq!(r, Err(Ok(Error::PeriodoInvalido)));
    let r = t.cli.try_renovar(&CENTAVO, &(2 * CENTAVO), &(AHORA + DIA), &0);
    assert_eq!(r, Err(Ok(Error::ParametrosInvalidos)));
    // La auth pedida fue la del dueño
    t.cli.renovar(&(5 * CENTAVO), &(2 * CENTAVO), &(AHORA + DIA), &0);
    assert_eq!(t.env.auths()[0].0, t.owner);
}

#[test]
fn t09_retirar_no_toca_la_comision() {
    let t = preparar();
    assert_eq!(pagar(&t, CENTAVO), Ok(()));
    // Simula la liquidación del pago: la cuenta transfiere al vendedor.
    t.token.transfer(&t.cuenta, &t.vendedor, &CENTAVO);
    let saldo = t.token.balance(&t.cuenta);
    assert_eq!(saldo, USDC - CENTAVO);
    let r = t.cli.try_retirar(&t.owner, &saldo);
    assert_eq!(r, Err(Ok(Error::ParametrosInvalidos)));
    t.cli.retirar(&t.owner, &(saldo - 1_000));
    assert_eq!(t.token.balance(&t.cuenta), 1_000);
    assert_eq!(t.cli.estado().comision_pendiente, 1_000);
}

#[test]
fn t10_cobrar_comision_publica_a_tesoreria_fija() {
    let t = preparar();
    assert_eq!(pagar(&t, CENTAVO), Ok(()));
    assert_eq!(pagar(&t, 2 * CENTAVO), Ok(()));
    // Nadie firma: cobrar_comision no exige auth.
    t.env.set_auths(&[]);
    assert_eq!(t.cli.cobrar_comision(), 3_000);
    assert_eq!(t.token.balance(&t.tesoreria), 3_000);
    assert_eq!(t.cli.estado().comision_pendiente, 0);
    assert_eq!(t.cli.cobrar_comision(), 0);
    // renovar también cobra lo pendiente antes de reiniciar
    t.env.mock_all_auths();
    assert_eq!(pagar(&t, CENTAVO), Ok(()));
    t.cli.renovar(&(5 * CENTAVO), &(2 * CENTAVO), &(AHORA + DIA), &0);
    assert_eq!(t.token.balance(&t.tesoreria), 4_000);
    assert_eq!(t.cli.estado().gastado, 0);
}

#[test]
fn t11_comision_redondea_hacia_arriba() {
    assert_eq!(calcular_comision(CENTAVO, 100), Some(1_000)); // US$0,01 → 1.000 stroops
    assert_eq!(calcular_comision(1, 100), Some(1));
    assert_eq!(calcular_comision(101, 100), Some(2));
    assert_eq!(calcular_comision(100, 100), Some(1));
    assert_eq!(calcular_comision(i128::MAX, 100), None);
    let t = preparar();
    assert_eq!(pagar(&t, 1), Ok(()));
    assert_eq!(t.cli.estado().comision_pendiente, 1);
}

// ---- Casos borde extra (auditoría Q1, no están en §2.3) ----

#[test]
fn t12_tope_exacto_y_un_stroop_mas() {
    let t = preparar();
    for _ in 0..4 {
        assert_eq!(pagar(&t, CENTAVO), Ok(()));
    }
    // Restan 96.000: 95.049 + ceil(950,49) = 95.049 + 951 = 96.000 exacto.
    assert_eq!(pagar(&t, 95_049), Ok(()));
    let e = t.cli.estado();
    assert_eq!((e.gastado, e.restante), (5 * CENTAVO, 0));
    assert_eq!(pagar(&t, 1), Err(Error::TopeAlcanzado));
}

#[test]
fn t13_varias_transferencias_en_una_auth() {
    let t = preparar();
    let c = |m| ctx_transfer(&t, &t.cuenta, &t.vendedor, m);
    // Se suman todas: 3 × (0,02 + 0,0002) = 606.000 > 500.000.
    assert_eq!(check(&t, &t.agente, vec![&t.env, c(2 * CENTAVO), c(2 * CENTAVO), c(2 * CENTAVO)]), Err(Error::TopeAlcanzado));
    assert_eq!(t.cli.estado().gastado, 0, "un error no deja contadores a medias");
    // Una transferencia válida + una operación prohibida: se rechaza todo.
    let approve = Context::Contract(ContractContext {
        contract: t.token.address.clone(),
        fn_name: Symbol::new(&t.env, "approve"),
        args: (t.cuenta.clone(), t.vendedor.clone(), CENTAVO, 1000u32).into_val(&t.env),
    });
    assert_eq!(check(&t, &t.agente, vec![&t.env, c(CENTAVO), approve]), Err(Error::OperacionNoPermitida));
    // Dos válidas: cuentan las dos.
    assert_eq!(check(&t, &t.agente, vec![&t.env, c(CENTAVO), c(CENTAVO)]), Ok(()));
    assert_eq!(t.cli.estado().gastado, 2 * (CENTAVO + 1_000));
}

#[test]
fn t14_borde_del_fin_de_periodo() {
    let t = preparar();
    t.env.ledger().with_mut(|l| l.timestamp = AHORA + 30 * DIA - 1);
    assert_eq!(pagar(&t, CENTAVO), Ok(()));
    t.env.ledger().with_mut(|l| l.timestamp = AHORA + 30 * DIA);
    assert_eq!(pagar(&t, CENTAVO), Err(Error::PeriodoVencido));
    // `renovar` no acepta más de 32 días
    let ahora = AHORA + 30 * DIA;
    assert_eq!(t.cli.try_renovar(&(5 * CENTAVO), &(2 * CENTAVO), &(ahora + 32 * DIA + 1), &0), Err(Ok(Error::PeriodoInvalido)));
    t.cli.renovar(&(5 * CENTAVO), &(2 * CENTAVO), &(ahora + 32 * DIA), &0);
    assert_eq!(t.cli.estado().gastado, 0);
}

#[test]
fn t15_overflow_no_rompe_el_tope() {
    let t = preparar();
    t.cli.renovar(&i128::MAX, &i128::MAX, &(AHORA + DIA), &0);
    // monto × fee_bps desborda → error controlado, sin pánico ni gasto.
    assert_eq!(pagar(&t, i128::MAX), Err(Error::MontoInvalido));
    // Montos grandes válidos: el segundo haría desbordar gastado + monto + comisión.
    let grande = i128::MAX / 1000;
    for _ in 0..990 {
        assert_eq!(pagar(&t, grande), Ok(()));
    }
    let antes = t.cli.estado().gastado;
    assert_eq!(pagar(&t, grande), Err(Error::TopeAlcanzado));
    assert_eq!(t.cli.estado().gastado, antes);
    assert!(t.cli.estado().gastado <= i128::MAX);
}

#[test]
fn t16_firmas_de_mas_y_monto_negativo() {
    let t = preparar();
    let payload = BytesN::<32>::random(&t.env);
    let f = |k: &SigningKey| {
        let sig = k.sign(&payload.to_array()).to_bytes();
        FirmaAgente { public_key: publica(&t.env, k), signature: BytesN::from_array(&t.env, &sig) }
    };
    let dos = vec![&t.env, f(&t.agente), f(&t.agente)];
    let r = t.env.try_invoke_contract_check_auth::<Error>(&t.cuenta, &payload, dos.into_val(&t.env), &vec![&t.env, ctx_transfer(&t, &t.cuenta, &t.vendedor, CENTAVO)]);
    assert_eq!(r.map_err(|e| e.unwrap()), Err(Error::FirmaInvalida));
    assert_eq!(pagar(&t, -1), Err(Error::MontoInvalido));
}

#[test]
#[should_panic]
fn t17_constructor_rechaza_fee_mayor_a_100_por_ciento() {
    let env = Env::default();
    let a = Address::generate(&env);
    env.register(CuentaPresupuesto, (a.clone(), BytesN::<32>::random(&env), a.clone(), a, 10_001u32));
}
