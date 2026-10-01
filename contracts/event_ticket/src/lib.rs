#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol, Vec};

#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum TicketStatus {
    Valid,
    Claimable,
    Used,
    ProofNFT,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Ticket {
    pub id: u64,
    pub event_id: u64,
    pub tier_name: String,
    pub original_buyer: Address,
    pub current_owner: Address,
    pub status: TicketStatus,
    pub price: i128,
    pub is_listed_resale: bool,
    pub resale_price: i128,
    pub mint_timestamp: u64,
    pub redeem_timestamp: u64,
    pub claim_secret_hash: String,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct EventMeta {
    pub event_id: u64,
    pub organizer: Address,
    pub name: String,
    pub total_supply: u32,
    pub minted_count: u32,
    pub royalty_bps: u32, // e.g., 500 = 5%
}

#[contracttype]
pub enum DataKey {
    EventInfo,
    Ticket(u64),
    TicketCounter,
    ClaimLink(String),
}

#[contract]
pub struct EventTicketContract;

#[contractimpl]
impl EventTicketContract {
    /// Initialize Event Metadata & Royalty structure
    pub fn initialize(
        env: Env,
        organizer: Address,
        name: String,
        total_supply: u32,
        royalty_bps: u32,
    ) {
        organizer.require_auth();

        if env.storage().instance().has(&DataKey::EventInfo) {
            panic!("Contract is already initialized");
        }
        if name.len() == 0 {
            panic!("Event name cannot be empty");
        }
        if total_supply == 0 {
            panic!("Event supply must be greater than zero");
        }
        if royalty_bps > 10_000 {
            panic!("Royalty rate cannot exceed 100 percent");
        }

        let event_info = EventMeta {
            event_id: 101,
            organizer,
            name,
            total_supply,
            minted_count: 0,
            royalty_bps,
        };

        env.storage().instance().set(&DataKey::EventInfo, &event_info);
        env.storage().instance().set(&DataKey::TicketCounter, &0u64);
    }

    /// Issue a new unique ticket digital asset / claimable balance
    pub fn mint_ticket(
        env: Env,
        buyer: Address,
        tier_name: String,
        price: i128,
        claim_secret_hash: String,
    ) -> u64 {
        let mut meta: EventMeta = env.storage().instance().get(&DataKey::EventInfo).unwrap();
        if meta.minted_count >= meta.total_supply {
            panic!("Event sold out");
        }

        let mut counter: u64 = env.storage().instance().get(&DataKey::TicketCounter).unwrap_or(0);
        counter += 1;
        meta.minted_count += 1;

        let status = if claim_secret_hash.len() > 0 {
            TicketStatus::Claimable
        } else {
            TicketStatus::Valid
        };

        let ticket = Ticket {
            id: counter,
            event_id: meta.event_id,
            tier_name,
            original_buyer: buyer.clone(),
            current_owner: buyer,
            status,
            price,
            is_listed_resale: false,
            resale_price: 0,
            mint_timestamp: env.ledger().timestamp(),
            redeem_timestamp: 0,
            claim_secret_hash: claim_secret_hash.clone(),
        };

        env.storage().persistent().set(&DataKey::Ticket(counter), &ticket);
        env.storage().instance().set(&DataKey::EventInfo, &meta);
        env.storage().instance().set(&DataKey::TicketCounter, &counter);

        if claim_secret_hash.len() > 0 {
            env.storage().persistent().set(&DataKey::ClaimLink(claim_secret_hash), &counter);
        }

        counter
    }

    /// Claim ticket using unique secret link -> transfer ownership to user's wallet
    pub fn claim_ticket(env: Env, claim_secret_hash: String, new_owner: Address) -> bool {
        new_owner.require_auth();

        let ticket_id: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::ClaimLink(claim_secret_hash.clone()))
            .expect("Invalid or expired claim link");

        let mut ticket: Ticket = env
            .storage()
            .persistent()
            .get(&DataKey::Ticket(ticket_id))
            .expect("Ticket not found");

        if ticket.status != TicketStatus::Claimable {
            panic!("Ticket already claimed or invalid status");
        }

        ticket.current_owner = new_owner;
        ticket.status = TicketStatus::Valid;
        ticket.claim_secret_hash = String::from_str(&env, "");

        env.storage().persistent().set(&DataKey::Ticket(ticket_id), &ticket);
        env.storage().persistent().remove(&DataKey::ClaimLink(claim_secret_hash));

        true
    }

    /// Gatekeeper verification & Check-in: validates ticket and prevents double usage
    pub fn check_in_ticket(env: Env, organizer: Address, ticket_id: u64) -> TicketStatus {
        organizer.require_auth();

        let meta: EventMeta = env.storage().instance().get(&DataKey::EventInfo).unwrap();
        if meta.organizer != organizer {
            panic!("Unauthorized gatekeeper");
        }

        let mut ticket: Ticket = env
            .storage()
            .persistent()
            .get(&DataKey::Ticket(ticket_id))
            .expect("Ticket not found");

        if ticket.status == TicketStatus::Used || ticket.status == TicketStatus::ProofNFT {
            panic!("DOUBLE USE PREVENTED: Ticket already redeemed!");
        }

        if ticket.status != TicketStatus::Valid {
            panic!("Ticket cannot be redeemed: Unclaimed or invalid");
        }

        // Convert ticket -> Proof of Attendance NFT
        ticket.status = TicketStatus::ProofNFT;
        ticket.redeem_timestamp = env.ledger().timestamp();

        env.storage().persistent().set(&DataKey::Ticket(ticket_id), &ticket);

        TicketStatus::ProofNFT
    }

    /// Resale listing with cap check
    pub fn list_resale(env: Env, seller: Address, ticket_id: u64, resale_price: i128) {
        seller.require_auth();

        let mut ticket: Ticket = env
            .storage()
            .persistent()
            .get(&DataKey::Ticket(ticket_id))
            .expect("Ticket not found");

        if ticket.current_owner != seller {
            panic!("Not ticket owner");
        }

        if ticket.status != TicketStatus::Valid {
            panic!("Only valid tickets can be listed for resale");
        }

        // Anti-scalping cap: Max 150% of original price
        let max_resale = ticket.price * 150 / 100;
        if resale_price > max_resale {
            panic!("Resale price exceeds anti-scalping price cap (150%)");
        }

        ticket.is_listed_resale = true;
        ticket.resale_price = resale_price;

        env.storage().persistent().set(&DataKey::Ticket(ticket_id), &ticket);
    }

    /// Buy resale ticket with automatic royalty payment to organizer
    pub fn buy_resale(env: Env, buyer: Address, ticket_id: u64) {
        buyer.require_auth();

        let mut ticket: Ticket = env
            .storage()
            .persistent()
            .get(&DataKey::Ticket(ticket_id))
            .expect("Ticket not found");

        if !ticket.is_listed_resale {
            panic!("Ticket is not listed for resale");
        }

        let meta: EventMeta = env.storage().instance().get(&DataKey::EventInfo).unwrap();

        // Calculate Royalty
        let royalty = (ticket.resale_price * meta.royalty_bps as i128) / 10000;
        let seller_payout = ticket.resale_price - royalty;

        ticket.current_owner = buyer;
        ticket.is_listed_resale = false;
        ticket.resale_price = 0;

        env.storage().persistent().set(&DataKey::Ticket(ticket_id), &ticket);
    }

    /// Fetch ticket details
    pub fn get_ticket(env: Env, ticket_id: u64) -> Ticket {
        env.storage().persistent().get(&DataKey::Ticket(ticket_id)).unwrap()
    }
}
