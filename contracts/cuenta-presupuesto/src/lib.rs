#![no_std]
//! QuickChain — `cuenta-presupuesto` (docs/PLAN-OPUS.md §2).
//!
//! Cuenta-contrato `C…` por dueño. Guarda el USDC del mes y su `__check_auth`
//! solo deja pasar `token.transfer(C, to, monto)` firmadas por la llave ed25519
//! del agente, dentro del tope del periodo (comisión incluida), del máximo por
//! llamada y antes del fin del periodo. Acumula una comisión (1 % = 100 bps)
//! que cualquiera puede mandar a la tesorería fija con `cobrar_comision`.
//! Sin admin ni `upgrade`: nadie cambia las reglas después del constructor.
use soroban_sdk::{
    auth::{Context, CustomAccountInterface},
    contract, contracterror, contractimpl, contracttype,
    crypto::Hash,
    symbol_short, token, Address, BytesN, Env, TryFromVal, Vec,
};

/// Ledgers por día (~5 s por ledger).
const DIA_LEDGERS: u32 = 17_280;
/// Duración máxima de un periodo: 32 días.
const MAX_PERIODO_SEG: u64 = 32 * 24 * 60 * 60;

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Config {
    pub owner: Address,
    pub token: Address,
    pub tesoreria: Address,
    pub fee_bps: u32,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Politica {
    pub agente: BytesN<32>,
    pub tope: i128,
    pub max_por_llamada: i128,
    pub fin_periodo: u64,
    pub pausada: bool,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Contadores {
    pub periodo: u32,
    /// Gastado en el periodo, comisión incluida.
    pub gastado: i128,
    /// Comisión acumulada sin cobrar (no se reinicia al renovar).
    pub comision_pendiente: i128,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Estado {
    pub owner: Address,
    pub agente: BytesN<32>,
    pub token: Address,
    pub tesoreria: Address,
    pub fee_bps: u32,
    pub periodo: u32,
    pub tope: i128,
    pub max_por_llamada: i128,
    pub gastado: i128,
    pub restante: i128,
    pub fin_periodo: u64,
    pub pausada: bool,
    pub comision_pendiente: i128,
    pub saldo: i128,
}

/// Firma del agente: misma forma que produce `authorizeEntry` del stellar-sdk
/// con un `Keypair` (`Vec<{public_key, signature}>`).
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct FirmaAgente {
    pub public_key: BytesN<32>,
    pub signature: BytesN<64>,
}

#[contracttype]
#[derive(Clone)]
pub enum Clave {
    Config,
    Politica,
    Contadores,
}

#[contracterror]
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    Pausada = 1,
    PeriodoVencido = 2,
    FirmaInvalida = 3,
    AgenteDesconocido = 4,
    OperacionNoPermitida = 5,
    MontoInvalido = 6,
    MontoPorLlamada = 7,
    TopeAlcanzado = 8,
    PeriodoInvalido = 9,
    ParametrosInvalidos = 10,
}

#[contract]
pub struct CuentaPresupuesto;

fn config(env: &Env) -> Config {
    env.storage().instance().get(&Clave::Config).unwrap()
}
fn politica(env: &Env) -> Politica {
    env.storage().instance().get(&Clave::Politica).unwrap()
}
fn contadores(env: &Env) -> Contadores {
    env.storage().instance().get(&Clave::Contadores).unwrap()
}
fn guardar_politica(env: &Env, p: &Politica) {
    env.storage().instance().set(&Clave::Politica, p);
}
fn guardar_contadores(env: &Env, c: &Contadores) {
    env.storage().instance().set(&Clave::Contadores, c);
}
fn extender_ttl(env: &Env) {
    // Al menos dos periodos (64 días), sin pasar el máximo de la red.
    let max = env.storage().max_ttl();
    let hasta = core::cmp::min(64 * DIA_LEDGERS, max);
    let umbral = core::cmp::min(32 * DIA_LEDGERS, hasta);
    env.storage().instance().extend_ttl(umbral, hasta);
}
fn saldo(env: &Env, cfg: &Config) -> i128 {
    token::TokenClient::new(env, &cfg.token).balance(&env.current_contract_address())
}

/// Comisión redondeada hacia arriba: ceil(monto * fee_bps / 10_000).
pub fn calcular_comision(monto: i128, fee_bps: u32) -> Option<i128> {
    let num = monto.checked_mul(fee_bps as i128)?;
    Some((num.checked_add(9_999)?) / 10_000)
}

fn cobrar_pendiente(env: &Env, cfg: &Config) -> i128 {
    let mut c = contadores(env);
    let disponible = saldo(env, cfg);
    let monto = core::cmp::min(c.comision_pendiente, disponible);
    if monto > 0 {
        token::TokenClient::new(env, &cfg.token).transfer(
            &env.current_contract_address(),
            &cfg.tesoreria,
            &monto,
        );
        c.comision_pendiente -= monto;
        guardar_contadores(env, &c);
    }
    monto
}

#[contractimpl]
impl CuentaPresupuesto {
    pub fn __constructor(
        env: Env,
        owner: Address,
        agente: BytesN<32>,
        token: Address,
        tesoreria: Address,
        fee_bps: u32,
    ) -> Result<(), Error> {
        if fee_bps > 10_000 {
            return Err(Error::ParametrosInvalidos);
        }
        env.storage().instance().set(
            &Clave::Config,
            &Config { owner, token, tesoreria, fee_bps },
        );
        // Sin presupuesto hasta el primer `renovar`: tope 0 y periodo vencido.
        guardar_politica(
            &env,
            &Politica { agente, tope: 0, max_por_llamada: 0, fin_periodo: 0, pausada: false },
        );
        guardar_contadores(&env, &Contadores { periodo: 0, gastado: 0, comision_pendiente: 0 });
        extender_ttl(&env);
        Ok(())
    }

    /// La "firma única" del mes (dueño). Cobra la comisión pendiente, deposita
    /// `recarga` desde el dueño, reinicia `gastado` y abre un periodo nuevo.
    pub fn renovar(
        env: Env,
        tope: i128,
        max_por_llamada: i128,
        fin_periodo: u64,
        recarga: i128,
    ) -> Result<(), Error> {
        let cfg = config(&env);
        cfg.owner.require_auth();
        if tope <= 0 || max_por_llamada <= 0 || max_por_llamada > tope || recarga < 0 {
            return Err(Error::ParametrosInvalidos);
        }
        let ahora = env.ledger().timestamp();
        if fin_periodo <= ahora || fin_periodo > ahora.saturating_add(MAX_PERIODO_SEG) {
            return Err(Error::PeriodoInvalido);
        }
        cobrar_pendiente(&env, &cfg);
        if recarga > 0 {
            token::TokenClient::new(&env, &cfg.token).transfer(
                &cfg.owner,
                &env.current_contract_address(),
                &recarga,
            );
        }
        let mut p = politica(&env);
        p.tope = tope;
        p.max_por_llamada = max_por_llamada;
        p.fin_periodo = fin_periodo;
        guardar_politica(&env, &p);
        let mut c = contadores(&env);
        c.periodo = c.periodo.checked_add(1).ok_or(Error::ParametrosInvalidos)?;
        c.gastado = 0;
        guardar_contadores(&env, &c);
        extender_ttl(&env);
        env.events().publish((symbol_short!("renovar"), c.periodo), (tope, max_por_llamada, fin_periodo, recarga));
        Ok(())
    }

    pub fn pausar(env: Env) {
        config(&env).owner.require_auth();
        let mut p = politica(&env);
        p.pausada = true;
        guardar_politica(&env, &p);
        env.events().publish((symbol_short!("pausa"),), true);
    }

    pub fn reanudar(env: Env) {
        config(&env).owner.require_auth();
        let mut p = politica(&env);
        p.pausada = false;
        guardar_politica(&env, &p);
        env.events().publish((symbol_short!("pausa"),), false);
    }

    /// Rota la llave del agente (dueño).
    pub fn cambiar_agente(env: Env, agente: BytesN<32>) {
        config(&env).owner.require_auth();
        let mut p = politica(&env);
        p.agente = agente.clone();
        guardar_politica(&env, &p);
        env.events().publish((symbol_short!("agente"),), agente);
    }

    /// Retiro del dueño; no puede tocar la comisión pendiente.
    pub fn retirar(env: Env, a: Address, monto: i128) -> Result<(), Error> {
        let cfg = config(&env);
        cfg.owner.require_auth();
        if monto <= 0 {
            return Err(Error::MontoInvalido);
        }
        let libre = saldo(&env, &cfg) - contadores(&env).comision_pendiente;
        if monto > libre {
            return Err(Error::ParametrosInvalidos);
        }
        token::TokenClient::new(&env, &cfg.token).transfer(&env.current_contract_address(), &a, &monto);
        Ok(())
    }

    /// Pública: manda min(pendiente, saldo) a la tesorería fija.
    pub fn cobrar_comision(env: Env) -> i128 {
        let cfg = config(&env);
        cobrar_pendiente(&env, &cfg)
    }

    pub fn estado(env: Env) -> Estado {
        let cfg = config(&env);
        let p = politica(&env);
        let c = contadores(&env);
        let s = saldo(&env, &cfg);
        Estado {
            owner: cfg.owner,
            agente: p.agente,
            token: cfg.token,
            tesoreria: cfg.tesoreria,
            fee_bps: cfg.fee_bps,
            periodo: c.periodo,
            tope: p.tope,
            max_por_llamada: p.max_por_llamada,
            gastado: c.gastado,
            restante: if p.tope > c.gastado { p.tope - c.gastado } else { 0 },
            fin_periodo: p.fin_periodo,
            pausada: p.pausada,
            comision_pendiente: c.comision_pendiente,
            saldo: s,
        }
    }
}

#[contractimpl]
impl CustomAccountInterface for CuentaPresupuesto {
    type Signature = Vec<FirmaAgente>;
    type Error = Error;

    /// No emite eventos (los facilitadores estrictos solo aceptan `transfer`).
    #[allow(non_snake_case)]
    fn __check_auth(
        env: Env,
        payload: Hash<32>,
        firmas: Vec<FirmaAgente>,
        ctxs: Vec<Context>,
    ) -> Result<(), Error> {
        let cfg = config(&env);
        let p = politica(&env);
        // 1. no pausada; antes del fin del periodo
        if p.pausada {
            return Err(Error::Pausada);
        }
        if env.ledger().timestamp() >= p.fin_periodo {
            return Err(Error::PeriodoVencido);
        }
        // 2. exactamente una firma, de la llave del agente
        if firmas.len() != 1 {
            return Err(Error::FirmaInvalida);
        }
        let f = firmas.get_unchecked(0);
        if f.public_key != p.agente {
            return Err(Error::AgenteDesconocido);
        }
        env.crypto().ed25519_verify(&f.public_key, &payload.into(), &f.signature);
        // 3-5. cada contexto: token.transfer(C, to != C, 0 < monto <= max)
        if ctxs.is_empty() {
            return Err(Error::OperacionNoPermitida);
        }
        let yo = env.current_contract_address();
        let mut c = contadores(&env);
        for ctx in ctxs.iter() {
            let cc = match ctx {
                Context::Contract(cc) => cc,
                _ => return Err(Error::OperacionNoPermitida),
            };
            if cc.contract != cfg.token || cc.fn_name != symbol_short!("transfer") || cc.args.len() != 3 {
                return Err(Error::OperacionNoPermitida);
            }
            let from = Address::try_from_val(&env, &cc.args.get_unchecked(0))
                .map_err(|_| Error::OperacionNoPermitida)?;
            let to = Address::try_from_val(&env, &cc.args.get_unchecked(1))
                .map_err(|_| Error::OperacionNoPermitida)?;
            let monto = i128::try_from_val(&env, &cc.args.get_unchecked(2))
                .map_err(|_| Error::OperacionNoPermitida)?;
            if from != yo || to == yo {
                return Err(Error::OperacionNoPermitida);
            }
            if monto <= 0 {
                return Err(Error::MontoInvalido);
            }
            if monto > p.max_por_llamada {
                return Err(Error::MontoPorLlamada);
            }
            let comision = calcular_comision(monto, cfg.fee_bps).ok_or(Error::MontoInvalido)?;
            let nuevo = c
                .gastado
                .checked_add(monto)
                .and_then(|x| x.checked_add(comision))
                .ok_or(Error::TopeAlcanzado)?;
            if nuevo > p.tope {
                return Err(Error::TopeAlcanzado);
            }
            c.gastado = nuevo;
            c.comision_pendiente = c
                .comision_pendiente
                .checked_add(comision)
                .ok_or(Error::MontoInvalido)?;
        }
        guardar_contadores(&env, &c);
        Ok(())
    }
}

#[cfg(test)]
mod test;
