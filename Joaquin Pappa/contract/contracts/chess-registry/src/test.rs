#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, BytesN, Env, String};

fn hash(env: &Env, b: u8) -> BytesN<32> {
    BytesN::from_array(env, &[b; 32])
}

#[test]
fn registers_and_reads() {
    let env = Env::default();
    env.mock_all_auths();
    let id = env.register(ChessRegistry, ());
    let client = ChessRegistryClient::new(&env, &id);
    let user = Address::generate(&env);
    let h = hash(&env, 1);

    client.register_game(&user, &h, &String::from_str(&env, "Ana"), &String::from_str(&env, "Beto"), &0);

    let g = client.get_game(&h).unwrap();
    assert_eq!(g.result, 0);
    assert_eq!(g.registrar, user);
    assert_eq!(client.games_by(&user).len(), 1);
}

#[test]
fn duplicate_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let id = env.register(ChessRegistry, ());
    let client = ChessRegistryClient::new(&env, &id);
    let user = Address::generate(&env);
    let h = hash(&env, 2);
    let w = String::from_str(&env, "Ana");
    let b = String::from_str(&env, "Beto");

    client.register_game(&user, &h, &w, &b, &2);
    let r = client.try_register_game(&user, &h, &w, &b, &2);
    assert_eq!(r, Err(Ok(Error::AlreadyRegistered)));
}

#[test]
fn invalid_result_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let id = env.register(ChessRegistry, ());
    let client = ChessRegistryClient::new(&env, &id);
    let user = Address::generate(&env);
    let r = client.try_register_game(
        &user, &hash(&env, 3), &String::from_str(&env, "A"), &String::from_str(&env, "B"), &3,
    );
    assert_eq!(r, Err(Ok(Error::InvalidResult)));
}

#[test]
#[should_panic]
fn requires_auth() {
    let env = Env::default(); // sin mock_all_auths
    let id = env.register(ChessRegistry, ());
    let client = ChessRegistryClient::new(&env, &id);
    let user = Address::generate(&env);
    client.register_game(&user, &hash(&env, 4), &String::from_str(&env, "A"), &String::from_str(&env, "B"), &0);
}

#[test]
fn unknown_game_is_none() {
    let env = Env::default();
    let id = env.register(ChessRegistry, ());
    let client = ChessRegistryClient::new(&env, &id);
    assert!(client.get_game(&hash(&env, 9)).is_none());
}
