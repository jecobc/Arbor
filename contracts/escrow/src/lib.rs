#![no_std]

use arbiter::{ArbiterClient, Ruling};
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, token, Address, Env, String, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum MilestoneStatus {
    Funded,
    InProgress,
    Approved,
    Released,
    Disputed,
    Refunded,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Milestone {
    pub title: String,
    pub amount: i128,
    pub status: MilestoneStatus,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct EscrowData {
    pub client: Address,
    pub freelancer: Address,
    pub token: Address,
    pub arbiter_contract: Address,
    pub milestones: Vec<Milestone>,
    pub created_at: u64,
}

#[contracttype]
enum DataKey {
    EscrowCount,
    Escrow(u64),
}

#[contract]
pub struct Escrow;

#[contractimpl]
impl Escrow {
    pub fn create_escrow(
        env: Env,
        client: Address,
        freelancer: Address,
        token: Address,
        arbiter_contract: Address,
        milestones: Vec<(String, i128)>,
    ) -> u64 {
        client.require_auth();

        if client == freelancer {
            panic!("client and freelancer must differ");
        }
        let count = milestones.len();
        if !(2..=4).contains(&count) {
            panic!("must have between 2 and 4 milestones");
        }

        let mut total: i128 = 0;
        let mut stored_milestones: Vec<Milestone> = Vec::new(&env);
        for (title, amount) in milestones.iter() {
            if amount <= 0 {
                panic!("milestone amount must be positive");
            }
            total += amount;
            stored_milestones.push_back(Milestone {
                title,
                amount,
                status: MilestoneStatus::Funded,
            });
        }

        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&client, &env.current_contract_address(), &total);

        let id_count: u64 = env.storage().instance().get(&DataKey::EscrowCount).unwrap_or(0);
        let id = id_count + 1;

        let data = EscrowData {
            client,
            freelancer,
            token,
            arbiter_contract,
            milestones: stored_milestones,
            created_at: env.ledger().timestamp(),
        };

        env.storage().instance().set(&DataKey::Escrow(id), &data);
        env.storage().instance().set(&DataKey::EscrowCount, &id);

        env.events().publish(("escrow", symbol_short!("created")), id);

        id
    }

    pub fn start_milestone(env: Env, id: u64, index: u32) {
        let mut data = Self::load(&env, id);
        data.freelancer.require_auth();

        let mut milestone = data.milestones.get(index).expect("invalid milestone index");
        if milestone.status != MilestoneStatus::Funded {
            panic!("milestone not in Funded state");
        }
        milestone.status = MilestoneStatus::InProgress;
        data.milestones.set(index, milestone);

        env.storage().instance().set(&DataKey::Escrow(id), &data);
        env.events().publish(("escrow", symbol_short!("started")), (id, index));
    }

    pub fn approve_and_release(env: Env, id: u64, index: u32) {
        let mut data = Self::load(&env, id);
        data.client.require_auth();

        let mut milestone = data.milestones.get(index).expect("invalid milestone index");
        if milestone.status != MilestoneStatus::Funded && milestone.status != MilestoneStatus::InProgress {
            panic!("milestone not releasable");
        }

        let amount = milestone.amount;
        let token_client = token::Client::new(&env, &data.token);
        token_client.transfer(&env.current_contract_address(), &data.freelancer, &amount);

        milestone.status = MilestoneStatus::Released;
        data.milestones.set(index, milestone);
        env.storage().instance().set(&DataKey::Escrow(id), &data);

        env.events()
            .publish(("escrow", symbol_short!("released")), (id, index, amount));
    }

    pub fn resolve_dispute(env: Env, id: u64, index: u32) {
        let mut data = Self::load(&env, id);

        let mut milestone = data.milestones.get(index).expect("invalid milestone index");
        if milestone.status != MilestoneStatus::Disputed {
            panic!("milestone not disputed");
        }

        let arbiter_client = ArbiterClient::new(&env, &data.arbiter_contract);
        let ruling = arbiter_client.get_ruling(&id, &index);

        let amount = milestone.amount;
        let token_client = token::Client::new(&env, &data.token);

        match ruling {
            Ruling::Pending => panic!("awaiting arbiter ruling"),
            Ruling::FavorFreelancer => {
                token_client.transfer(&env.current_contract_address(), &data.freelancer, &amount);
                milestone.status = MilestoneStatus::Released;
            }
            Ruling::FavorClient => {
                token_client.transfer(&env.current_contract_address(), &data.client, &amount);
                milestone.status = MilestoneStatus::Refunded;
            }
        }

        data.milestones.set(index, milestone.clone());
        env.storage().instance().set(&DataKey::Escrow(id), &data);

        env.events()
            .publish(("escrow", symbol_short!("resolved")), (id, index, milestone.status));
    }

    pub fn get_escrow(env: Env, id: u64) -> EscrowData {
        Self::load(&env, id)
    }

    pub fn get_progress(env: Env, id: u64) -> (i128, i128) {
        let data = Self::load(&env, id);
        let mut released_total: i128 = 0;
        let mut locked_total: i128 = 0;
        for milestone in data.milestones.iter() {
            match milestone.status {
                MilestoneStatus::Released | MilestoneStatus::Refunded => {
                    released_total += milestone.amount;
                }
                _ => {
                    locked_total += milestone.amount;
                }
            }
        }
        (released_total, locked_total)
    }

    pub fn get_escrow_count(env: Env) -> u64 {
        env.storage().instance().get(&DataKey::EscrowCount).unwrap_or(0)
    }

    fn load(env: &Env, id: u64) -> EscrowData {
        env.storage()
            .instance()
            .get(&DataKey::Escrow(id))
            .expect("escrow not found")
    }
}

mod test;
