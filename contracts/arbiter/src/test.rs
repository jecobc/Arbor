#![cfg(test)]

use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::Env;

fn setup(env: &Env) -> (ArbiterClient<'_>, Address) {
    let arbiter_address = Address::generate(env);
    let contract_id = env.register(Arbiter, ());
    let client = ArbiterClient::new(env, &contract_id);
    client.init(&arbiter_address);
    (client, arbiter_address)
}

#[test]
fn test_file_dispute_stores_pending() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _arbiter) = setup(&env);

    let raiser = Address::generate(&env);
    let dispute_id = client.file_dispute(&1u64, &0u32, &raiser, &String::from_str(&env, "Deliverable incomplete"));

    let dispute = client.get_dispute(&dispute_id);
    assert_eq!(dispute.ruling, Ruling::Pending);
    assert_eq!(dispute.escrow_id, 1u64);
    assert_eq!(dispute.milestone_index, 0u32);
}

#[test]
fn test_rule_requires_arbiter_auth() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, arbiter_address) = setup(&env);

    let raiser = Address::generate(&env);
    let dispute_id = client.file_dispute(&1u64, &0u32, &raiser, &String::from_str(&env, "reason"));

    client.rule(&dispute_id, &Ruling::FavorFreelancer);

    let auths = env.auths();
    assert_eq!(auths.len(), 1);
    assert_eq!(auths[0].0, arbiter_address);
}

#[test]
#[should_panic(expected = "dispute already ruled")]
fn test_cannot_rerule_decided_dispute() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _arbiter) = setup(&env);

    let raiser = Address::generate(&env);
    let dispute_id = client.file_dispute(&1u64, &0u32, &raiser, &String::from_str(&env, "reason"));

    client.rule(&dispute_id, &Ruling::FavorFreelancer);
    client.rule(&dispute_id, &Ruling::FavorClient);
}
