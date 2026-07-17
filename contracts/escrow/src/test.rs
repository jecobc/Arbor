#![cfg(test)]

use super::*;
use arbiter::Arbiter;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::Env;

fn setup(env: &Env) -> (EscrowClient<'_>, ArbiterClient<'_>, Address, Address, Address, Address) {
    let client_addr = Address::generate(env);
    let freelancer = Address::generate(env);
    let arbiter_owner = Address::generate(env);

    let sac = env.register_stellar_asset_contract_v2(client_addr.clone());
    let token_address = sac.address();
    let token_admin = token::StellarAssetClient::new(env, &token_address);
    token_admin.mint(&client_addr, &1_000_000_000i128);

    let arbiter_id = env.register(Arbiter, ());
    let arbiter_client = ArbiterClient::new(env, &arbiter_id);
    arbiter_client.init(&arbiter_owner);

    let escrow_id = env.register(Escrow, ());
    let escrow_client = EscrowClient::new(env, &escrow_id);

    (
        escrow_client,
        arbiter_client,
        client_addr,
        freelancer,
        token_address,
        arbiter_id,
    )
}

fn milestones(env: &Env) -> Vec<(String, i128)> {
    let mut v = Vec::new(env);
    v.push_back((String::from_str(env, "Design"), 100i128));
    v.push_back((String::from_str(env, "Build"), 200i128));
    v.push_back((String::from_str(env, "Ship"), 300i128));
    v
}

#[test]
fn test_create_escrow_locks_total() {
    let env = Env::default();
    env.mock_all_auths();
    let (escrow, _arbiter, client_addr, freelancer, token_address, arbiter_id) = setup(&env);

    let id = escrow.create_escrow(&client_addr, &freelancer, &token_address, &arbiter_id, &milestones(&env));

    let token_client = token::Client::new(&env, &token_address);
    assert_eq!(token_client.balance(&escrow.address), 600i128);
    assert_eq!(id, 1u64);
}

#[test]
fn test_approve_and_release_pays_exact_amount() {
    let env = Env::default();
    env.mock_all_auths();
    let (escrow, _arbiter, client_addr, freelancer, token_address, arbiter_id) = setup(&env);
    let id = escrow.create_escrow(&client_addr, &freelancer, &token_address, &arbiter_id, &milestones(&env));

    escrow.approve_and_release(&id, &0);

    let token_client = token::Client::new(&env, &token_address);
    assert_eq!(token_client.balance(&freelancer), 100i128);

    let data = escrow.get_escrow(&id);
    assert_eq!(data.milestones.get(0).unwrap().status, MilestoneStatus::Released);
}

#[test]
#[should_panic]
fn test_raise_dispute_blocks_release() {
    let env = Env::default();
    env.mock_all_auths();
    let (escrow, _arbiter, client_addr, freelancer, token_address, arbiter_id) = setup(&env);
    let id = escrow.create_escrow(&client_addr, &freelancer, &token_address, &arbiter_id, &milestones(&env));

    escrow.raise_dispute(&id, &0, &client_addr, &String::from_str(&env, "Deliverable incomplete"));
    escrow.approve_and_release(&id, &0);
}

#[test]
fn test_resolve_dispute_favor_freelancer_pays_freelancer() {
    let env = Env::default();
    env.mock_all_auths();
    let (escrow, arbiter, client_addr, freelancer, token_address, arbiter_id) = setup(&env);
    let id = escrow.create_escrow(&client_addr, &freelancer, &token_address, &arbiter_id, &milestones(&env));

    escrow.raise_dispute(&id, &1, &freelancer, &String::from_str(&env, "Client unresponsive"));
    let dispute_id = 1u64;
    arbiter.rule(&dispute_id, &Ruling::FavorFreelancer);

    escrow.resolve_dispute(&id, &1);

    let token_client = token::Client::new(&env, &token_address);
    assert_eq!(token_client.balance(&freelancer), 200i128);

    let data = escrow.get_escrow(&id);
    assert_eq!(data.milestones.get(1).unwrap().status, MilestoneStatus::Released);
}

#[test]
fn test_resolve_dispute_favor_client_refunds_client() {
    let env = Env::default();
    env.mock_all_auths();
    let (escrow, arbiter, client_addr, freelancer, token_address, arbiter_id) = setup(&env);
    let id = escrow.create_escrow(&client_addr, &freelancer, &token_address, &arbiter_id, &milestones(&env));

    escrow.raise_dispute(&id, &2, &client_addr, &String::from_str(&env, "Not delivered"));
    let dispute_id = 1u64;
    arbiter.rule(&dispute_id, &Ruling::FavorClient);

    let balance_before = token::Client::new(&env, &token_address).balance(&client_addr);
    escrow.resolve_dispute(&id, &2);
    let balance_after = token::Client::new(&env, &token_address).balance(&client_addr);

    assert_eq!(balance_after - balance_before, 300i128);

    let data = escrow.get_escrow(&id);
    assert_eq!(data.milestones.get(2).unwrap().status, MilestoneStatus::Refunded);
}

#[test]
#[should_panic(expected = "awaiting arbiter ruling")]
fn test_resolve_dispute_before_ruling_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let (escrow, _arbiter, client_addr, freelancer, token_address, arbiter_id) = setup(&env);
    let id = escrow.create_escrow(&client_addr, &freelancer, &token_address, &arbiter_id, &milestones(&env));

    escrow.raise_dispute(&id, &0, &client_addr, &String::from_str(&env, "reason"));
    escrow.resolve_dispute(&id, &0);
}

#[test]
#[should_panic(expected = "must have between 2 and 4 milestones")]
fn test_create_validation() {
    let env = Env::default();
    env.mock_all_auths();
    let (escrow, _arbiter, client_addr, freelancer, token_address, arbiter_id) = setup(&env);

    let mut one = Vec::new(&env);
    one.push_back((String::from_str(&env, "Only"), 100i128));
    escrow.create_escrow(&client_addr, &freelancer, &token_address, &arbiter_id, &one);
}
