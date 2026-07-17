#![no_std]

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env, String};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum Ruling {
    Pending,
    FavorFreelancer,
    FavorClient,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Dispute {
    pub escrow_id: u64,
    pub milestone_index: u32,
    pub raised_by: Address,
    pub reason: String,
    pub ruling: Ruling,
}

#[contracttype]
enum DataKey {
    ArbiterAddress,
    DisputeCount,
    Dispute(u64),
    // maps (escrow_id, milestone_index) -> dispute_id
    EscrowMilestoneDispute(u64, u32),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    DisputeNotFound = 3,
    AlreadyRuled = 4,
    NoDisputeForMilestone = 5,
}

#[contract]
pub struct Arbiter;

#[contractimpl]
impl Arbiter {
    pub fn init(env: Env, arbiter_address: Address) {
        if env.storage().instance().has(&DataKey::ArbiterAddress) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::ArbiterAddress, &arbiter_address);
        env.storage().instance().set(&DataKey::DisputeCount, &0u64);
    }

    pub fn file_dispute(
        env: Env,
        escrow_id: u64,
        milestone_index: u32,
        raised_by: Address,
        reason: String,
    ) -> u64 {
        raised_by.require_auth();

        let count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::DisputeCount)
            .unwrap_or(0);
        let dispute_id = count + 1;

        let dispute = Dispute {
            escrow_id,
            milestone_index,
            raised_by,
            reason,
            ruling: Ruling::Pending,
        };

        env.storage().instance().set(&DataKey::Dispute(dispute_id), &dispute);
        env.storage().instance().set(
            &DataKey::EscrowMilestoneDispute(escrow_id, milestone_index),
            &dispute_id,
        );
        env.storage().instance().set(&DataKey::DisputeCount, &dispute_id);

        env.events()
            .publish(("arbiter", symbol_short!("filed")), (dispute_id, escrow_id, milestone_index));

        dispute_id
    }

    pub fn rule(env: Env, dispute_id: u64, ruling: Ruling) {
        let arbiter_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::ArbiterAddress)
            .expect("not initialized");
        arbiter_address.require_auth();

        let mut dispute: Dispute = env
            .storage()
            .instance()
            .get(&DataKey::Dispute(dispute_id))
            .expect("dispute not found");

        if dispute.ruling != Ruling::Pending {
            panic!("dispute already ruled");
        }

        dispute.ruling = ruling.clone();
        env.storage().instance().set(&DataKey::Dispute(dispute_id), &dispute);

        env.events()
            .publish(("arbiter", symbol_short!("ruled")), (dispute_id, ruling));
    }

    pub fn get_ruling(env: Env, escrow_id: u64, milestone_index: u32) -> Ruling {
        let dispute_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::EscrowMilestoneDispute(escrow_id, milestone_index))
            .expect("no dispute filed for this milestone");
        let dispute: Dispute = env
            .storage()
            .instance()
            .get(&DataKey::Dispute(dispute_id))
            .expect("dispute not found");
        dispute.ruling
    }

    pub fn get_dispute(env: Env, dispute_id: u64) -> Dispute {
        env.storage()
            .instance()
            .get(&DataKey::Dispute(dispute_id))
            .expect("dispute not found")
    }
}

mod test;
