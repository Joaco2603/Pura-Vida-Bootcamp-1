#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, BytesN, Env,
    String, Vec,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyRegistered = 1,
    InvalidResult = 2,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Game {
    pub registrar: Address,
    pub white: String,
    pub black: String,
    pub result: u32,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Game(BytesN<32>),
    ByRegistrar(Address),
}

const TTL_THRESHOLD: u32 = 100_000;
const TTL_EXTEND_TO: u32 = 500_000;

#[contract]
pub struct ChessRegistry;

#[contractimpl]
impl ChessRegistry {
    pub fn register_game(
        env: Env,
        registrar: Address,
        pgn_hash: BytesN<32>,
        white: String,
        black: String,
        result: u32,
    ) -> Result<(), Error> {
        registrar.require_auth();
        if result > 2 {
            return Err(Error::InvalidResult);
        }
        let key = DataKey::Game(pgn_hash.clone());
        let store = env.storage().persistent();
        if store.has(&key) {
            return Err(Error::AlreadyRegistered);
        }
        let game = Game {
            registrar: registrar.clone(),
            white,
            black,
            result,
            timestamp: env.ledger().timestamp(),
        };
        store.set(&key, &game);
        store.extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND_TO);

        let rkey = DataKey::ByRegistrar(registrar.clone());
        let mut list: Vec<BytesN<32>> = store.get(&rkey).unwrap_or(Vec::new(&env));
        list.push_back(pgn_hash.clone());
        store.set(&rkey, &list);
        store.extend_ttl(&rkey, TTL_THRESHOLD, TTL_EXTEND_TO);

        env.events()
            .publish((symbol_short!("game_reg"), registrar), pgn_hash);
        Ok(())
    }

    pub fn get_game(env: Env, pgn_hash: BytesN<32>) -> Option<Game> {
        env.storage().persistent().get(&DataKey::Game(pgn_hash))
    }

    pub fn games_by(env: Env, registrar: Address) -> Vec<BytesN<32>> {
        env.storage()
            .persistent()
            .get(&DataKey::ByRegistrar(registrar))
            .unwrap_or(Vec::new(&env))
    }
}

mod test;
